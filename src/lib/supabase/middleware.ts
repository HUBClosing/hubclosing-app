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

  // Helper: créer une redirection qui préserve les cookies de session Supabase
  function redirectWithCookies(url: URL) {
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie as any);
    });
    return redirectResponse;
  }

  // Helper: ajouter les headers de sécurité à une réponse
  function addSecurityHeaders(response: NextResponse) {
    // Protection contre le clickjacking
    response.headers.set('X-Frame-Options', 'DENY');
    // Protection XSS (navigateurs legacy)
    response.headers.set('X-Content-Type-Options', 'nosniff');
    // Politique de référence stricte
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Permissions Policy — désactiver les features inutilisées
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    return response;
  }

  // Routes protégées — requièrent une authentification
  if (
    !user &&
    (request.nextUrl.pathname.startsWith('/dashboard') ||
     request.nextUrl.pathname.startsWith('/onboarding'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    // Ajouter un redirect pour retourner à la page demandée après login
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return addSecurityHeaders(redirectWithCookies(url));
  }

  // Protection admin — vérification supplémentaire côté middleware
  // Note: la vérification principale reste dans requireAdmin(), mais on bloque
  // les routes /api sensibles ici aussi
  if (
    !user &&
    request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.startsWith('/api/auth')
  ) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // Note: on ne redirige PAS les utilisateurs connectés depuis /auth/login
  // car cela créerait une boucle de redirection si le token Supabase est
  // dans un état intermédiaire (rafraîchi dans le middleware mais pas encore
  // visible côté serveur component). La redirection est gérée côté client
  // dans AuthForm.tsx si l'utilisateur est déjà connecté.

  return addSecurityHeaders(supabaseResponse);
}
