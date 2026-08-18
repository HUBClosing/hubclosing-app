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

// GET /api/matching/fiches — lister les fiches du recruteur
export async function GET() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: fiches, error } = await supabase
    .from('matching_fiches')
    .select('*')
    .eq('recruiter_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Compter les résultats pour chaque fiche
  const fichesWithCounts = await Promise.all(
    (fiches || []).map(async (fiche) => {
      const { count } = await supabase
        .from('matching_results')
        .select('*', { count: 'exact', head: true })
        .eq('fiche_id', fiche.id);

      const { data: topResult } = await supabase
        .from('matching_results')
        .select('score')
        .eq('fiche_id', fiche.id)
        .order('score', { ascending: false })
        .limit(1)
        .single();

      return {
        ...fiche,
        results_count: count || 0,
        top_score: topResult?.score || 0,
      };
    })
  );

  return NextResponse.json({ fiches: fichesWithCounts });
}

// POST /api/matching/fiches — créer une fiche de poste
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // Vérifier que l'utilisateur est recruteur
  const { data: userData } = await supabase
    .from('users')
    .select('role_type, active_role, tier')
    .eq('id', user.id)
    .single();

  if (!userData || (userData.role_type !== 'recruiter' && userData.role_type !== 'both' && userData.role_type !== 'admin')) {
    return NextResponse.json({ error: 'Réservé aux recruteurs' }, { status: 403 });
  }

  const body = await req.json();

  // Validation
  if (!body.title || body.title.trim().length < 3) {
    return NextResponse.json({ error: 'Le titre est requis (min 3 caractères)' }, { status: 400 });
  }

  const ficheData = {
    recruiter_id: user.id,
    title: body.title.trim(),
    niche: body.niche || null,
    required_skills: body.required_skills || [],
    offer_type: body.offer_type || null,
    experience_level: body.experience_level || null,
    min_years_experience: body.min_years_experience ? parseInt(body.min_years_experience) : null,
    languages: body.languages || [],
    min_commission_rate: body.min_commission_rate ? parseFloat(body.min_commission_rate) : null,
    max_commission_rate: body.max_commission_rate ? parseFloat(body.max_commission_rate) : null,
    location: body.location || null,
    availability_required: body.availability_required ?? true,
    min_hours_per_week: body.min_hours_per_week ? parseInt(body.min_hours_per_week) : null,
    is_employed_preferred: body.is_employed_preferred ?? null,
    min_cash_per_call: body.min_cash_per_call ? parseFloat(body.min_cash_per_call) : null,
    min_deals_closed: body.min_deals_closed ? parseInt(body.min_deals_closed) : null,
    min_revenue_generated: body.min_revenue_generated ? parseFloat(body.min_revenue_generated) : null,
    min_reputation_score: body.min_reputation_score ? parseInt(body.min_reputation_score) : null,
    min_badge_level: body.min_badge_level || null,
    medal_required: body.medal_required || null,
    loom_required: body.loom_required ?? false,
    training_centers: body.training_centers || [],
    notes: body.notes || null,
  };

  const { data: fiche, error } = await supabase
    .from('matching_fiches')
    .insert(ficheData)
    .select('id, title')
    .single();

  if (error) {
    console.error('Erreur création fiche:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ fiche }, { status: 201 });
}
