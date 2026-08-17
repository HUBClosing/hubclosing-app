/** @type {import('next').NextConfig} */
const nextConfig = {

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Headers de sécurité pour les assets statiques (_next/static)
  // Le middleware gère les headers pour les routes dynamiques,
  // mais les assets statiques ne passent pas par le middleware.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://meet.jit.si https://*.jitsi.net https://www.googletagmanager.com https://www.clarity.ms",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com https://www.google-analytics.com https://www.clarity.ms https://c.clarity.ms",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.jitsi.net wss://*.jitsi.net https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.clarity.ms https://clarity.ms",
              "frame-src https://js.stripe.com https://hooks.stripe.com https://meet.jit.si https://*.jitsi.net",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://checkout.stripe.com",
              "manifest-src 'self'",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
