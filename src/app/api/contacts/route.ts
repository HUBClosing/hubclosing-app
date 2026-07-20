import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRemainingContacts, TIER_LIMITS } from '@/types/database';

/**
 * GET /api/contacts?candidate_id=xxx
 *
 * Initie un contact avec un candidat :
 * 1. Vérifie que l'utilisateur est recruteur
 * 2. Vérifie le quota contacts_per_month
 * 3. Crée ou récupère la conversation existante
 * 4. Incrémente monthly_contacts_count
 * 5. Redirige vers /dashboard/messages
 */
export async function GET(request: NextRequest) {
  const candidateId = request.nextUrl.searchParams.get('candidate_id');

  if (!candidateId) {
    return NextResponse.redirect(new URL('/dashboard/cvtheque', request.url));
  }

  const supabase = await createClient();

  // 1. Auth
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // 2. Check recruteur
  const isRecruiter =
    user.role_type === 'recruiter' ||
    (user.role_type === 'both' && user.active_role === 'recruiter') ||
    user.role === 'manager' ||
    user.role_type === 'admin';

  if (!isRecruiter) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Check si conversation existe déjà
  const { data: existingConv } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(participant_1.eq.${user.id},participant_2.eq.${candidateId}),and(participant_1.eq.${candidateId},participant_2.eq.${user.id})`)
    .maybeSingle();

  if (existingConv) {
    // Conversation existe → rediriger directement
    return NextResponse.redirect(new URL('/dashboard/messages', request.url));
  }

  // 4. Vérifier quota (sauf admin)
  if (user.role_type !== 'admin') {
    const remaining = getRemainingContacts(user);
    if (remaining <= 0) {
      return NextResponse.redirect(new URL('/dashboard/subscription?reason=contacts_quota', request.url));
    }
  }

  // 5. Vérifier que le candidat existe
  const { data: candidate } = await supabase
    .from('users')
    .select('id, is_active')
    .eq('id', candidateId)
    .single();

  if (!candidate || !candidate.is_active) {
    return NextResponse.redirect(new URL('/dashboard/cvtheque', request.url));
  }

  // 6. Créer la conversation
  const { error: convError } = await supabase
    .from('conversations')
    .insert({
      participant_1: user.id,
      participant_2: candidateId,
      last_message_at: new Date().toISOString(),
    });

  if (convError) {
    console.error('[contacts] conversation error:', convError.message);
    return NextResponse.redirect(new URL('/dashboard/cvtheque', request.url));
  }

  // 7. Incrémenter le compteur de contacts mensuels
  await supabase
    .from('users')
    .update({
      monthly_contacts_count: user.monthly_contacts_count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  // 8. Envoyer une notification au candidat
  await supabase.from('notifications').insert({
    user_id: candidateId,
    type: 'message_received',
    title: 'Nouveau contact',
    body: `${user.full_name || 'Un recruteur'} souhaite échanger avec vous.`,
    link: '/dashboard/messages',
    metadata: { recruiter_id: user.id },
  });

  // 9. Rediriger vers messages
  return NextResponse.redirect(new URL('/dashboard/messages', request.url));
}
