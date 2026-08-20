import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { MatchingResults } from './matching-results';

export const metadata = { title: 'Résultats Matching IA — HUBClosing' };

export default async function MatchingResultsPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createServerClient(
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Charger les infos recruteur (tier + crédits)
  const { data: recruiterData } = await supabase
    .from('users')
    .select('tier, recruiter_deblocages_remaining, role_type')
    .eq('id', user.id)
    .single();

  const userTier = recruiterData?.tier || 'free';
  const deblocagesRemaining = recruiterData?.recruiter_deblocages_remaining || 0;

  // Charger la fiche
  const { data: fiche, error } = await supabase
    .from('matching_fiches')
    .select('*')
    .eq('id', params.id)
    .eq('recruiter_id', user.id)
    .single();

  if (error || !fiche) {
    redirect('/dashboard/matching');
  }

  // Charger les profils débloqués par ce recruteur
  const { data: unlocks } = await supabase
    .from('profile_unlocks')
    .select('candidate_id')
    .eq('recruiter_id', user.id);

  const unlockedIds = (unlocks || []).map((u: { candidate_id: string }) => u.candidate_id);

  // Charger les résultats avec les infos candidat
  const { data: results } = await supabase
    .from('matching_results')
    .select(`
      id, score, score_details, status, created_at,
      candidate_id
    `)
    .eq('fiche_id', params.id)
    .order('score', { ascending: false });

  // Charger les candidats correspondants
  let candidatesMap: Record<string, { full_name: string; avatar_url: string | null; email: string; niches: string[]; skills: string[]; years_experience: number | null; languages: string[]; loom_url: string | null; training_center: string | null; is_employed: boolean }> = {};

  if (results && results.length > 0) {
    const candidateIds = results.map(r => r.candidate_id);
    const { data: candidates } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, email, niches, skills, years_experience, languages, loom_url, training_center, is_employed')
      .in('id', candidateIds);

    if (candidates) {
      for (const c of candidates) {
        candidatesMap[c.id] = {
          full_name: c.full_name || 'Candidat',
          avatar_url: c.avatar_url,
          email: c.email,
          niches: c.niches || [],
          skills: c.skills || [],
          years_experience: c.years_experience,
          languages: c.languages || [],
          loom_url: c.loom_url,
          training_center: c.training_center,
          is_employed: c.is_employed || false,
        };
      }
    }

    // Charger les profils
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, experience_level, commission_rate, availability, available_hours_per_week, score, badge_level, total_deals_closed, total_revenue_generated, total_reviews')
      .in('user_id', candidateIds);

    if (profiles) {
      for (const p of profiles) {
        const existing = candidatesMap[p.user_id];
        if (existing) {
          (existing as Record<string, unknown>).profile = p;
        }
      }
    }
  }

  // Enrichir les résultats
  const enrichedResults = (results || []).map(r => ({
    ...r,
    candidate: candidatesMap[r.candidate_id] || { full_name: 'Candidat', avatar_url: null, email: '', niches: [], skills: [], years_experience: null, languages: [], loom_url: null, training_center: null, is_employed: false },
  }));

  return (
    <MatchingResults
      fiche={fiche}
      results={enrichedResults}
      unlockedIds={unlockedIds}
      userTier={userTier}
      deblocagesRemaining={deblocagesRemaining}
    />
  );
}
