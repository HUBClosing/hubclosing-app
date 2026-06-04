import { requireUser } from '@/lib/auth';
import { TIER_PRICES } from '@/types/database';
import type { SubscriptionTier } from '@/types/database';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { Check, X, Crown, Zap, Shield, Sparkles, Users, BarChart3, Lock, TrendingUp, Award, Video, Target, MessageCircle, UserCheck } from 'lucide-react';
import { SubscriptionTabs } from './subscription-tabs';

interface TierInfo {
  tier: SubscriptionTier;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  highlight?: string;
  features: { label: string; included: boolean; isNew?: boolean }[];
  loseIfDowngrade?: string[];
}

const CANDIDATE_TIERS: TierInfo[] = [
  {
    tier: 'free',
    name: 'Découverte',
    subtitle: 'Tester la plateforme',
    icon: <Zap className="h-6 w-6" />,
    features: [
      { label: '3 candidatures / mois', included: true },
      { label: 'Accès offres standard', included: true },
      { label: 'Profil basique', included: true },
      { label: 'Tracker de performance', included: false },
      { label: 'CV de performance', included: false },
      { label: 'Score de réputation', included: false },
      { label: 'Offres premium', included: false },
      { label: 'Badge vérifié', included: false },
      { label: 'Matching auto', included: false },
      { label: 'Replays masterclasses', included: false },
      { label: 'Montée en compétence mensuelle', included: false },
      { label: 'Contact direct recruteur', included: false },
    ],
  },
  {
    tier: 'starter',
    name: 'Starter',
    subtitle: 'Outils quotidiens du closer',
    icon: <TrendingUp className="h-6 w-6" />,
    features: [
      { label: '15 candidatures / mois', included: true },
      { label: 'Accès offres premium', included: true, isNew: true },
      { label: 'Tracker de performance', included: true, isNew: true },
      { label: 'CV de performance partageable', included: true, isNew: true },
      { label: 'Score de réputation public', included: true, isNew: true },
      { label: 'Badge vérifié', included: false },
      { label: 'Matching auto', included: false },
      { label: 'Replays masterclasses', included: false },
      { label: 'Montée en compétence mensuelle', included: false },
      { label: 'Contact direct recruteur', included: false },
    ],
    loseIfDowngrade: [
      'Tracker de performance (données conservées mais inaccessibles)',
      'CV de performance public',
      'Score de réputation',
      'Accès offres premium',
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    subtitle: 'Visibilité + formation',
    highlight: 'Populaire',
    icon: <Award className="h-6 w-6" />,
    features: [
      { label: 'Candidatures illimitées', included: true },
      { label: 'Tout Starter inclus', included: true },
      { label: 'Badge "Profil vérifié"', included: true, isNew: true },
      { label: 'Matching auto avec offres', included: true, isNew: true },
      { label: 'Replays masterclasses', included: true, isNew: true },
      { label: 'Montée en compétence mensuelle', included: false },
      { label: 'Contact direct recruteur', included: false },
      { label: 'Stats avancées + export', included: false },
      { label: 'Cercle privé top closers', included: false },
    ],
    loseIfDowngrade: [
      'Badge "Profil vérifié" (visible par les recruteurs)',
      'Matching automatique',
      'Bibliothèque de replays',
    ],
  },
  {
    tier: 'elite',
    name: 'Élite',
    subtitle: 'Réseau + montée en compétence — tout inclus',
    icon: <Crown className="h-6 w-6" />,
    features: [
      { label: 'Candidatures illimitées', included: true },
      { label: 'Tout Pro inclus', included: true },
      { label: 'Montée en compétence mensuelle', included: true, isNew: true },
      { label: 'Contact direct recruteurs', included: true, isNew: true },
      { label: 'Stats avancées + export PDF', included: true, isNew: true },
      { label: 'Cercle privé top closers', included: true, isNew: true },
    ],
    loseIfDowngrade: [
      'Montée en compétence mensuelle',
      'Accès au cercle privé des top closers',
      'Contact direct avec les recruteurs',
      'Export de statistiques',
    ],
  },
];

const RECRUITER_TIERS: TierInfo[] = [
  {
    tier: 'free',
    name: 'Découverte',
    subtitle: 'Tester le recrutement',
    icon: <Zap className="h-6 w-6" />,
    features: [
      { label: '1 offre active', included: true },
      { label: '5 contacts / mois', included: true },
      { label: 'Messagerie basique', included: true },
      { label: 'CVthèque', included: false },
      { label: 'Boost d\'offre', included: false },
      { label: 'Matching IA', included: false },
      { label: 'Analytics', included: false },
      { label: 'Multi-utilisateurs', included: false },
    ],
  },
  {
    tier: 'business',
    name: 'Business',
    subtitle: 'Recrutement régulier',
    icon: <Users className="h-6 w-6" />,
    highlight: 'Recommandé',
    features: [
      { label: '5 offres actives', included: true },
      { label: '30 contacts / mois', included: true, isNew: true },
      { label: '1 boost / mois inclus', included: true, isNew: true },
      { label: 'CVthèque complète', included: true, isNew: true },
      { label: 'Filtres avancés', included: true, isNew: true },
      { label: 'Matching IA', included: false },
      { label: 'Analytics avancés', included: false },
      { label: 'Multi-utilisateurs', included: false },
    ],
  },
  {
    tier: 'agency',
    name: 'Agence',
    subtitle: 'Volume + équipe',
    icon: <BarChart3 className="h-6 w-6" />,
    features: [
      { label: 'Offres illimitées', included: true },
      { label: 'Contacts illimités', included: true },
      { label: 'Boosts illimités', included: true },
      { label: 'Tout Business inclus', included: true },
      { label: 'Matching IA', included: true, isNew: true },
      { label: 'Analytics avancés', included: true, isNew: true },
      { label: 'Multi-utilisateurs', included: true, isNew: true },
    ],
  },
];

function TierCard({ info, isCurrent }: { info: TierInfo; isCurrent: boolean }) {
  const price = TIER_PRICES[info.tier as keyof typeof TIER_PRICES];

  return (
    <Card className={`relative ${isCurrent ? 'ring-2 ring-brand-amber border-brand-amber' : ''}`}>
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-amber text-white text-xs font-semibold px-3 py-0.5 rounded-full">
          Plan actuel
        </div>
      )}
      {info.highlight && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-dark text-white text-xs font-semibold px-3 py-0.5 rounded-full">
          {info.highlight}
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
        <ul className="space-y-2">
          {info.features.map((feature) => (
            <li key={feature.label} className="flex items-start gap-2 text-sm">
              {feature.included ? (
                <Check className={`h-4 w-4 mt-0.5 shrink-0 ${feature.isNew ? 'text-brand-amber' : 'text-green-500'}`} />
              ) : (
                <X className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
              )}
              <span className={`${feature.included ? 'text-gray-700' : 'text-gray-400'} ${feature.isNew ? 'font-medium' : ''}`}>
                {feature.label}
                {feature.isNew && <span className="text-xs text-brand-amber ml-1">nouveau</span>}
              </span>
            </li>
          ))}
        </ul>

        {/* Ce que vous perdez en downgrade */}
        {info.loseIfDowngrade && info.loseIfDowngrade.length > 0 && isCurrent && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-xs font-medium text-red-700 mb-1.5 flex items-center gap-1">
              <Lock className="h-3 w-3" /> En cas de résiliation vous perdez :
            </p>
            <ul className="space-y-1">
              {info.loseIfDowngrade.map((item) => (
                <li key={item} className="text-xs text-red-600 flex items-start gap-1">
                  <span className="shrink-0">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5">
          {isCurrent ? (
            <span className="block w-full text-center py-2.5 text-sm font-medium text-brand-amber bg-brand-amber/10 rounded-lg">
              Votre plan actuel
            </span>
          ) : (
            <a
              href="#"
              className="block w-full text-center py-2.5 text-sm font-medium text-white bg-brand-amber rounded-lg hover:bg-brand-amber/90 transition-colors"
            >
              Choisir ce plan
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TierGrid({ tiers, currentTier }: { tiers: TierInfo[]; currentTier: SubscriptionTier }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tiers.map((info) => (
        <TierCard key={info.tier} info={info} isCurrent={info.tier === currentTier} />
      ))}
    </div>
  );
}

export default async function SubscriptionPage() {
  const user = await requireUser();

  const showTabs = user.role_type === 'both';
  const isCandidateView = user.active_role === 'candidate' || user.role_type === 'candidate';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Abonnement</h1>
        <p className="text-gray-500 mt-1">
          Chaque plan inclut toutes les fonctionnalités des plans inférieurs.
        </p>
      </div>

      {showTabs ? (
        <SubscriptionTabs
          candidateContent={<TierGrid tiers={CANDIDATE_TIERS} currentTier={user.tier} />}
          recruiterContent={<TierGrid tiers={RECRUITER_TIERS} currentTier={user.tier} />}
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
