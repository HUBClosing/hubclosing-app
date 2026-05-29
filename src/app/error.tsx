'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream via-white to-brand-cream/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-brand-dark mb-2">
            Une erreur est survenue
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Quelque chose s&apos;est mal passé. Veuillez réessayer ou retourner à l&apos;accueil.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={reset} variant="primary" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" /> Réessayer
            </Button>
            <a href="/dashboard">
              <Button variant="secondary" size="sm">
                <Home className="h-4 w-4 mr-2" /> Accueil
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
