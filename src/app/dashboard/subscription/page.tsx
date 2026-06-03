import { requireUser } from '@/lib/auth';
import { TIER_PRICES } from '@/types/database';
import type { SubscriptionTier } from '@/types/database';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { Check, X, Crown, Zap, Shield, Sparkles, Users, BarChart3 } from 'lucide-react';
import { SubscriptionTabs } from './subscription-tabs';

// --- Tier metadata ---

interface TierInfo {
  tier: SubscriptionTier;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  features: { label: string; included: boolean }[];
}

const CANDIDATE_TIERS: TierInfo[] = [
  {
    tier: 'free',
    name: 'Gratuit',
    subtitle: 'Pour découvrir la plateforme',
    icon: <Zap className="h-6 w-6" />,
    features: [
      { label: '3 candidatures / mois', included: true },
      { label: 'Accès aux offres standard', included: true },
      { label: 'Offres premium', included: false },
      { label: 'Badge de réputation', included: false },
      { label: 'Matching intelligent', included: false },
      { label: 'Coaching', included: false },
      { label: 'Contact direct', included: false },
      { label: 'Statistiques avancées', included: false },
    ],
  },
  {
    tier: 'starter',
    name: 'Starter',
    subtitle: 'Pour les closers actifs',
    icon: <Shield className="h-6 w-6" />,
    features: [
      { label: '15 candidatures / mois', included: true },
      { label: 'Accès aux offres standard', included: true },
      { label: 'Offres premium', included: true },
      { label: 'Badge de réputation', included: false },
      { label: 'Matching intelligent', included: false },
      { label: 'Coaching', included: false },
      { label: 'Contact direct', included: false },
      { label: 'Statistiques avancées', included: false },
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    subtitle: 'Pour les closers sérieux',
    icon: <Sparkles className="h-6 w-6" />,
    features: [
      { label: 'Candidatures illimitées', included: true },
      { label: 'Accès aux offres standard', included: true },
      { label: 'Offres premium', included: true },
      { label: 'Badge de réputation', included: true },
      { label: 'Matching intelligent', included: true },
      { label: 'Coaching', included: false },
      { label: 'Contact direct', included: false },
      { label: 'Statistiques avancées', included: false },
    ],
  },
  {
    tier: 'elite',
    name: 'Elite',
    subtitle: 'Tout inclus, sans limite',
    icon: <Crown className="h-6 w-6" />,
    features: [
      { label: 'Candidatures illimitées', included: true },
      { label: 'Accès aux offres standard', included: true },
      { label: 'Offres premium', included: true },
      { label: 'Badge de réputation', included: true },
      { label: 'Matching intelligent', included: true },
      { label: 'Coaching', included: true },
      { label: 'Contact direct', included: true },
      { label: 'Statistiques avancées', included: true },
    ],
  },
];

const RECRUITER_TIERS: TierInfo[] = [
  {
    tier: 'free',
    name: 'Gratuit',
    subtitle: 'Pour tester le recrutement',
    icon: <Zap className="h-6 w-6" />,
    features: [
      { label: '1 offre active', included: true },
      { label: '3 contacts / mois', included: true },
      { label: 'Boost d\'offre', included: false },
      { label: 'Matching intelligent', included: false },
      { label: 'Analytics avancés', included: false },
      { label: 'Membres d\'équipe', included: false },
    ],
  },
  {
    tier: 'business',
    name: 'Business',
    subtitle: 'Pour les recruteurs réguliers',
    icon: <Users className="h-6 w-6" />,
    features: [
      { label: '5 offres actives', included: true },
      { label: '10 contacts / mois', included: true },
      { label: '1 boost d\'offre', included: true },
      { label: 'Matching intelligent', included: false },
      { label: 'Analytics avancés', included: false },
      { label: '1 membre d\'équipe', included: true },
    ],
  },
  {
    tier: 'agency',
    name: 'Agency',
    subtitle: 'Pour les agences et grandes équipes',
    icon: <BarChart3 className="h-6 w-6" />,
    features: [
      { label: 'Offres illimitées', included: true },
      { label: 'Contacts illimités', included: true },
      { label: 'Boosts illimités', included: true },
      { label: 'Matching intelligent', included: true },
      { label: 'Analytics avancés', included: true },
      { label: 'Membres d\'équipe illimités', included: true },
    ],
  },
];

// --- Tier card ---

function TierCard({ info, isCurrent }: { info: TierInfo; isCurrent: boolean }) {
  const price = TIER_PRICES[info.tier as keyof typeof TIER_PRICES];

  return (
    <Card
      className={
        isCurrent
          ? 'ring-2 ring-brand-amber border-brand-amber relative'
          : 'relative'
      }
    >
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-amber text-white text-xs font-semibold px-3 py-0.5 rounded-full">
          Plan actuel
        </div>
      )}
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-brand-amber/10 flex items-center justify-center text-brand-amber">
            {info.icon}
          </div>
          <div>
            <h3 className="font-semibold text-brand-dark">{info.name}</h3>
            <p className="text-xs text-gray-500">{info.subtitle}</p>
          </div>
        </div>
        <div className="mt-4">
          {price === 0 ? (
            <span className="text-2xl font-bold text-brand-dark">Gratuit</span>
          ) : (
            <span className="text-2xl font-bold text-brand-dark">
              {price}&euro;<span className="text-sm font-normal text-gray-500">/mois</span>
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {info.features.map((feature) => (
            <li key={feature.label} className="flex items-start gap-2 text-sm">
              {feature.included ? (
                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              ) : (
                <X className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
              )}
              <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                {feature.label}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          {isCurrent ? (
            <span className="block w-full text-center py-2.5 text-sm font-medium text-brand-amber bg-brand-amber/10 rounded-lg">
              Votre plan actuel
            </span>
          ) : (
            <a
              href="#"
              className="block w-full text-center py-2.5 text-sm font-medium text-white bg-brand-amber rounded-lg hover:bg-amber-dark transition-colors"
            >
              Choisir ce plan
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Tier grid (reused in both direct render and tabs) ---

function TierGrid({ tiers, currentTier }: { tiers: TierInfo[]; currentTier: SubscriptionTier }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tiers.map((info) => (
        <TierCard key={info.tier} info={info} isCurrent={info.tier === currentTier} />
      ))}
    </div>
  );
}

// --- Page ---

export default async function SubscriptionPage() {
  const user = await requireUser();

  const showTabs = user.role_type === 'both';
  const isCandidateView = user.active_role === 'candidate';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Abonnement</h1>
        <p className="text-gray-500 mt-1">
          Gérez votre plan et accédez à plus de fonctionnalités.
        </p>
      </div>

      {showTabs ? (
        <SubscriptionTabs
          candidateContent={
            <TierGrid tiers={CANDIDATE_TIERS} currentTier={user.tier} />
          }
          recruiterContent={
            <TierGrid tiers={RECRUITER_TIERS} currentTier={user.tier} />
          }
          defaultTab={isCandidateView ? 'candidate' : 'recruiter'}
        />
      ) : isCandidateView ? (
        <TierGrid tiers={CANDIDATE_TIERS} currentTier={user.tier} />
      ) : (
        <TierGrid tiers={RECRUITER_TIERS} currentTier={user.tier} />
      )}
    </div>
  );
}
