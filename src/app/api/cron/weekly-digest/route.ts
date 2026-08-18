import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get: () => undefined, set: () => {}, remove: () => {} } }
  );
}

// GET /api/cron/weekly-digest — envoi hebdo du récap des nouvelles offres
// Appelé par Vercel Cron chaque lundi à 8h
export async function GET(req: NextRequest) {
  // Vérifier le secret CRON pour sécuriser l'endpoint
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Récupérer les offres actives publiées dans les 7 derniers jours
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: newOffers, error: offersError } = await supabase
    .from('offers')
    .select(`
      id, title, offer_type, niche, commission_rate,
      product_type, product_price_range, created_at,
      manager_id
    `)
    .eq('status', 'active')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  if (offersError) {
    console.error('Erreur récupération offres:', offersError.message);
    return NextResponse.json({ error: offersError.message }, { status: 500 });
  }

  if (!newOffers || newOffers.length === 0) {
    return NextResponse.json({ success: true, message: 'Aucune nouvelle offre cette semaine', sent: 0 });
  }

  // Récupérer les noms des recruteurs
  const managerIds = [...new Set(newOffers.map(o => o.manager_id))];
  const { data: managers } = await supabase
    .from('users')
    .select('id, full_name, company_name')
    .in('id', managerIds);

  const managerMap = new Map(
    (managers || []).map(m => [m.id, m.company_name || m.full_name || 'Recruteur'])
  );

  // Récupérer tous les candidats avec email et préférences
  const { data: candidates, error: candidatesError } = await supabase
    .from('users')
    .select('id, email, full_name, notif_offers, notif_offer_niches, notif_offer_types')
    .or('role_type.eq.candidate,active_role.eq.candidate')
    .not('email', 'is', null)
    .neq('notif_offers', 'none');

  if (candidatesError || !candidates || candidates.length === 0) {
    return NextResponse.json({ success: true, message: 'Aucun candidat à notifier', sent: 0 });
  }

  // Vérifier les préférences email (auth metadata)
  const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });

  const optedOutEmails = new Set<string>();
  if (authUsers?.users) {
    for (const authUser of authUsers.users) {
      const notifPrefs = (authUser.user_metadata as Record<string, any>)?.notifications;
      if (notifPrefs && notifPrefs.email === false) {
        optedOutEmails.add(authUser.email || '');
      }
    }
  }

  // Filtrer : pas d'opt-out email
  const eligibleCandidates = candidates.filter(c => !optedOutEmails.has(c.email));

  if (eligibleCandidates.length === 0) {
    return NextResponse.json({ success: true, message: 'Tous les candidats ont désactivé les emails', sent: 0 });
  }

  // Fonction pour filtrer les offres selon les préférences d'un candidat
  function filterOffersForCandidate(
    candidate: { notif_offers: string | null; notif_offer_niches: string[] | null; notif_offer_types: string[] | null },
    offers: typeof newOffers
  ) {
    const pref = candidate.notif_offers || 'all';
    if (pref === 'all') return offers;

    const prefNiches = candidate.notif_offer_niches || [];
    const prefTypes = candidate.notif_offer_types || [];

    if (prefNiches.length === 0 && prefTypes.length === 0) return [];

    return offers.filter(offer => {
      const nicheMatch = prefNiches.length === 0 || (
        offer.niche && prefNiches.some((n: string) => n.toLowerCase() === (offer.niche || '').toLowerCase())
      );
      const typeMatch = prefTypes.length === 0 || prefTypes.includes(offer.offer_type);
      return nicheMatch || typeMatch;
    });
  }

  // Construire le HTML du digest
  const offerTypeLabels: Record<string, string> = {
    challenge: 'Challenge',
    recurring: 'Recurring',
    mission: 'Mission',
    full_time: 'CDI',
    part_time: 'Temps partiel',
    commission_only: 'Commission',
  };

  // Helper pour construire le HTML d'une liste d'offres
  function buildOffersHtml(offers: typeof newOffers) {
    return offers.map(offer => {
      const typeLabel = offerTypeLabels[offer.offer_type] || offer.offer_type;
      const recruiterName = managerMap.get(offer.manager_id) || 'Recruteur';
      const commission = offer.commission_rate ? `${offer.commission_rate}%` : '—';
      const niche = offer.niche || '—';
      const date = new Date(offer.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
      });

      return `
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #f0f0f0;">
            <div style="margin-bottom: 6px;">
              <a href="https://hubclosing.fr/dashboard/marketplace/${offer.id}"
                 style="color: #0A0F08; font-weight: 600; font-size: 15px; text-decoration: none;">
                ${offer.title}
              </a>
            </div>
            <div style="font-size: 13px; color: #666;">
              <span style="display: inline-block; background: #F05A28; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-right: 8px;">${typeLabel}</span>
              <span style="margin-right: 12px;">📍 ${niche}</span>
              <span style="margin-right: 12px;">💰 ${commission}</span>
              <span>🏢 ${recruiterName}</span>
            </div>
            <div style="font-size: 12px; color: #999; margin-top: 4px;">Publiée le ${date}</div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Envoyer les emails par batch de 10 (limite Resend)
  let totalSent = 0;
  let totalSkipped = 0;
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  for (let i = 0; i < eligibleCandidates.length; i += 10) {
    const batch = eligibleCandidates.slice(i, i + 10);

    const emailPromises = batch.map(candidate => {
      // Filtrer les offres selon les préférences du candidat
      const candidateOffers = filterOffersForCandidate(candidate, newOffers);

      // Si aucune offre ne matche les préférences, skip
      if (candidateOffers.length === 0) {
        totalSkipped++;
        return null;
      }

      const firstName = candidate.full_name?.split(' ')[0] || 'Closer';
      const offersHtml = buildOffersHtml(candidateOffers);
      const count = candidateOffers.length;

      return resend.emails.send({
        from: 'HUBClosing <noreply@hubclosing.fr>',
        to: candidate.email,
        subject: `🚀 ${count} nouvelle${count > 1 ? 's' : ''} offre${count > 1 ? 's' : ''} cette semaine sur HUBClosing`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; background: #F05A28; color: white; font-size: 24px; font-weight: bold; width: 50px; height: 50px; line-height: 50px; border-radius: 12px;">H</div>
              <h1 style="color: #0A0F08; margin-top: 10px; font-size: 22px;">HUBClosing</h1>
            </div>

            <!-- Intro -->
            <p style="color: #333; font-size: 15px; line-height: 1.6;">
              Bonjour ${firstName},
            </p>
            <p style="color: #333; font-size: 15px; line-height: 1.6;">
              Voici les <strong>${count} nouvelle${count > 1 ? 's' : ''} offre${count > 1 ? 's' : ''}</strong> publiée${count > 1 ? 's' : ''} cette semaine${candidate.notif_offers === 'filtered' ? ' correspondant à vos critères' : ''} :
            </p>

            <!-- Offres -->
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #fafafa; border-radius: 12px; overflow: hidden;">
              <tbody>
                ${offersHtml}
              </tbody>
            </table>

            <!-- CTA -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://hubclosing.fr/dashboard/marketplace"
                 style="display: inline-block; background: #F05A28; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Voir toutes les offres
              </a>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #eee; padding-top: 16px; margin-top: 30px;">
              <p style="color: #999; font-size: 12px; text-align: center; line-height: 1.5;">
                Vous recevez cet email car vous êtes inscrit sur HUBClosing.<br/>
                Pour gérer vos préférences de notification, rendez-vous dans vos
                <a href="https://hubclosing.fr/dashboard/settings" style="color: #F05A28; text-decoration: none;">paramètres</a>.
              </p>
              <p style="color: #ccc; font-size: 11px; text-align: center;">
                HUBClosing — La 1ère plateforme dédiée au closing
              </p>
            </div>
          </div>
        `,
      }).catch((err: Error) => {
        console.error(`Erreur envoi digest à ${candidate.email}:`, err.message);
        return null;
      });
    });

    const results = await Promise.all(emailPromises);
    totalSent += results.filter(r => r !== null).length;

    // Pause 1 seconde entre les batch pour respecter les limites Resend
    if (i + 10 < eligibleCandidates.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return NextResponse.json({
    success: true,
    offers_count: newOffers.length,
    candidates_count: eligibleCandidates.length,
    emails_sent: totalSent,
    skipped_no_match: totalSkipped,
  });
}
