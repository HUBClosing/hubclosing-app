import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';

/**
 * POST /api/stripe/portal
 *
 * Crée une session Stripe Customer Portal pour que l'utilisateur puisse :
 * - Changer de plan (upgrade/downgrade)
 * - Mettre à jour sa carte de paiement
 * - Voir ses factures
 * - Annuler son abonnement
 *
 * Nécessite que l'utilisateur ait déjà un stripe_customer_id.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 1. Auth
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // 2. Récupérer le stripe_customer_id
  const { data: user } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', authUser.id)
    .single();

  if (!user?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'Aucun abonnement trouvé. Souscrivez d\'abord à un plan.' },
      { status: 404 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    // 3. Créer la session du portail client
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${appUrl}/dashboard/subscription`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error('Stripe Portal error:', err);
    return NextResponse.json({ error: 'Erreur lors de l\'ouverture du portail' }, { status: 500 });
  }
}
