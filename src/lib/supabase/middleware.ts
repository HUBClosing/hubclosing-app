import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes - require authentication
  if (
    !user &&
    (request.nextUrl.pathname.startsWith('/dashboard') ||
     request.nextUrl.pathname.startsWith('/onboarding'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages (but not callback)
  // Query the users table to determine the correct redirect destination
  if (
    user &&
    request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/auth/callback')
  ) {
    // Check if user has a profile and their role
    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const url = request.nextUrl.clone();
    // If no DB row or pending role -> onboarding, otherwise dashboard
    if (!dbUser || dbUser.role === 'pending') {
      url.pathname = '/onboarding';
    } else {
      url.pathname = '/dashboard';
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
