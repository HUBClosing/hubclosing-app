import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Ensure user profile exists (for OAuth signups where trigger might not fire)
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, role')
          .eq('id', authUser.id)
          .single();

        if (!existingUser) {
          // New OAuth user - create with 'pending' role, will complete onboarding
          await supabase.from('users').insert({
            id: authUser.id,
            email: authUser.email || '',
            role: 'pending',
            full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
            avatar_url: authUser.user_metadata?.avatar_url || null,
          });

          // Redirect to onboarding for new users
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        // Existing user with pending role -> onboarding
        if (existingUser.role === 'pending') {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
