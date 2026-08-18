import { NextRequest, NextResponse } from 'next/server';
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

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get: () => undefined, set: () => {}, remove: () => {} } }
  );
}

// Poids identiques au matching recruteur
const W = {
  niche: 15, skills: 15, experience: 10, years: 5, languages: 10,
  commission: 5, availability: 10, location: 5, reputation: 8,
  performance: 7, loom: 3, training: 3, reviews: 2, revenue: 2,
};

const EXP_ORDER: Record<string, number> = {
  junior: 0, intermediaire: 1, senior: 2, expert: 3,
};

const BADGE_ORDER: Record<string, number> = {
  bronze: 0, silver: 1, gold: 2, platinum: 3, diamond: 4,
};

const MEDAL_ORDER: Record<string, number> = {
  none: 0, bronze: 1, silver: 2, gold: 3, diamond: 4,
};

interface CandidateData {
  id: string;
  niches: string[] | null;
  skills: string[] | null;
  years_experience: number | null;
  languages: string[] | null;
  training_center: string | null;
  is_employed: boolean;
  loom_url: string | null;
}

interface ProfileData {
  user_id: string;
  experience_level: string | null;
  commission_rate: number | null;
  availability: boolean;
  available_hours_per_week: number | null;
  preferred_niches: string[] | null;
  score: number;
  total_reviews: number;
  total_deals_closed: number;
  total_revenue_generated: number;
  badge_level: string;
}

interface CallStatsAgg {
  avg_cash_per_call: number;
  total_revenue: number;
  total_events: number;
  medal: string;
}

interface FicheRow {
  id: string;
  recruiter_id: string;
  title: string;
  niche: string | null;
  required_skills: string[];
  offer_type: string | null;
  experience_level: string | null;
  min_years_experience: number | null;
  languages: string[];
  min_commission_rate: number | null;
  max_commission_rate: number | null;
  location: string | null;
  availability_required: boolean;
  min_hours_per_week: number | null;
  is_employed_preferred: boolean | null;
  min_cash_per_call: number | null;
  min_deals_closed: number | null;
  min_revenue_generated: number | null;
  min_reputation_score: number | null;
  min_badge_level: string | null;
  medal_required: string | null;
  loom_required: boolean;
  training_centers: string[];
  description: string | null;
  status: string;
  created_at: string;
}

function computeScore(
  fiche: FicheRow,
  candidate: CandidateData,
  profile: ProfileData | null,
  stats: CallStatsAgg | null,
  applicationCount: number,
) {
  const details: Record<string, number> = {};

  // 1. NICHE
  if (fiche.niche) {
    const candidateNiches = [
      ...(candidate.niches || []),
      ...(profile?.preferred_niches || []),
    ].map(n => n.toLowerCase());
    const ficheNiche = fiche.niche.toLowerCase();
    if (candidateNiches.some(n => n === ficheNiche)) {
      details.niche = W.niche;
    } else if (candidateNiches.some(n => n.includes(ficheNiche) || ficheNiche.includes(n))) {
      details.niche = W.niche * 0.5;
    } else {
      details.niche = 0;
    }
  } else {
    details.niche = W.niche;
  }

  // 2. SKILLS
  if (fiche.required_skills.length > 0) {
    const candidateSkills = (candidate.skills || []).map((s: string) => s.toLowerCase());
    const matched = fiche.required_skills.filter(s => candidateSkills.includes(s.toLowerCase()));
    details.skills = W.skills * (matched.length / fiche.required_skills.length);
  } else {
    details.skills = W.skills;
  }

  // 3. EXPERIENCE LEVEL
  if (fiche.experience_level && profile?.experience_level) {
    const required = EXP_ORDER[fiche.experience_level] ?? 0;
    const actual = EXP_ORDER[profile.experience_level] ?? 0;
    if (actual >= required) {
      details.experience = W.experience;
    } else {
      const diff = required - actual;
      details.experience = Math.max(0, W.experience * (1 - diff * 0.35));
    }
  } else if (!fiche.experience_level) {
    details.experience = W.experience;
  } else {
    details.experience = W.experience * 0.3;
  }

  // 4. YEARS
  if (fiche.min_years_experience != null) {
    const years = candidate.years_experience || 0;
    if (years >= fiche.min_years_experience) {
      details.years = W.years;
    } else if (years >= fiche.min_years_experience - 2) {
      details.years = W.years * 0.6;
    } else {
      details.years = 0;
    }
  } else {
    details.years = W.years;
  }

  // 5. LANGUAGES
  if (fiche.languages.length > 0) {
    const candidateLangs = (candidate.languages || []).map((l: string) => l.toLowerCase());
    const matched = fiche.languages.filter(l => candidateLangs.includes(l.toLowerCase()));
    details.languages = W.languages * (matched.length / fiche.languages.length);
  } else {
    details.languages = W.languages;
  }

  // 6. COMMISSION
  if (fiche.min_commission_rate != null || fiche.max_commission_rate != null) {
    const rate = profile?.commission_rate;
    if (rate != null) {
      const min = fiche.min_commission_rate ?? 0;
      const max = fiche.max_commission_rate ?? 100;
      if (rate >= min && rate <= max) {
        details.commission = W.commission;
      } else if (rate >= min - 3 || rate <= max + 3) {
        details.commission = W.commission * 0.5;
      } else {
        details.commission = 0;
      }
    } else {
      details.commission = W.commission * 0.3;
    }
  } else {
    details.commission = W.commission;
  }

  // 7. AVAILABILITY
  if (fiche.availability_required) {
    if (profile?.availability) {
      const hours = profile.available_hours_per_week || 0;
      const minHours = fiche.min_hours_per_week || 0;
      if (minHours === 0 || hours >= minHours) {
        details.availability = W.availability;
      } else if (hours >= minHours * 0.7) {
        details.availability = W.availability * 0.6;
      } else {
        details.availability = W.availability * 0.3;
      }
    } else {
      details.availability = 0;
    }
  } else {
    details.availability = W.availability;
  }

  // 8. LOCATION
  if (fiche.location) {
    const ficheLocation = fiche.location.toLowerCase();
    if (ficheLocation.includes('remote') || ficheLocation.includes('distance') || ficheLocation.includes('télétravail')) {
      details.location = W.location;
    } else {
      details.location = W.location * 0.5;
    }
  } else {
    details.location = W.location;
  }

  // 9. REPUTATION
  if (fiche.min_reputation_score != null && profile) {
    if (profile.score >= fiche.min_reputation_score) {
      details.reputation = W.reputation;
    } else {
      details.reputation = W.reputation * (profile.score / fiche.min_reputation_score);
    }
    if (fiche.min_badge_level && profile.badge_level) {
      const required = BADGE_ORDER[fiche.min_badge_level] ?? 0;
      const actual = BADGE_ORDER[profile.badge_level] ?? 0;
      if (actual < required) {
        details.reputation *= 0.7;
      }
    }
  } else if (!fiche.min_reputation_score) {
    details.reputation = W.reputation;
  } else {
    details.reputation = 0;
  }

  // 10. PERFORMANCE
  if (fiche.min_cash_per_call != null || fiche.medal_required) {
    let perfScore = 1;
    if (fiche.min_cash_per_call != null && stats) {
      if (stats.avg_cash_per_call >= fiche.min_cash_per_call) {
        perfScore = 1;
      } else if (stats.avg_cash_per_call >= fiche.min_cash_per_call * 0.7) {
        perfScore = 0.6;
      } else {
        perfScore = 0.2;
      }
    } else if (fiche.min_cash_per_call != null && !stats) {
      perfScore = 0.1;
    }
    if (fiche.medal_required && fiche.medal_required !== 'none') {
      const required = MEDAL_ORDER[fiche.medal_required] ?? 0;
      const actual = stats ? MEDAL_ORDER[stats.medal] ?? 0 : 0;
      if (actual < required) {
        perfScore *= 0.5;
      }
    }
    details.performance = W.performance * perfScore;
  } else {
    details.performance = W.performance;
  }

  // 11. LOOM
  if (fiche.loom_required) {
    details.loom = candidate.loom_url ? W.loom : 0;
  } else {
    details.loom = candidate.loom_url ? W.loom : W.loom * 0.5;
  }

  // 12. TRAINING
  if (fiche.training_centers.length > 0) {
    const candidateTraining = (candidate.training_center || '').toLowerCase();
    if (fiche.training_centers.some(t => t.toLowerCase() === candidateTraining)) {
      details.training = W.training;
    } else if (candidateTraining && candidateTraining !== 'aucune formation') {
      details.training = W.training * 0.3;
    } else {
      details.training = 0;
    }
  } else {
    details.training = W.training;
  }

  // 13. REVIEWS
  if (profile) {
    const reviews = profile.total_reviews || 0;
    if (reviews >= 5) details.reviews = W.reviews;
    else if (reviews >= 2) details.reviews = W.reviews * 0.6;
    else if (reviews >= 1) details.reviews = W.reviews * 0.3;
    else details.reviews = 0;
  } else {
    details.reviews = 0;
  }

  // 14. REVENUE
  if (fiche.min_revenue_generated != null && profile) {
    if (profile.total_revenue_generated >= fiche.min_revenue_generated) {
      details.revenue = W.revenue;
    } else if (profile.total_revenue_generated >= fiche.min_revenue_generated * 0.5) {
      details.revenue = W.revenue * 0.5;
    } else {
      details.revenue = 0;
    }
  } else if (fiche.min_deals_closed != null && profile) {
    if (profile.total_deals_closed >= fiche.min_deals_closed) {
      details.revenue = W.revenue;
    } else {
      details.revenue = W.revenue * (profile.total_deals_closed / fiche.min_deals_closed);
    }
  } else {
    details.revenue = W.revenue;
  }

  // Bonus candidatures
  const bonus = Math.min(3, applicationCount * 0.5);
  const total = Object.values(details).reduce((sum, v) => sum + v, 0) + bonus;
  details.total = Math.min(100, Math.round(total * 10) / 10);

  return details;
}

// GET /api/matching/suggestions — lister les suggestions pour le candidat connecté
export async function GET() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // Vérifier que l'utilisateur est candidat ou both
  const { data: userData } = await supabase
    .from('users')
    .select('role_type')
    .eq('id', user.id)
    .single();

  if (!userData || (userData.role_type !== 'candidate' && userData.role_type !== 'both' && userData.role_type !== 'admin')) {
    return NextResponse.json({ error: 'Accès réservé aux candidats' }, { status: 403 });
  }

  // Récupérer les résultats du candidat
  const { data: results, error } = await supabase
    .from('matching_results')
    .select('id, fiche_id, score, score_details, status, candidate_status, created_at')
    .eq('candidate_id', user.id)
    .gte('score', 10)
    .order('score', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!results || results.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  // Récupérer les fiches correspondantes
  const ficheIds = Array.from(new Set(results.map(r => r.fiche_id)));
  const serviceClient = createServiceClient();

  const { data: fiches } = await serviceClient
    .from('matching_fiches')
    .select('id, recruiter_id, title, niche, offer_type, description, location, status, created_at')
    .in('id', ficheIds)
    .eq('status', 'active');

  const ficheMap = new Map<string, Record<string, unknown>>();
  const recruiterIds: string[] = [];
  if (fiches) {
    for (const f of fiches) {
      ficheMap.set(f.id, f);
      recruiterIds.push(f.recruiter_id);
    }
  }

  // Récupérer les infos recruteurs
  const uniqueRecruiterIds = Array.from(new Set(recruiterIds));
  const { data: recruiters } = await serviceClient
    .from('users')
    .select('id, full_name, avatar_url')
    .in('id', uniqueRecruiterIds);

  const recruiterMap = new Map<string, Record<string, unknown>>();
  if (recruiters) {
    for (const r of recruiters) {
      recruiterMap.set(r.id, r);
    }
  }

  // Enrichir les résultats
  const suggestions = results
    .filter(r => ficheMap.has(r.fiche_id))
    .map(r => {
      const fiche = ficheMap.get(r.fiche_id) as Record<string, unknown>;
      const recruiter = recruiterMap.get(fiche.recruiter_id as string) || {};
      return {
        id: r.id,
        score: r.score,
        score_details: r.score_details,
        candidate_status: r.candidate_status || 'unseen',
        created_at: r.created_at,
        fiche: {
          id: fiche.id,
          title: fiche.title,
          niche: fiche.niche,
          offer_type: fiche.offer_type,
          description: fiche.description,
          location: fiche.location,
        },
        recruiter: {
          full_name: (recruiter as Record<string, unknown>).full_name || 'Recruteur',
          avatar_url: (recruiter as Record<string, unknown>).avatar_url || null,
          company_name: (recruiter as Record<string, unknown>).full_name || null,
        },
      };
    });

  return NextResponse.json({ suggestions });
}

// POST /api/matching/suggestions — calculer les suggestions pour le candidat
export async function POST() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  // Récupérer les données du candidat
  const { data: candidateUser } = await serviceClient
    .from('users')
    .select('id, niches, skills, years_experience, languages, training_center, is_employed, loom_url, role_type')
    .eq('id', user.id)
    .single();

  if (!candidateUser || (candidateUser.role_type !== 'candidate' && candidateUser.role_type !== 'both' && candidateUser.role_type !== 'admin')) {
    return NextResponse.json({ error: 'Accès réservé aux candidats' }, { status: 403 });
  }

  // Profil
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('user_id, experience_level, commission_rate, availability, available_hours_per_week, preferred_niches, score, total_reviews, total_deals_closed, total_revenue_generated, badge_level')
    .eq('user_id', user.id)
    .single();

  // Call stats
  const { data: callStats } = await serviceClient
    .from('call_stats')
    .select('total_revenue, cash_per_call')
    .eq('user_id', user.id);

  let stats: CallStatsAgg | null = null;
  if (callStats && callStats.length > 0) {
    const totalRev = callStats.reduce((s, c) => s + (c.total_revenue || 0), 0);
    const avgCpc = callStats.reduce((s, c) => s + (c.cash_per_call || 0), 0) / callStats.length;
    let medal = 'none';
    if (avgCpc >= 2000) medal = 'diamond';
    else if (avgCpc >= 1000) medal = 'gold';
    else if (avgCpc >= 600) medal = 'silver';
    else if (avgCpc >= 300) medal = 'bronze';
    stats = { avg_cash_per_call: avgCpc, total_revenue: totalRev, total_events: callStats.length, medal };
  }

  // Candidatures passées
  const { data: apps } = await serviceClient
    .from('applications')
    .select('id')
    .eq('closer_id', user.id);
  const appCount = apps?.length || 0;

  // Récupérer toutes les fiches actives
  const { data: fiches, error: fichesError } = await serviceClient
    .from('matching_fiches')
    .select('*')
    .eq('status', 'active');

  if (fichesError || !fiches) {
    return NextResponse.json({ error: 'Erreur récupération fiches' }, { status: 500 });
  }

  // Calculer le score pour chaque fiche
  const results: Array<{ fiche_id: string; score: number; score_details: Record<string, number> }> = [];

  for (const fiche of fiches) {
    const scoreDetails = computeScore(
      fiche as FicheRow,
      candidateUser as CandidateData,
      profile as ProfileData | null,
      stats,
      appCount,
    );

    if (scoreDetails.total >= 10) {
      results.push({
        fiche_id: fiche.id,
        score: scoreDetails.total,
        score_details: scoreDetails,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);

  // Upsert les résultats (ne pas écraser le statut recruteur existant)
  if (results.length > 0) {
    for (const r of results) {
      await serviceClient
        .from('matching_results')
        .upsert(
          {
            fiche_id: r.fiche_id,
            candidate_id: user.id,
            score: r.score,
            score_details: r.score_details,
            status: 'pending',
          },
          { onConflict: 'fiche_id,candidate_id', ignoreDuplicates: false }
        );
    }
  }

  return NextResponse.json({
    success: true,
    total_fiches: fiches.length,
    matches_found: results.length,
    top_score: results[0]?.score || 0,
  });
}
