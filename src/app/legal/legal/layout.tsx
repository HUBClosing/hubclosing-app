import Link from 'next/link';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0F08] text-[#F5F5F0]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#0A0F08]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">
            HUB<span className="text-[#F5A623]">Closing</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-[#F5A623] transition-colors"
          >
            &larr; Retour au site
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex flex-wrap gap-6 text-sm text-gray-500">
            <Link href="/legal/mentions" className="hover:text-[#F5A623] transition-colors">
              Mentions légales
            </Link>
            <Link href="/legal/cgu" className="hover:text-[#F5A623] transition-colors">
              Conditions générales de vente
            </Link>
            <Link href="/legal/privacy" className="hover:text-[#F5A623] transition-colors">
              Politique de confidentialité
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-600">
            &copy; {new Date().getFullYear()} HUBClosing. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
