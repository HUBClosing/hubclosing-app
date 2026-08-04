'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, X, Loader2 } from 'lucide-react';

interface ImpersonationBannerProps {
  targetName: string;
  targetEmail: string;
  targetRole: string;
}

export function ImpersonationBanner({ targetName, targetEmail, targetRole }: ImpersonationBannerProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const stopImpersonation = async () => {
    setLoading(true);
    await fetch('/api/admin/impersonate', { method: 'DELETE' });
    router.push('/dashboard/admin/users');
    router.refresh();
  };

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm font-medium z-50">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4" />
        <span>
          Vue en tant que <strong>{targetName || targetEmail}</strong>
          <span className="ml-1 opacity-80">({targetRole})</span>
        </span>
      </div>
      <button
        onClick={stopImpersonation}
        disabled={loading}
        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
        Revenir admin
      </button>
    </div>
  );
}
