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

// Poids de chaque critère (total = 100)
const W = {
  niche: 15,
  skills: 15,
  experience: 10,
  years: 5,
  languages: 10,
  commission: 5,
  availability: 10,
  location: 5,
  reputation: 8,
  performance: 7,
  loom: 3,
  training: 3,
  reviews: 2,
  revenue: 2,
};

// Ordre des niveaux d'expérience
const EXP_ORDER: Record<string, number> = {
  junior: 0, intermediaire: 1, senior: 2, expert: 3,
};

// Ordre des badges
const BADGE_ORDER: Record<string, number> = {
  bronze: 0, silver: 1, gold: 2, platinum: 3, diamond: 4,
};

// Ordre des médailles
const MEDAL_ORDER: Record<string, number> = {
  none: 0, bronze: 1, silver: 2, gold: 3, diamond: 4,
};

interface CandidateData {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  niches: string[] | null;
  skills: string[] | null;
  years_experience: number | null;
  languages: string[] | null;
  training_center: string | null;
  is_employed: boolean;
  loom_url: string | null;
  tier: string;
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
  specialties: string[] | null;
}

interface CallStatsAgg {
  user_id: string;
  avg_cash_per_call: number;
  total_revenue: number;
  total_events: number;
  medal: string;
}

interface FicheData {
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
}

function computeScore(
  fiche: FicheData,
  candidate: CandidateData,
  profile: ProfileData | null,
  stats: CallStatsAgg | null,
  applicationCount: number,
) {
  const details: Record<string, number> = {};

  // 1. NICHE (15 pts)
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
    details.niche = W.niche; // Pas de critère = score max
  }

  // 2. SKILLS (15 pts)
  if (fiche.required_skills.length > 0) {
    const candidateSkills = (candidate.skills || []).map((s: string) => s.toLowerCase());
    const matched = fiche.required_skills.filter(s => candidateSkills.includes(s.toLowerCase()));
    details.skills = W.skills * (matched.length / fiche.required_skills.length);
  } else {
    details.skills = W.skills;
  }

  // 3. EXPERIENCE LEVEL (10 pts)
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
    details.experience = W.experience * 0.3; // Pas de profil = score bas
  }

  // 4. YEARS EXPERIENCE (5 pts)
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

  // 5. LANGUAGES (10 pts)
  if (fiche.languages.length > 0) {
    const candidateLangs = (candidate.languages || []).map((l: string) => l.toLowerCase());
    const matched = fiche.languages.filter(l => candidateLangs.includes(l.toLowerCase()));
    details.languages = W.languages * (matched.length / fiche.languages.length);
  } else {
    details.languages = W.languages;
  }

  // 6. COMMISSION RATE (5 pts)
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

  // 7. AVAILABILITY (10 pts)
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

  // 8. LOCATION (5 pts)
  if (fiche.location) {
    // Simple matching par inclusion de texte
    const ficheLocation = fiche.location.toLowerCase();
    const profileLocation: string = ''; // Users don't have a location field yet
    if (ficheLocation.includes('remote') || ficheLocation.includes('distance') || ficheLocation.includes('télétravail')) {
      details.location = W.location; // Remote = tout le monde matche
    } else if (profileLocation && profileLocation.includes(ficheLocation)) {
      details.location = W.location;
    } else {
      details.location = W.location * 0.5; // Sans info location, score moyen
    }
  } else {
    details.location = W.location;
  }

  // 9. REPUTATION (8 pts)
  if (fiche.min_reputation_score != null && profile) {
    if (profile.score >= fiche.min_reputation_score) {
      details.reputation = W.reputation;
    } else {
      details.reputation = W.reputation * (profile.score / fiche.min_reputation_score);
    }

    // Badge bonus
    if (fiche.min_badge_level && profile.badge_level) {
      const required = BADGE_ORDER[fiche.min_badge_level] ?? 0;
      const actual = BADGE_ORDER[profile.badge_level] ?? 0;
      if (actual < required) {
        details.reputation *= 0.7; // Pénalité badge insuffisant
      }
    }
  } else if (!fiche.min_reputation_score) {
    details.reputation = W.reputation;
  } else {
    details.reputation = 0;
  }

  // 10. PERFORMANCE — cash per call + médaille (7 pts)
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

  // 11. LOOM VIDEO (3 pts)
  if (fiche.loom_required) {
    details.loom = candidate.loom_url ? W.loom : 0;
  } else {
    details.loom = candidate.loom_url ? W.loom : W.loom * 0.5;
  }

  // 12. TRAINING CENTER (3 pts)
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

  // 13. REVIEWS (2 pts)
  if (profile) {
    const reviews = profile.total_reviews || 0;
    if (reviews >= 5) details.reviews = W.reviews;
    else if (reviews >= 2) details.reviews = W.reviews * 0.6;
    else if (reviews >= 1) details.reviews = W.reviews * 0.3;
    else details.reviews = 0;
  } else {
    details.reviews = 0;
  }

  // 14. REVENUE (2 pts)
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

  // Bonus : historique candidatures (max +3 pts bonus)
  const bonus = Math.min(3, applicationCount * 0.5);

  const total = Object.values(details).reduce((sum, v) => sum + v, 0) + bonus;
  details.total = Math.min(100, Math.round(total * 10) / 10);

  return details;
}

// POST /api/matching/compute — lancer le matching pour une fiche
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { fiche_id } = await req.json();
  if (!fiche_id) {
    return NextResponse.json({ error: 'fiche_id requis' }, { status: 400 });
  }

  // Vérifier que la fiche appartient au recruteur
  const { data: fiche, error: ficheError } = await supabase
    .from('matching_fiches')
    .select('*')
    .eq('id', fiche_id)
    .eq('recruiter_id', user.id)
    .single();

  if (ficheError || !fiche) {
    return NextResponse.json({ error: 'Fiche non trouvée' }, { status: 404 });
  }

  // Utiliser le service client pour lire tous les candidats (bypass RLS)
  const serviceClient = createServiceClient();

  // Récupérer tous les candidats actifs
  const { data: candidates, error: candidatesError } = await serviceClient
    .from('users')
    .select('id, email, full_name, avatar_url, niches, skills, years_experience, languages, training_center, is_employed, loom_url, tier')
    .or('role_type.eq.candidate,role_type.eq.both')
    .eq('is_active', true);

  if (candidatesError || !candidates) {
    return NextResponse.json({ error: 'Erreur récupération candidats' }, { status: 500 });
  }

  // Récupérer les profils
  const candidateIds = candidates.map(c => c.id);
  const { data: profiles } = await serviceClient
    .from('profiles')
    .select('user_id, experience_level, commission_rate, availability, available_hours_per_week, preferred_niches, score, total_reviews, total_deals_closed, total_revenue_generated, badge_level, specialties')
    .in('user_id', candidateIds);

  const profileMap = new Map<string, ProfileData>();
  if (profiles) {
    for (const p of profiles) {
      profileMap.set(p.user_id, p as ProfileData);
    }
  }

  // Récupérer les stats call agrégées
  const { data: callStats } = await serviceClient
    .from('call_stats')
    .select('user_id, total_revenue, effective_calls, cash_per_call')
    .in('user_id', candidateIds);

  // Agréger les stats par candidat
  const statsMap = new Map<string, CallStatsAgg>();
  if (callStats) {
    const grouped = new Map<string, { revenues: number[]; cashPerCalls: number[]; count: number }>();
    for (const stat of callStats) {
      const existing = grouped.get(stat.user_id) || { revenues: [], cashPerCalls: [], count: 0 };
      existing.revenues.push(stat.total_revenue || 0);
      existing.cashPerCalls.push(stat.cash_per_call || 0);
      existing.count++;
      grouped.set(stat.user_id, existing);
    }
    for (const [userId, data] of grouped.entries()) {
      const totalRev = data.revenues.reduce((s, v) => s + v, 0);
      const avgCpc = data.cashPerCalls.length > 0
        ? data.cashPerCalls.reduce((s, v) => s + v, 0) / data.cashPerCalls.length
        : 0;
      let medal = 'none';
      if (avgCpc >= 2000) medal = 'diamond';
      else if (avgCpc >= 1000) medal = 'gold';
      else if (avgCpc >= 600) medal = 'silver';
      else if (avgCpc >= 300) medal = 'bronze';
      statsMap.set(userId, {
        user_id: userId,
        avg_cash_per_call: avgCpc,
        total_revenue: totalRev,
        total_events: data.count,
        medal,
      });
    }
  }

  // Compter les candidatures passées
  const { data: appCounts } = await serviceClient
    .from('applications')
    .select('closer_id')
    .in('closer_id', candidateIds);

  const appCountMap = new Map<string, number>();
  if (appCounts) {
    for (const app of appCounts) {
      appCountMap.set(app.closer_id, (appCountMap.get(app.closer_id) || 0) + 1);
    }
  }

  // Calculer les scores
  const results: Array<{ candidate_id: string; score: number; score_details: Record<string, number> }> = [];

  for (const candidate of candidates) {
    const profile = profileMap.get(candidate.id) || null;
    const stats = statsMap.get(candidate.id) || null;
    const appCount = appCountMap.get(candidate.id) || 0;

    const scoreDetails = computeScore(
      fiche as FicheData,
      candidate as CandidateData,
      profile,
      stats,
      appCount,
    );

    // Ne garder que les candidats avec un score > 10%
    if (scoreDetails.total >= 10) {
      results.push({
        candidate_id: candidate.id,
        score: scoreDetails.total,
        score_details: scoreDetails,
      });
    }
  }

  // Trier par score décroissant
  results.sort((a, b) => b.score - a.score);

  // Supprimer les anciens résultats et insérer les nouveaux
  await serviceClient
    .from('matching_results')
    .delete()
    .eq('fiche_id', fiche_id);

  if (results.length > 0) {
    const inserts = results.map(r => ({
      fiche_id,
      candidate_id: r.candidate_id,
      score: r.score,
      score_details: r.score_details,
      status: 'pending',
    }));

    const { error: insertError } = await serviceClient
      .from('matching_results')
      .insert(inserts);

    if (insertError) {
      console.error('Erreur insertion résultats:', insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    total_candidates: candidates.length,
    matches_found: results.length,
    top_score: results[0]?.score || 0,
  });
}
