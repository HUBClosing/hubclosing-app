'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import { AlertTriangle } from 'lucide-react';

interface UsageMeterProps {
  current: number;
  max: number;
  label: string;
  upgradeHref?: string;
}

export function UsageMeter({ current, max, label, upgradeHref }: UsageMeterProps) {
  const isUnlimited = !isFinite(max);
  const ratio = isUnlimited ? 0 : max > 0 ? current / max : 0;
  const atLimit = !isUnlimited && current >= max;
  const nearLimit = !isUnlimited && ratio >= 0.7;

  const barColor = atLimit
    ? 'bg-red-500'
    : nearLimit
      ? 'bg-amber-500'
      : 'bg-brand-amber';

  const textColor = atLimit
    ? 'text-red-600'
    : nearLimit
      ? 'text-amber-600'
      : 'text-gray-700';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className={clsx('font-medium', textColor)}>{label}</span>
        <span className={clsx('tabular-nums', textColor)}>
          {isUnlimited ? (
            <span className="text-green-600 font-medium">Illimité</span>
          ) : (
            `${current}/${max}`
          )}
        </span>
      </div>

      {!isUnlimited && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all duration-500', barColor)}
            style={{ width: `${Math.min(ratio * 100, 100)}%` }}
          />
        </div>
      )}

      {atLimit && (
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            Limite atteinte
          </span>
          {upgradeHref && (
            <Link
              href={upgradeHref}
              className="text-xs font-medium text-brand-amber hover:underline"
            >
              Mettre à niveau
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
