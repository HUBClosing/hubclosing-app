import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream via-white to-brand-cream/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="text-6xl font-bold text-brand-amber mb-4">404</div>
          <h1 className="text-xl font-bold text-brand-dark mb-2">
            Page introuvable
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            La page que vous cherchez n&apos;existe pas ou a été déplacée.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"
            >
              <Home className="h-4 w-4" /> Tableau de bord
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-brand-dark border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
