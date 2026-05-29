import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  // Sécurité : valider que "next" est une route interne
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message);
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
  }

  // Vérifier que la session est bien établie
  const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

  if (userError || !authUser) {
    console.error('[auth/callback] getUser error:', userError?.message || 'No user returned');
    return NextResponse.redirect(`${origin}/auth/login?error=session_failed`);
  }

  // Vérifier si le profil utilisateur existe déjà dans la table users
  // Le trigger handle_new_user() peut l'avoir déjà créé automatiquement
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id, role, email')
    .eq('id', authUser.id)
    .maybeSingle();

  if (fetchError) {
    console.error('[auth/callback] fetch user error:', fetchError.message);
  }

  if (!existingUser) {
    // Le trigger n'a pas créé l'utilisateur — création manuelle
    const { error: insertError } = await supabase.from('users').upsert({
      id: authUser.id,
      email: authUser.email || '',
      role: 'pending',
      full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
      avatar_url: authUser.user_metadata?.avatar_url || null,
    }, { onConflict: 'id' });

    if (insertError) {
      console.error('[auth/callback] upsert user error:', insertError.message);
      // Ne pas bloquer — l'utilisateur est authentifié
    }

    return NextResponse.redirect(`${origin}/onboarding`);
  }

  // Utilisateur existant — mettre à jour l'avatar si c'est une connexion Google
  // (pour récupérer la photo de profil Google)
  if (authUser.user_metadata?.avatar_url && !existingUser.email) {
    await supabase.from('users').update({
      avatar_url: authUser.user_metadata.avatar_url,
      full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || undefined,
    }).eq('id', authUser.id);
  }

  // Si l'utilisateur est 'pending', il n'a pas fini l'onboarding → y renvoyer
  if (existingUser.role === 'pending') {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  // Utilisateur complet → dashboard
  return NextResponse.redirect(`${origin}${safeNext}`);
}
