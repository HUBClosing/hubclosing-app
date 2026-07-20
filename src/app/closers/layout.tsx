import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Closers & Setters — Trouvez vos missions closing',
  description:
    'Accédez aux meilleures opportunités de closing et setting dans l\'infoproduit. Offres qualifiées, commissions transparentes, matching intelligent.',
  openGraph: {
    title: 'HUBClosing — Espace Closers & Setters',
    description:
      'Trouvez des missions de closing qualifiées avec des commissions transparentes. Rejoignez +2 000 closers et setters.',
  },
};

export default function ClosersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
