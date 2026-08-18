import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';

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
            supabaseResponse.cookies.set(name, value, {
              ...(options as any),
              // Sécurisation des cookies
              secure: true,
              sameSite: 'lax',
            })
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
    // Strict Transport Security — forcer HTTPS
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

    // Content Security Policy — protection XSS majeure
    const csp = [
      // Par défaut : uniquement le même domaine
      "default-src 'self'",
      // Scripts : self + Stripe + Jitsi + GA4 + Clarity
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://meet.jit.si https://*.jitsi.net https://www.googletagmanager.com https://www.clarity.ms",
      // Styles : self + inline (Next.js en a besoin)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Images : self + Supabase Storage + Stripe + GA4 + Clarity + data URIs
      "img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com https://www.google-analytics.com https://www.clarity.ms https://c.clarity.ms",
      // Polices
      "font-src 'self' https://fonts.gstatic.com",
      // Connexions API : self + Supabase + Stripe + Jitsi + GA4 + Clarity
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.jitsi.net wss://*.jitsi.net https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.clarity.ms https://clarity.ms",
      // Frames : Stripe Checkout + Jitsi Meet
      "frame-src https://js.stripe.com https://hooks.stripe.com https://meet.jit.si https://*.jitsi.net",
      // Pas d'objets Flash/Java
      "object-src 'none'",
      // Base URI restreinte
      "base-uri 'self'",
      // Formulaires uniquement vers self
      "form-action 'self' https://checkout.stripe.com",
      // Pas de manifest externe
      "manifest-src 'self'",
      // Workers
      "worker-src 'self' blob:",
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);

    return response;
  }

  // ─── Rate limiting sur les API routes ───
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Identifier par IP (ou user ID si authentifié)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    // Rate limit spécifique pour checkout
    if (request.nextUrl.pathname === '/api/stripe/checkout') {
      const identifier = user ? `checkout:${user.id}` : `checkout:${ip}`;
      const result = rateLimit(identifier, RATE_LIMITS.checkout);

      if (!result.success) {
        const response = NextResponse.json(
          { error: 'Trop de requêtes. Réessayez dans quelques instants.' },
          { status: 429 }
        );
        response.headers.set('Retry-After', String(Math.ceil((result.resetAt - Date.now()) / 1000)));
        return addSecurityHeaders(response);
      }
    }

    // Rate limit général pour les API (sauf webhook qui a sa propre protection)
    if (!request.nextUrl.pathname.startsWith('/api/stripe/webhook')) {
      const result = rateLimit(`api:${ip}`, RATE_LIMITS.api);

      if (!result.success) {
        const response = NextResponse.json(
          { error: 'Trop de requêtes. Réessayez dans quelques instants.' },
          { status: 429 }
        );
        response.headers.set('Retry-After', String(Math.ceil((result.resetAt - Date.now()) / 1000)));
        return addSecurityHeaders(response);
      }
    }
  }

  // Vérification email — bloquer si email non confirmé
  if (
    user &&
    !user.email_confirmed_at &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/api/auth') &&
    !request.nextUrl.pathname.startsWith('/api/stripe/webhook')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/verify-email';
    return addSecurityHeaders(redirectWithCookies(url));
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
    !request.nextUrl.pathname.startsWith('/api/auth') &&
    !request.nextUrl.pathname.startsWith('/api/stripe/webhook')
  ) {
    return addSecurityHeaders(
      NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    );
  }

  // Note: on ne redirige PAS les utilisateurs connectés depuis /auth/login
  // car cela créerait une boucle de redirection si le token Supabase est
  // dans un état intermédiaire (rafraîchi dans le middleware mais pas encore
  // visible côté serveur component). La redirection est gérée côté client
  // dans AuthForm.tsx si l'utilisateur est déjà connecté.

  return addSecurityHeaders(supabaseResponse);
}
