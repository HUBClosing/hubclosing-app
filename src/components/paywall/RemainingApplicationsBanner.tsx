'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import { FileText, AlertTriangle, XCircle } from 'lucide-react';
import { getRemainingApplications, getUpgradeTier, TIER_PRICES } from '@/types/database';
import type { User, SubscriptionTier } from '@/types/database';

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: 'Gratuit',
  starter: 'Starter',
  pro: 'Pro',
  elite: 'Elite',
  business: 'Business',
  agency: 'Agency',
};

interface RemainingApplicationsBannerProps {
  user: User;
}

export function RemainingApplicationsBanner({ user }: RemainingApplicationsBannerProps) {
  const remaining = getRemainingApplications(user);

  // Unlimited — no banner needed
  if (!isFinite(remaining)) {
    return null;
  }

  const activeRoleType = user.active_role === 'recruiter' ? 'recruiter' : 'candidate';
  const nextTier = getUpgradeTier(user.tier, activeRoleType);
  const nextTierLabel = nextTier ? TIER_LABELS[nextTier] : null;
  const nextTierPrice = nextTier ? TIER_PRICES[nextTier as keyof typeof TIER_PRICES] : null;

  const atLimit = remaining === 0;
  const nearLimit = remaining > 0 && remaining <= 2;

  if (atLimit) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm">
        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
        <span className="text-red-700 font-medium">
          Limite atteinte
        </span>
        {nextTier && nextTierLabel && nextTierPrice !== null && (
          <>
            <span className="text-red-400">—</span>
            <Link
              href="/dashboard/subscription"
              className="font-medium text-brand-amber hover:underline"
            >
              Passez au plan {nextTierLabel} pour continuer
            </Link>
          </>
        )}
      </div>
    );
  }

  if (nearLimit) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
        <span className="text-amber-700 font-medium">
          Plus que {remaining} candidature{remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm">
      <FileText className="h-4 w-4 text-green-500 shrink-0" />
      <span className={clsx('font-medium text-green-700')}>
        {remaining} candidature{remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''} ce mois
      </span>
    </div>
  );
}
