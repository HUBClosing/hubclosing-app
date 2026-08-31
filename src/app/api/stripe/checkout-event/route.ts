import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/server';


/**
 * POST /api/stripe/checkout-event
 * Body: { event_id: string }
 *
 * Crée une Stripe Checkout Session pour l'inscription à un événement coaching.
 * Prix dynamique défini par le coach (pas de price ID fixe).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let body: { event_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const { event_id } = body;
  if (!event_id) {
    return NextResponse.json({ error: 'event_id requis' }, { status: 400 });
  }

  // Récupérer l'événement
  const serviceClient = getSupabaseAdmin();
  const { data: event } = await serviceClient
    .from('events')
    .select('*, host:users!host_id(full_name, email)')
    .eq('id', event_id)
    .eq('status', 'upcoming')
    .single();

  if (!event) {
    return NextResponse.json({ error: 'Événement non trouvé ou terminé' }, { status: 404 });
  }

  // Vérifier qu'on ne s'inscrit pas à son propre événement
  if (event.host_id === authUser.id) {
    return NextResponse.json({ error: 'Vous ne pouvez pas vous inscrire à votre propre événement' }, { status: 400 });
  }

  // Vérifier si déjà inscrit
  const { data: existingReg } = await serviceClient
    .from('event_registrations')
    .select('id')
    .eq('event_id', event_id)
    .eq('user_id', authUser.id)
    .neq('status', 'cancelled')
    .maybeSingle();

  if (existingReg) {
    return NextResponse.json({ error: 'Vous êtes déjà inscrit à cet événement' }, { status: 409 });
  }

  // Vérifier les places disponibles
  if (event.max_participants) {
    const { count } = await serviceClient
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event_id)
      .neq('status', 'cancelled');

    if ((count || 0) >= event.max_participants) {
      return NextResponse.json({ error: 'Plus de places disponibles' }, { status: 409 });
    }
  }

  // Si l'événement est gratuit, inscrire directement
  if (!event.price || event.price === 0) {
    const { error: regError } = await serviceClient
      .from('event_registrations')
      .insert({
        event_id,
        user_id: authUser.id,
        status: 'registered',
        amount_paid: 0,
        paid_at: new Date().toISOString(),
      });

    if (regError) {
      console.error('Erreur inscription événement gratuit:', regError);
      return NextResponse.json({ error: 'Erreur lors de l\'inscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true, free: true });
  }

  // Récupérer le profil utilisateur pour Stripe
  const { data: user } = await serviceClient
    .from('users')
    .select('id, email, full_name, stripe_customer_id')
    .eq('id', authUser.id)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hubclosing.fr';

  try {
    // Prix dynamique via price_data (pas de price ID fixe)
    const sessionParams: Record<string, unknown> = {
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: event.title,
              description: `Coaching avec ${event.host?.full_name || 'HUBClosing'} — ${new Date(event.start_date).toLocaleDateString('fr-FR')}`,
            },
            unit_amount: event.stripe_price_cents || Math.round(event.price * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard/events?success=true&event_id=${event_id}`,
      cancel_url: `${appUrl}/dashboard/events?canceled=true`,
      metadata: {
        user_id: authUser.id,
        event_id: event_id,
        payment_type: 'event_registration',
      },
      payment_intent_data: {
        metadata: {
          user_id: authUser.id,
          event_id: event_id,
          payment_type: 'event_registration',
        },
      },
    };

    if (user?.stripe_customer_id) {
      sessionParams.customer = user.stripe_customer_id;
    } else if (user?.email) {
      sessionParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams as any);

    // Créer l'inscription en statut pending avec le session_id
    await serviceClient
      .from('event_registrations')
      .insert({
        event_id,
        user_id: authUser.id,
        status: 'registered',
        stripe_session_id: session.id,
        amount_paid: event.stripe_price_cents || Math.round(event.price * 100),
      });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe Checkout event error:', err);
    return NextResponse.json({ error: 'Erreur lors de la création du paiement' }, { status: 500 });
  }
}
