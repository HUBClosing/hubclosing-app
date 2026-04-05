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
      // Ensure user profile exists (for OAuth signups where trigger might not have role)
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', authUser.id)
          .single();

        if (!existingUser) {
          // User was created via OAuth but trigger didn't fire or failed
          const role = authUser.user_metadata?.role || 'closer';
          await supabase.from('users').insert({
            id: authUser.id,
            email: authUser.email || '',
            role,
            full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
            avatar_url: authUser.user_metadata?.avatar_url || null,
          });

          if (role === 'closer') {
            await supabase.from('closer_profiles').insert({ user_id: authUser.id });
          } else if (role === 'manager') {
            await supabase.from('manager_profiles').insert({ user_id: authUser.id });
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
