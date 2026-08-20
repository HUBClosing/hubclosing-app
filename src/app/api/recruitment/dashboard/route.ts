import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function createSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set() {},
        remove() {},
      },
    }
  );
}

// GET /api/recruitment/dashboard — données agrégées du dashboard recrutement
export async function GET() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // 1. Charger les offres du recruteur
  const { data: offers } = await supabase
    .from('offers')
    .select('id, title, description, offer_type, niche, commission_rate, status, application_count, views_count, is_premium, is_boosted, created_at, updated_at')
    .eq('manager_id', user.id)
    .order('created_at', { ascending: false });

  // 2. Charger les candidatures pour ces offres
  const offerIds = (offers || []).map(o => o.id);
  let applicationsMap: Record<string, Array<{
    id: string;
    status: string;
    created_at: string;
    closer: {
      id: string;
      full_name: string;
      avatar_url: string | null;
      niches: string[];
      skills: string[];
      years_experience: number | null;
    } | null;
  }>> = {};

  if (offerIds.length > 0) {
    const { data: applications } = await supabase
      .from('applications')
      .select('id, offer_id, closer_id, status, created_at')
      .in('offer_id', offerIds)
      .order('created_at', { ascending: false });

    if (applications && applications.length > 0) {
      // Charger les closers
      const closerIds = Array.from(new Set(applications.map(a => a.closer_id)));
      const { data: closers } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, niches, skills, years_experience')
        .in('id', closerIds);

      const closerMap: Record<string, { id: string; full_name: string; avatar_url: string | null; niches: string[]; skills: string[]; years_experience: number | null }> = {};
      if (closers) {
        for (const c of closers) {
          closerMap[c.id] = {
            id: c.id,
            full_name: c.full_name || 'Candidat',
            avatar_url: c.avatar_url,
            niches: c.niches || [],
            skills: c.skills || [],
            years_experience: c.years_experience,
          };
        }
      }

      // Grouper par offre
      for (const app of applications) {
        if (!applicationsMap[app.offer_id]) applicationsMap[app.offer_id] = [];
        applicationsMap[app.offer_id].push({
          id: app.id,
          status: app.status,
          created_at: app.created_at,
          closer: closerMap[app.closer_id] || null,
        });
      }
    }
  }

  // 3. Charger les événements CRM
  const { data: events } = await supabase
    .from('recruiter_events')
    .select(`
      id, title, event_type, status, start_date, end_date, offer_id,
      event_assignments (
        id, closer_name, status,
        event_performances (
          calls_scheduled, calls_completed, revenue_collected, revenue_invoiced, no_shows, cancellations
        )
      )
    `)
    .eq('manager_id', user.id)
    .order('start_date', { ascending: false });

  // 4. Charger les fiches matching
  const { data: fiches } = await supabase
    .from('matching_fiches')
    .select('id, title, niche, status, created_at')
    .eq('recruiter_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  // Compter les résultats par fiche
  let ficheResultsCounts: Record<string, number> = {};
  if (fiches && fiches.length > 0) {
    const ficheIds = fiches.map(f => f.id);
    const { data: resultCounts } = await supabase
      .from('matching_results')
      .select('fiche_id')
      .in('fiche_id', ficheIds);

    if (resultCounts) {
      for (const r of resultCounts) {
        ficheResultsCounts[r.fiche_id] = (ficheResultsCounts[r.fiche_id] || 0) + 1;
      }
    }
  }

  // 5. Enrichir les offres
  const enrichedOffers = (offers || []).map(offer => ({
    ...offer,
    applications: applicationsMap[offer.id] || [],
    applicationsCount: (applicationsMap[offer.id] || []).length,
    linkedEvents: (events || []).filter(e => e.offer_id === offer.id),
  }));

  // 6. Stats globales
  const allApps = Object.values(applicationsMap).flat();
  const totalRevenue = (events || []).reduce((sum, event) => {
    const assignments = (event.event_assignments as Array<{ status: string; event_performances: Array<{ revenue_collected: number }> }>) || [];
    for (const a of assignments.filter(a => a.status !== 'removed')) {
      for (const p of a.event_performances || []) {
        sum += Number(p.revenue_collected || 0);
      }
    }
    return sum;
  }, 0);

  const totalCalls = (events || []).reduce((sum, event) => {
    const assignments = (event.event_assignments as Array<{ status: string; event_performances: Array<{ calls_completed: number }> }>) || [];
    for (const a of assignments.filter(a => a.status !== 'removed')) {
      for (const p of a.event_performances || []) {
        sum += (p.calls_completed || 0);
      }
    }
    return sum;
  }, 0);

  const acceptedApps = allApps.filter(a => a.status === 'accepted' || a.status === 'completed').length;
  const conversionRate = allApps.length > 0 ? Math.round((acceptedApps / allApps.length) * 100) : 0;

  return NextResponse.json({
    offers: enrichedOffers,
    events: (events || []).map(e => ({
      ...e,
      assignments: e.event_assignments,
    })),
    fiches: (fiches || []).map(f => ({
      ...f,
      results_count: ficheResultsCounts[f.id] || 0,
    })),
    stats: {
      totalOffers: (offers || []).filter(o => o.status === 'active').length,
      totalApplications: allApps.length,
      totalEvents: (events || []).length,
      totalRevenue,
      totalCalls,
      conversionRate,
    },
  });
}
