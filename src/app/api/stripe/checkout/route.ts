import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, STRIPE_PRICE_IDS, TIER_NAMES } from '@/lib/stripe/server';
import { ONE_TIME_TIERS, SUBSCRIPTION_TIERS } from '@/types/database';

/**
 * POST /api/stripe/checkout
 * Body: { tier: string }
 *
 * Crée une Stripe Checkout Session.
 * - Packs recruteur Solo/Équipe/Campagne + add-ons → mode: 'payment' (one-time)
 * - Abonnements candidat + Agence recruteur → mode: 'subscription'
 * - Si l'utilisateur a déjà un stripe_customer_id, on le réutilise
 * - Les metadata contiennent user_id + tier pour le webhook
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 1. Auth
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // 2. Parse body
  let body: { tier?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const tier = body.tier;
  if (!tier || !STRIPE_PRICE_IDS[tier]) {
    return NextResponse.json({ error: 'Tier invalide' }, { status: 400 });
  }

  // 3. Vérifier que ce n'est pas "free"
  if (tier === 'free') {
    return NextResponse.json({ error: 'Pas besoin de payer pour le plan gratuit' }, { status: 400 });
  }

  // 4. Récupérer le profil utilisateur
  const { data: user } = await supabase
    .from('users')
    .select('id, email, full_name, stripe_customer_id, tier, stripe_subscription_id')
    .eq('id', authUser.id)
    .single();

  if (!user) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
  }

  // 5. Déterminer le mode de paiement
  const isOneTime = ONE_TIME_TIERS.has(tier);

  // Pour les abonnements, si l'utilisateur en a déjà un, rediriger vers le portail
  if (!isOneTime && user.stripe_subscription_id) {
    return NextResponse.json({
      error: 'Vous avez déjà un abonnement actif. Utilisez le portail pour le modifier.',
      redirect: '/api/stripe/portal',
    }, { status: 409 });
  }

  const priceId = STRIPE_PRICE_IDS[tier];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    // 6. Créer la session Stripe Checkout
    const sessionParams: Record<string, unknown> = {
      mode: isOneTime ? 'payment' : 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard/subscription?success=true&tier=${tier}`,
      cancel_url: `${appUrl}/dashboard/subscription?canceled=true`,
      metadata: {
        user_id: user.id,
        tier: tier,
        payment_type: isOneTime ? 'one_time' : 'subscription',
      },
      allow_promotion_codes: true,
    };

    // Pour les abonnements, ajouter subscription_data avec metadata
    if (!isOneTime) {
      sessionParams.subscription_data = {
        metadata: {
          user_id: user.id,
          tier: tier,
        },
      };
    }

    // Pour les paiements one-time, ajouter payment_intent_data avec metadata
    if (isOneTime) {
      sessionParams.payment_intent_data = {
        metadata: {
          user_id: user.id,
          tier: tier,
          payment_type: 'one_time',
        },
      };
    }

    // Réutiliser le customer existant ou pré-remplir l'email
    if (user.stripe_customer_id) {
      sessionParams.customer = user.stripe_customer_id;
    } else {
      sessionParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams as any);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe Checkout error:', err);
    return NextResponse.json({ error: 'Erreur lors de la création de la session de paiement' }, { status: 500 });
  }
}
