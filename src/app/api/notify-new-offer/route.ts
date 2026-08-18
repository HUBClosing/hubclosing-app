import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get: () => undefined, set: () => {}, remove: () => {} } }
  );
}

// POST /api/notify-new-offer — notifier les candidats d'une nouvelle offre
// Respecte les préférences : all, filtered (niches/types), none
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  // Vérifier que l'utilisateur est bien recruteur ou admin
  const serviceClient = createServiceClient();
  const { data: userData } = await serviceClient
    .from('users')
    .select('role_type, role, full_name')
    .eq('id', user.id)
    .single();

  if (!userData || (userData.role_type !== 'recruiter' && userData.role !== 'admin')) {
    return NextResponse.json({ error: 'Réservé aux recruteurs' }, { status: 403 });
  }

  const body = await req.json();
  const { offer_id } = body;

  if (!offer_id) {
    return NextResponse.json({ error: 'offer_id requis' }, { status: 400 });
  }

  // Récupérer l'offre
  const { data: offer } = await serviceClient
    .from('offers')
    .select('id, title, offer_type, niche, commission_rate, product_type')
    .eq('id', offer_id)
    .single();

  if (!offer) {
    return NextResponse.json({ error: 'Offre non trouvée' }, { status: 404 });
  }

  // Récupérer TOUS les candidats avec leurs préférences de notification
  const { data: candidates, error: candidatesError } = await serviceClient
    .from('users')
    .select('id, email, full_name, notif_offers, notif_offer_niches, notif_offer_types')
    .or('role_type.eq.candidate,active_role.eq.candidate');

  if (candidatesError || !candidates || candidates.length === 0) {
    return NextResponse.json({ success: true, notified: 0 });
  }

  // Filtrer les candidats selon leurs préférences
  const eligibleCandidates = candidates.filter((candidate) => {
    const pref = candidate.notif_offers || 'all';

    // 'none' → pas de notification
    if (pref === 'none') return false;

    // 'all' → toujours notifié
    if (pref === 'all') return true;

    // 'filtered' → vérifier niches et types
    const prefNiches: string[] = candidate.notif_offer_niches || [];
    const prefTypes: string[] = candidate.notif_offer_types || [];

    // Si aucun filtre configuré, ne pas notifier (ils n'ont rien sélectionné)
    if (prefNiches.length === 0 && prefTypes.length === 0) return false;

    // Match niche (insensible à la casse)
    const nicheMatch = prefNiches.length === 0 || (
      offer.niche && prefNiches.some(n =>
        n.toLowerCase() === offer.niche.toLowerCase()
      )
    );

    // Match type
    const typeMatch = prefTypes.length === 0 || prefTypes.includes(offer.offer_type);

    // Au moins un critère doit matcher
    return nicheMatch || typeMatch;
  });

  // Créer les notifications in-app
  const recruiterName = userData.full_name || 'Un recruteur';
  const offerTypeLabels: Record<string, string> = {
    challenge: 'Challenge',
    recurring: 'Recurring',
    mission: 'Mission',
    full_time: 'CDI',
    part_time: 'Temps partiel',
    commission_only: 'Commission',
  };
  const typeLabel = offerTypeLabels[offer.offer_type] || offer.offer_type;

  const notifications = eligibleCandidates.map((candidate) => ({
    user_id: candidate.id,
    type: 'new_offer' as const,
    title: `Nouvelle offre : ${offer.title}`,
    body: `${recruiterName} vient de publier une offre ${typeLabel}${offer.niche ? ` dans le secteur ${offer.niche}` : ''}. ${offer.commission_rate ? `Commission : ${offer.commission_rate}%` : ''}`,
    link: `/dashboard/marketplace/${offer.id}`,
    is_read: false,
    email_sent: false,
    metadata: {
      offer_id: offer.id,
      offer_type: offer.offer_type,
      niche: offer.niche,
      recruiter_name: recruiterName,
    },
  }));

  // Insérer les notifications par batch de 500
  let totalInserted = 0;
  for (let i = 0; i < notifications.length; i += 500) {
    const batch = notifications.slice(i, i + 500);
    const { error: insertError } = await serviceClient
      .from('notifications')
      .insert(batch);

    if (!insertError) {
      totalInserted += batch.length;
    } else {
      console.error('Erreur insertion notifications batch:', insertError.message);
    }
  }

  return NextResponse.json({
    success: true,
    notified: totalInserted,
    skipped: candidates.length - eligibleCandidates.length,
    offer_title: offer.title,
  });
}
