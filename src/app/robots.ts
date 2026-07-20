import type { MetadataRoute } from 'next';

/**
 * robots.txt dynamique.
 * Next.js génère automatiquement /robots.txt à partir de cette fonction.
 *
 * Le dashboard et les API ne sont pas indexés.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://hubclosing.fr';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/auth/callback',
          '/auth/reset-password',
          '/onboarding',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
