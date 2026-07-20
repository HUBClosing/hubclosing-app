import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Managers & HOS — Recrutez les meilleurs closers',
  description:
    'Publiez vos offres et recrutez des closers et setters qualifiés pour vos programmes d\'infoproduit. CVthèque, candidatures ciblées, analytics.',
  openGraph: {
    title: 'HUBClosing — Espace Managers & HOS',
    description:
      'Recrutez les meilleurs talents sales du marché de l\'infoproduit. Profils vérifiés, candidatures qualifiées.',
  },
};

export default function ManagersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
