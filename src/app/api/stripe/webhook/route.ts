import { NextRequest, NextResponse } from 'next/server';
import { stripe, getTierFromPriceId, TIER_NAMES } from '@/lib/stripe/server';
import type { SubscriptionTier, RecruiterPack, RecruiterAddon } from '@/types/database';
import { ONE_TIME_TIERS, TIER_LIMITS, RECRUITER_ADDON_CREDITS } from '@/types/database';
import { sendEmail } from '@/lib/email';
import { paymentConfirmationEmail } from '@/lib/email/templates/payment-confirmation';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Webhook Stripe — endpoint public, authentifié par signature webhook.
 *
 * IMPORTANT : Ce webhook utilise le service role Supabase (pas la clé anon)
 * car il doit modifier la table users sans passer par RLS.
 */

/**
 * Met à jour le tier et les infos Stripe d'un utilisateur.
 */
async function updateUserSubscription(
  userId: string,
  data: {
    tier?: SubscriptionTier;
    stripe_customer_id?: string;
    stripe_subscription_id?: string | null;
    subscription_status?: string;
    subscription_period_end?: string | null;
  }
) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('users')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error(`Webhook: erreur update user ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Initialise ou ajoute des crédits recruteur après un achat de pack ou add-on.
 */
async function applyRecruiterCredits(
  userId: string,
  tier: string
) {
  const supabase = getSupabaseAdmin();

  // Vérifier si c'est un add-on
  const addonCredits = RECRUITER_ADDON_CREDITS[tier as RecruiterAddon];
  if (addonCredits) {
    // Add-on : ajouter les crédits au solde existant
    const { data: currentUser } = await supabase
      .from('users')
      .select('recruiter_annonces_remaining, recruiter_deblocages_remaining, recruiter_boosts_remaining')
      .eq('id', userId)
      .single();

    const current = currentUser || { recruiter_annonces_remaining: 0, recruiter_deblocages_remaining: 0, recruiter_boosts_remaining: 0 };

    await supabase.from('users').update({
      recruiter_annonces_remaining: (current.recruiter_annonces_remaining || 0) + addonCredits.annonces,
      recruiter_deblocages_remaining: (current.recruiter_deblocages_remaining || 0) + addonCredits.deblocages,
      recruiter_boosts_remaining: (current.recruiter_boosts_remaining || 0) + addonCredits.boosts,
      updated_at: new Date().toISOString(),
    }).eq('id', userId);

    console.log(`🛒 Add-on applied: user=${userId} addon=${tier}`);
    return;
  }

  // Pack recruteur : initialiser les crédits
  const packLimits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];
  if (packLimits && 'annonces' in packLimits) {
    const limits = packLimits as typeof TIER_LIMITS['solo'];
    await supabase.from('users').update({
      recruiter_annonces_remaining: limits.annonces === Infinity ? 999 : limits.annonces,
      recruiter_deblocages_remaining: limits.deblocages_included,
      recruiter_boosts_remaining: limits.boosts_included,
      recruiter_pack_purchased_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', userId);

    console.log(`📦 Pack credits initialized: user=${userId} pack=${tier} annonces=${limits.annonces} deblocages=${limits.deblocages_included} boosts=${limits.boosts_included}`);
  }
}

/**
 * Trouve un utilisateur par son stripe_customer_id.
 */
async function findUserByCustomerId(customerId: string) {
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from('users')
    .select('id, tier, stripe_customer_id')
    .eq('stripe_customer_id', customerId)
    .single();

  return data;
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET manquant');
    return NextResponse.json({ error: 'Configuration webhook manquante' }, { status: 500 });
  }

  // 1. Vérifier la signature Stripe
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  // 2. Traiter les événements
  try {
    switch (event.type) {
      /**
       * checkout.session.completed
       * → L'utilisateur a terminé le paiement.
       * → On crée/met à jour son abonnement.
       */
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const tier = session.metadata?.tier as string;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string | null;
        const isOneTime = session.metadata?.payment_type === 'one_time' || ONE_TIME_TIERS.has(tier || '');

        if (!userId || !tier) {
          console.error('Webhook checkout: metadata manquante', { userId, tier });
          break;
        }

        if (isOneTime) {
          // ====== PAIEMENT UNIQUE (pack recruteur ou add-on) ======
          // Mettre à jour le customer_id + tier (pour les packs, pas les add-ons)
          const isAddon = ['deblocage_1', 'deblocage_5', 'boost', 'annonce_sup'].includes(tier);

          const updateData: Record<string, unknown> = {
            stripe_customer_id: customerId,
          };

          // Les packs (solo/equipe/campagne) changent le tier
          if (!isAddon) {
            updateData.tier = tier as SubscriptionTier;
            updateData.subscription_status = 'active';
          }

          await updateUserSubscription(userId, updateData as any);

          // Initialiser/ajouter les crédits recruteur
          await applyRecruiterCredits(userId, tier);

          console.log(`✅ One-time checkout completed: user=${userId} tier=${tier} addon=${isAddon}`);
        } else {
          // ====== ABONNEMENT (candidat ou agence recruteur) ======
          let periodEnd: string | null = null;
          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
          }

          await updateUserSubscription(userId, {
            tier: tier as SubscriptionTier,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: 'active',
            subscription_period_end: periodEnd,
          });

          // Pour l'agence, initialiser aussi les crédits recruteur
          if (tier === 'agency') {
            await applyRecruiterCredits(userId, tier);
          }

          console.log(`✅ Subscription checkout completed: user=${userId} tier=${tier}`);
        }

        // Envoyer l'email de confirmation de paiement
        const supabaseAdmin = getSupabaseAdmin();
        const { data: paidUser } = await supabaseAdmin
          .from('users')
          .select('email, full_name')
          .eq('id', userId)
          .single();

        if (paidUser?.email) {
          const tierDisplay = TIER_NAMES[tier]?.split(' (')[0] || tier;
          const tierAmount = TIER_NAMES[tier]?.match(/\((.+)\)/)?.[1] || '';
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

          const emailData = paymentConfirmationEmail({
            fullName: paidUser.full_name || 'Utilisateur',
            tierName: tierDisplay,
            amount: tierAmount,
            appUrl,
          });
          sendEmail({ to: paidUser.email, subject: emailData.subject, html: emailData.html }).catch(() => {});
        }

        break;
      }

      /**
       * customer.subscription.updated
       * → Changement de plan (upgrade/downgrade), renouvellement, ou changement de statut.
       */
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        const status = subscription.status; // active, past_due, canceled, etc.
        const priceId = subscription.items.data[0]?.price?.id;
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

        const user = await findUserByCustomerId(customerId);
        if (!user) {
          console.error('Webhook sub.updated: user non trouvé pour customer', customerId);
          break;
        }

        // Déterminer le nouveau tier si le prix a changé
        const newTier = priceId ? getTierFromPriceId(priceId) : null;

        const updateData: Record<string, unknown> = {
          subscription_status: status,
          subscription_period_end: periodEnd,
          stripe_subscription_id: subscription.id,
        };

        // Si le plan a changé, mettre à jour le tier
        if (newTier && newTier !== user.tier) {
          updateData.tier = newTier;
          console.log(`📦 Plan change: user=${user.id} ${user.tier} → ${newTier}`);
        }

        // Si l'abonnement est annulé ou impayé, rétrograder à free
        if (status === 'canceled' || status === 'unpaid') {
          updateData.tier = 'free';
          updateData.stripe_subscription_id = null;
          console.log(`⬇️ Downgrade to free: user=${user.id} reason=${status}`);
        }

        await updateUserSubscription(user.id, updateData as any);
        console.log(`✅ Subscription updated: user=${user.id} status=${status}`);
        break;
      }

      /**
       * customer.subscription.deleted
       * → Abonnement supprimé/annulé définitivement.
       * → Rétrograder à free.
       */
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const user = await findUserByCustomerId(customerId);
        if (!user) {
          console.error('Webhook sub.deleted: user non trouvé pour customer', customerId);
          break;
        }

        await updateUserSubscription(user.id, {
          tier: 'free',
          stripe_subscription_id: null,
          subscription_status: 'canceled',
          subscription_period_end: null,
        });

        console.log(`❌ Subscription deleted: user=${user.id} → free`);
        break;
      }

      /**
       * invoice.payment_failed
       * → Paiement échoué — on garde le tier mais on marque past_due.
       */
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        const user = await findUserByCustomerId(customerId);
        if (!user) break;

        await updateUserSubscription(user.id, {
          subscription_status: 'past_due',
        });

        console.log(`⚠️ Payment failed: user=${user.id}`);
        break;
      }

      default:
        // Événement non géré — on ignore silencieusement
        break;
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    // Retourner 500 pour que Stripe re-essaie (important : un paiement validé
    // mais non traité côté BDD = utilisateur qui paie sans recevoir son tier)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
