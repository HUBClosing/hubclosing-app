'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyReferralCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-3 px-5 py-3 bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 transition-colors"
    >
      <span className="font-mono text-lg font-bold tracking-wider">{code}</span>
      {copied ? (
        <Check className="h-5 w-5 text-green-400" />
      ) : (
        <Copy className="h-5 w-5 text-white/60" />
      )}
    </button>
  );
}
