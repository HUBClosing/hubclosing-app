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

// POST /api/matching/unlock — débloquer un profil candidat
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await req.json();
  const { candidate_id, fiche_id } = body;

  if (!candidate_id) {
    return NextResponse.json({ error: 'candidate_id requis' }, { status: 400 });
  }

  // Vérifier que le recruteur a des crédits de déblocage
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('recruiter_deblocages_remaining, role_type, active_role')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
  }

  if (!['recruiter', 'both', 'admin'].includes(userData.role_type)) {
    return NextResponse.json({ error: 'Réservé aux recruteurs' }, { status: 403 });
  }

  // Vérifier si déjà débloqué
  const { data: existing } = await supabase
    .from('profile_unlocks')
    .select('id')
    .eq('recruiter_id', user.id)
    .eq('candidate_id', candidate_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, already_unlocked: true });
  }

  // Vérifier crédits
  const remaining = userData.recruiter_deblocages_remaining || 0;
  if (remaining <= 0) {
    return NextResponse.json({
      error: 'Aucun crédit de déblocage restant. Achetez un pack déblocage.',
      code: 'NO_CREDITS',
    }, { status: 402 });
  }

  // Insérer le déblocage
  const { error: insertError } = await supabase
    .from('profile_unlocks')
    .insert({
      recruiter_id: user.id,
      candidate_id,
      fiche_id: fiche_id || null,
    });

  if (insertError) {
    // Doublon concurrent — pas grave
    if (insertError.code === '23505') {
      return NextResponse.json({ success: true, already_unlocked: true });
    }
    console.error('[unlock] insert error:', insertError.message);
    return NextResponse.json({ error: 'Erreur lors du déblocage' }, { status: 500 });
  }

  // Décrémenter les crédits de façon atomique (protection race condition)
  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update({ recruiter_deblocages_remaining: remaining - 1 })
    .eq('id', user.id)
    .gt('recruiter_deblocages_remaining', 0)
    .select('recruiter_deblocages_remaining')
    .single();

  if (updateError || !updatedUser) {
    // La mise à jour a échoué (concurrent: crédits déjà à 0) — rollback le déblocage
    await supabase.from('profile_unlocks').delete().eq('recruiter_id', user.id).eq('candidate_id', candidate_id);
    console.error('Erreur décrémentation crédits:', updateError?.message || 'crédits épuisés concurremment');
    return NextResponse.json({ error: 'Crédit déjà utilisé, veuillez réessayer' }, { status: 409 });
  }

  return NextResponse.json({
    success: true,
    remaining: updatedUser.recruiter_deblocages_remaining,
  });
}
