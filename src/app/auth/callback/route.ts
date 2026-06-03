import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
  }

  const cookieStore = await cookies();

  // Capturer TOUS les cookies posés par Supabase pendant l'échange
  const setCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            setCookies.push({ name, value, options: options || {} });
            try {
              cookieStore.set(name, value, options as any);
            } catch {
              // Ignoré
            }
          });
        },
      },
    }
  );

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('[auth/callback] exchange error:', exchangeError.message);
    return NextResponse.redirect(
      `${origin}/auth/login?error=auth_exchange_failed&msg=${encodeURIComponent(exchangeError.message)}`
    );
  }

  const {
    data: { user: authUser },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !authUser) {
    console.error('[auth/callback] getUser error:', userError?.message);
    return NextResponse.redirect(`${origin}/auth/login?error=session_failed`);
  }

  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id, role, role_type, email, is_onboarded')
    .eq('id', authUser.id)
    .maybeSingle();

  if (fetchError) {
    console.error('[auth/callback] fetch user error:', fetchError.message);
  }

  let redirectPath = safeNext;

  if (!existingUser && !fetchError) {
    await supabase.from('users').upsert(
      {
        id: authUser.id,
        email: authUser.email || '',
        role: 'pending',
        role_type: 'pending',
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        avatar_url: authUser.user_metadata?.avatar_url || null,
      },
      { onConflict: 'id' }
    );
    redirectPath = '/onboarding';
  } else if (existingUser) {
    if (authUser.user_metadata?.avatar_url) {
      await supabase
        .from('users')
        .update({
          avatar_url: authUser.user_metadata.avatar_url,
          full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || undefined,
        })
        .eq('id', authUser.id);
    }

    const isPending = existingUser.role === 'pending' || existingUser.role_type === 'pending';
    const isOnboarded = existingUser.is_onboarded === true;
    if (isPending && !isOnboarded) {
      redirectPath = '/onboarding';
    }
  }

  // Construire la réponse HTML avec les cookies de session EXPLICITEMENT posés
  const redirectUrl = `${origin}${redirectPath}`;
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${redirectUrl}"/></head><body><script>window.location.href="${redirectUrl}"</script></body></html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });

  // CRITIQUE : Appliquer chaque cookie de session sur la réponse
  setCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as any);
  });

  return response;
}
