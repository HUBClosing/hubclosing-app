import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  // Sécurité : valider que "next" est une route interne
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  if (code) {
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

    // Vérifier si le profil utilisateur existe déjà
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', authUser.id)
      .maybeSingle();

    if (fetchError) {
      console.error('[auth/callback] fetch user error:', fetchError.message);
      // Continue quand même — l'utilisateur est authentifié
    }

    if (!existingUser) {
      // Nouvel utilisateur OAuth — créer le profil avec rôle 'pending'
      const { error: insertError } = await supabase.from('users').insert({
        id: authUser.id,
        email: authUser.email || null,
        role: 'pending',
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        avatar_url: authUser.user_metadata?.avatar_url || null,
      });

      if (insertError) {
        console.error('[auth/callback] insert user error:', insertError.message);
        // Si erreur de doublon (race condition), on continue normalement
        if (!insertError.message.includes('duplicate')) {
          return NextResponse.redirect(`${origin}/auth/login?error=profile_creation_failed`);
        }
      }

      return NextResponse.redirect(`${origin}/onboarding`);
    }

    // Utilisateur existant avec rôle pending -> onboarding
    if (existingUser.role === 'pending') {
      return NextResponse.redirect(`${origin}/onboarding`);
    }

    return NextResponse.redirect(`${origin}${safeNext}`);
  }

  return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
}
