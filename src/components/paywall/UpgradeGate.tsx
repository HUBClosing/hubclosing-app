'use client';

import Link from 'next/link';
import { Lock, ArrowRight } from 'lucide-react';
import { canUserDo, getUpgradeTier, TIER_PRICES } from '@/types/database';
import type { User, SubscriptionTier } from '@/types/database';

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: 'Gratuit',
  starter: 'Starter',
  pro: 'Pro',
  elite: 'Elite',
  business: 'Business',
  agency: 'Agency',
};

const FEATURE_LABELS: Record<string, string> = {
  see_premium_offers: 'Voir les offres premium',
  direct_contact: 'Contact direct',
  matching: 'Matching intelligent',
  access_coaching: 'Accès coaching',
  advanced_stats: 'Statistiques avancées',
};

interface UpgradeGateProps {
  user: User;
  requiredFeature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function UpgradeGate({ user, requiredFeature, children, fallback }: UpgradeGateProps) {
  const isAllowed = canUserDo(user, requiredFeature);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const activeRoleType = user.active_role === 'recruiter' ? 'recruiter' : 'candidate';
  const nextTier = getUpgradeTier(user.tier, activeRoleType);
  const nextTierLabel = nextTier ? TIER_LABELS[nextTier] : null;
  const nextTierPrice = nextTier ? TIER_PRICES[nextTier as keyof typeof TIER_PRICES] : null;
  const featureLabel = FEATURE_LABELS[requiredFeature] || requiredFeature;

  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Blurred content behind the overlay */}
      <div className="blur-sm pointer-events-none select-none opacity-50" aria-hidden="true">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center px-6 py-8 max-w-sm">
          <div className="mx-auto h-12 w-12 bg-brand-amber/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-brand-amber" />
          </div>
          <h3 className="text-lg font-semibold text-brand-dark mb-1">
            {featureLabel}
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            Cette fonctionnalité nécessite un abonnement supérieur.
          </p>
          {nextTier && nextTierLabel && nextTierPrice !== null && (
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-amber text-white rounded-lg font-medium text-sm hover:bg-amber-dark transition-colors"
            >
              Passer au plan {nextTierLabel} — {nextTierPrice}&euro;/mois
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
