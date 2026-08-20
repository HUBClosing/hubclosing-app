'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Loader2 } from 'lucide-react';

export function ImpersonateButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const impersonate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Erreur réseau');
    }
    setLoading(false);
  };

  return (
    <div>
      <button
        onClick={impersonate}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
        Voir en tant que
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
