import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  // Sécurité : valider que "next" est une route interne
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  // Résoudre l'origin correctement (Vercel peut passer un origin interne)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
  }

  // Créer le client Supabase avec gestion explicite des cookies
  const cookieStore = await cookies();

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
            } catch {
              // Ignoré en contexte read-only (Server Component)
            }
          });
        },
      },
    }
  );

  // Échanger le code OAuth contre une session
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('[auth/callback] exchangeCodeForSession error:', exchangeError.message);
    return NextResponse.redirect(
      `${origin}/auth/login?error=auth_exchange_failed&msg=${encodeURIComponent(exchangeError.message)}`
    );
  }

  // Vérifier que la session est bien établie
  const {
    data: { user: authUser },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !authUser) {
    console.error('[auth/callback] getUser error:', userError?.message || 'No user returned');
    return NextResponse.redirect(`${origin}/auth/login?error=session_failed`);
  }

  // Vérifier si le profil utilisateur existe déjà dans la table users
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
    // Le trigger handle_new_user() n'a pas créé l'utilisateur — création manuelle
    const { error: insertError } = await supabase.from('users').upsert(
      {
        id: authUser.id,
        email: authUser.email || '',
        role: 'pending',
        role_type: 'pending',
        full_name:
          authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        avatar_url: authUser.user_metadata?.avatar_url || null,
      },
      { onConflict: 'id' }
    );

    if (insertError) {
      console.error('[auth/callback] upsert user error:', insertError.message);
    }

    redirectPath = '/onboarding';
  } else {
    // Utilisateur existant — mettre à jour l'avatar Google si dispo
    if (authUser.user_metadata?.avatar_url) {
      await supabase
        .from('users')
        .update({
          avatar_url: authUser.user_metadata.avatar_url,
          full_name:
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            undefined,
        })
        .eq('id', authUser.id);
    }

    // Si l'utilisateur est 'pending' ou n'a pas fini l'onboarding → onboarding
    const isPending =
      existingUser.role === 'pending' || existingUser.role_type === 'pending';
    if (isPending) {
      redirectPath = '/onboarding';
    }
  }

  // Rediriger vers la destination
  return NextResponse.redirect(new URL(redirectPath, origin));
}
