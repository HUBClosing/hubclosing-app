import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';
  const isDebug = requestUrl.searchParams.get('debug') === '1';

  // Sécurité : valider que "next" est une route interne
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  // Résoudre l'origin correctement (Vercel proxy)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
  }

  // Créer le client Supabase avec gestion des cookies
  const cookieStore = await cookies();
  const cookiesBeforeExchange = cookieStore.getAll().map(c => c.name);

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
            try {
              cookieStore.set(name, value, options as any);
            } catch (e) {
              console.error('[auth/callback] cookie set error:', name, e);
            }
          });
        },
      },
    }
  );

  // Échanger le code OAuth contre une session
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('[auth/callback] exchange error:', exchangeError.message);
    if (isDebug) {
      return NextResponse.json({
        step: 'exchange',
        error: exchangeError.message,
        origin,
        cookiesBefore: cookiesBeforeExchange,
      });
    }
    return NextResponse.redirect(
      `${origin}/auth/login?error=auth_exchange_failed&msg=${encodeURIComponent(exchangeError.message)}`
    );
  }

  // Vérifier la session
  const {
    data: { user: authUser },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !authUser) {
    console.error('[auth/callback] getUser error:', userError?.message);
    if (isDebug) {
      return NextResponse.json({
        step: 'getUser',
        error: userError?.message || 'No user',
        cookiesBefore: cookiesBeforeExchange,
        cookiesAfter: cookieStore.getAll().map(c => c.name),
      });
    }
    return NextResponse.redirect(`${origin}/auth/login?error=session_failed`);
  }

  // Vérifier le profil utilisateur
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id, role, role_type, email, is_onboarded')
    .eq('id', authUser.id)
    .maybeSingle();

  if (fetchError) {
    console.error('[auth/callback] fetch user error:', fetchError.message);
  }

  let redirectPath = safeNext;

  if (!existingUser) {
    const { error: insertError } = await supabase.from('users').upsert(
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

    if (insertError) {
      console.error('[auth/callback] upsert error:', insertError.message);
    }
    redirectPath = '/onboarding';
  } else {
    // Mise à jour avatar Google
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
    if (isPending) {
      redirectPath = '/onboarding';
    }
  }

  // Debug mode : retourne les infos au lieu de rediriger
  if (isDebug) {
    return NextResponse.json({
      step: 'success',
      user: { id: authUser.id, email: authUser.email },
      existingUser,
      redirectPath,
      origin,
      forwardedHost,
      cookiesBefore: cookiesBeforeExchange,
      cookiesAfter: cookieStore.getAll().map(c => c.name),
    });
  }

  // Rediriger
  return NextResponse.redirect(new URL(redirectPath, origin));
}
