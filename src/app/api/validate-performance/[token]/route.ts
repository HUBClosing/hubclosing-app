import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function createServiceClient() {
  // Utiliser le service role pour accéder à la table sans RLS
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get: () => undefined, set: () => {}, remove: () => {} } }
  );
}

// GET /api/validate-performance/[token] — récupérer les données de performance
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  if (!token) return NextResponse.json({ error: 'Token requis' }, { status: 400 });

  const supabase = createServiceClient();

  const { data: perf, error } = await supabase
    .from('performance_records')
    .select(`
      id, event_name, event_type, event_date,
      calls_scheduled, calls_completed,
      revenue_collected, revenue_invoiced,
      no_shows, cancellations,
      hos_name, is_verified, verified_at, verifier_name,
      validation_token_expires_at,
      user_id
    `)
    .eq('validation_token', token)
    .single();

  if (error || !perf) {
    return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 });
  }

  // Vérifier expiration
  if (perf.validation_token_expires_at && new Date(perf.validation_token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Ce lien de validation a expiré' }, { status: 410 });
  }

  // Récupérer le nom du candidat
  const { data: candidat } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', perf.user_id)
    .single();

  return NextResponse.json({
    performance: {
      ...perf,
      candidate_name: candidat?.full_name || candidat?.email || 'Candidat',
    },
  });
}

// POST /api/validate-performance/[token] — valider la performance
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  if (!token) return NextResponse.json({ error: 'Token requis' }, { status: 400 });

  const supabase = createServiceClient();

  // Vérifier que le token existe et n'est pas expiré
  const { data: perf } = await supabase
    .from('performance_records')
    .select('id, is_verified, validation_token_expires_at')
    .eq('validation_token', token)
    .single();

  if (!perf) {
    return NextResponse.json({ error: 'Lien invalide' }, { status: 404 });
  }

  if (perf.is_verified) {
    return NextResponse.json({ error: 'Cette performance est déjà vérifiée' }, { status: 400 });
  }

  if (perf.validation_token_expires_at && new Date(perf.validation_token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Ce lien de validation a expiré' }, { status: 410 });
  }

  const body = await req.json().catch(() => ({}));

  // Déterminer comment la validation est faite
  let verifiedBy = 'token';
  let verifierName = body.verifier_name || null;

  // Si un utilisateur est connecté, on utilise son nom
  try {
    const cookieStore = cookies();
    const authSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    );
    const { data: { user: authUser } } = await authSupabase.auth.getUser();
    if (authUser) {
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', authUser.id)
        .single();
      verifiedBy = 'account';
      verifierName = userData?.full_name || userData?.email || verifierName;
    }
  } catch {
    // Pas connecté, on utilise le token
  }

  const { error } = await supabase
    .from('performance_records')
    .update({
      is_verified: true,
      verified_at: new Date().toISOString(),
      verified_by: verifiedBy,
      verifier_name: verifierName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', perf.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Performance validée avec succès' });
}
