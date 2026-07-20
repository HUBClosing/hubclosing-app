'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { Check, X, Crown, Zap, Lock, TrendingUp, Award, Users, BarChart3, Loader2, Settings, CheckCircle, AlertTriangle } from 'lucide-react';
import { TIER_PRICES } from '@/types/database';
import type { User, SubscriptionTier } from '@/types/database';
import { SubscriptionTabs } from './subscription-tabs';

// ==========================================
// Tier definitions
// ==========================================

interface TierInfo {
  tier: SubscriptionTier;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  highlight?: string;
  features: { label: string; included: boolean }[];
  loseIfDowngrade?: string[];
}

const CANDIDATE_TIERS: TierInfo[] = [
  {
    tier: 'free', name: 'Découverte', subtitle: 'Tester la plateforme', icon: <Zap className="h-6 w-6" />,
    features: [
      { label: '3 candidatures / mois', included: true },
      { label: 'Accès offres standard', included: true },
      { label: 'Profil basique', included: true },
      { label: 'Messagerie', included: true },
      { label: 'Offres premium', included: false },
      { label: 'Tracker de performance', included: false },
      { label: 'CV de performance partageable', included: false },
      { label: 'Score de réputation public', included: false },
      { label: 'Badge "Profil vérifié"', included: false },
      { label: 'Matching auto avec offres', included: false },
      { label: 'Masterclasses', included: false },
      { label: 'Montée en compétence mensuelle', included: false },
      { label: 'Outils de comptabilité', included: false },
    ],
  },
  {
    tier: 'starter', name: 'Starter', subtitle: 'Outils quotidiens du closer', icon: <TrendingUp className="h-6 w-6" />,
    features: [
      { label: '6 candidatures / mois', included: true },
      { label: 'Tracker de performance', included: true },
      { label: 'CV de performance partageable', included: true },
      { label: 'Score de réputation public', included: true },
      { label: 'Tout Découverte inclus', included: true },
      { label: 'Offres premium', included: false },
      { label: 'Badge "Profil vérifié"', included: false },
      { label: 'Matching auto avec offres', included: false },
      { label: 'Masterclasses', included: false },
      { label: 'Montée en compétence mensuelle', included: false },
      { label: 'Outils de comptabilité', included: false },
    ],
    loseIfDowngrade: ['Tracker de performance', 'CV de performance partageable', 'Score de réputation public'],
  },
  {
    tier: 'pro', name: 'Pro', subtitle: 'Visibilité + formation', highlight: 'Populaire', icon: <Award className="h-6 w-6" />,
    features: [
      { label: '15 candidatures / mois', included: true },
      { label: 'Accès offres premium', included: true },
      { label: 'Badge "Profil vérifié"', included: true },
      { label: 'Matching auto avec offres', included: true },
      { label: 'Masterclasses + replays', included: true },
      { label: 'Tout Starter inclus', included: true },
      { label: 'Montée en compétence mensuelle', included: false },
      { label: 'Outils de comptabilité', included: false },
      { label: 'Contact direct recruteurs', included: false },
    ],
    loseIfDowngrade: ['Accès offres premium', 'Badge vérifié', 'Matching auto', 'Masterclasses'],
  },
  {
    tier: 'elite', name: 'Élite', subtitle: 'Réseau + montée en compétence', icon: <Crown className="h-6 w-6" />,
    features: [
      { label: 'Candidatures illimitées', included: true },
      { label: 'Montée en compétence mensuelle', included: true },
      { label: 'Outils de comptabilité', included: true },
      { label: 'Contact direct recruteurs', included: true },
      { label: 'Tout Pro inclus', included: true },
    ],
    loseIfDowngrade: ['Montée en compétence', 'Outils comptabilité', 'Contact direct recruteurs'],
  },
];

const RECRUITER_TIERS: TierInfo[] = [
  {
    tier: 'free', name: 'Découverte', subtitle: 'Tester le recrutement', icon: <Zap className="h-6 w-6" />,
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
    tier: 'business', name: 'Business', subtitle: 'Recrutement régulier', highlight: 'Recommandé', icon: <Users className="h-6 w-6" />,
    features: [
      { label: '5 offres actives', included: true },
      { label: '30 contacts / mois', included: true },
      { label: '1 boost / mois inclus', included: true },
      { label: 'CVthèque complète', included: true },
      { label: 'Filtres avancés', included: true },
      { label: 'Matching IA', included: false },
      { label: 'Analytics avancés', included: false },
      { label: 'Multi-utilisateurs', included: false },
    ],
  },
  {
    tier: 'agency', name: 'Agence', subtitle: 'Volume + équipe', icon: <BarChart3 className="h-6 w-6" />,
    features: [
      { label: 'Offres illimitées', included: true },
      { label: 'Contacts illimités', included: true },
      { label: 'Boosts illimités', included: true },
      { label: 'Matching IA', included: true },
      { label: 'Analytics avancés', included: true },
      { label: 'Multi-utilisateurs', included: true },
      { label: 'Tout Business inclus', included: true },
    ],
  },
];

// ==========================================
// Tier Card with Stripe actions
// ==========================================

function TierCard({
  info,
  isCurrent,
  loadingTier,
  onSubscribe,
  hasSubscription,
}: {
  info: TierInfo;
  isCurrent: boolean;
  loadingTier: string | null;
  onSubscribe: (tier: string) => void;
  hasSubscription: boolean;
}) {
  const price = TIER_PRICES[info.tier as keyof typeof TIER_PRICES];
  const isLoading = loadingTier === info.tier;
  const isFreeTier = info.tier === 'free';

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
                <Check className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
              )}
              <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                {feature.label}
              </span>
            </li>
          ))}
        </ul>

        {/* Ce que vous perdez si vous rétrogradiez */}
        {info.loseIfDowngrade && info.loseIfDowngrade.length > 0 && isCurrent && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-xs font-medium text-red-700 mb-1.5 flex items-center gap-1">
              <Lock className="h-3 w-3" /> En cas de résiliation vous perdez :
            </p>
            <ul className="space-y-1">
              {info.loseIfDowngrade.map((item) => (
                <li key={item} className="text-xs text-red-600 flex items-start gap-1">
                  <span className="shrink-0">&bull;</span> {item}
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
          ) : isFreeTier ? (
            <span className="block w-full text-center py-2.5 text-sm font-medium text-gray-400 bg-gray-50 rounded-lg">
              Plan par défaut
            </span>
          ) : (
            <button
              onClick={() => onSubscribe(info.tier)}
              disabled={isLoading || loadingTier !== null}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-white bg-brand-amber rounded-lg hover:bg-brand-amber/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Redirection...</>
              ) : hasSubscription ? (
                'Changer pour ce plan'
              ) : (
                'Choisir ce plan'
              )}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// TierGrid
// ==========================================

function TierGrid({
  tiers,
  currentTier,
  loadingTier,
  onSubscribe,
  hasSubscription,
}: {
  tiers: TierInfo[];
  currentTier: SubscriptionTier;
  loadingTier: string | null;
  onSubscribe: (tier: string) => void;
  hasSubscription: boolean;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tiers.map((info) => (
        <TierCard
          key={info.tier}
          info={info}
          isCurrent={info.tier === currentTier}
          loadingTier={loadingTier}
          onSubscribe={onSubscribe}
          hasSubscription={hasSubscription}
        />
      ))}
    </div>
  );
}

// ==========================================
// Main component
// ==========================================

export function SubscriptionContent({ user }: { user: User }) {
  const searchParams = useSearchParams();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const success = searchParams.get('success') === 'true';
  const canceled = searchParams.get('canceled') === 'true';
  const hasSubscription = !!user.stripe_subscription_id;

  const showTabs = user.role_type === 'both';
  const isCandidateView = user.active_role === 'candidate' || user.role_type === 'candidate';

  // Souscrire à un plan via Stripe Checkout
  const handleSubscribe = async (tier: string) => {
    setLoadingTier(tier);
    setError(null);

    try {
      // Si l'utilisateur a déjà un abonnement, ouvrir le portail pour changer de plan
      if (hasSubscription) {
        await handleOpenPortal();
        setLoadingTier(null);
        return;
      }

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la création du paiement');
        setLoadingTier(null);
        return;
      }

      // Redirection vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('Erreur de connexion au serveur de paiement');
      setLoadingTier(null);
    }
  };

  // Ouvrir le portail Stripe (gérer abonnement)
  const handleOpenPortal = async () => {
    setLoadingPortal(true);
    setError(null);

    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'ouverture du portail');
        setLoadingPortal(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('Erreur de connexion au serveur');
      setLoadingPortal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Abonnement</h1>
        <p className="text-gray-500 mt-1">
          Chaque plan inclut toutes les fonctionnalités des plans inférieurs.
        </p>
      </div>

      {/* Feedback success/cancel */}
      {success && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Paiement réussi !</p>
            <p className="text-xs text-green-600">
              Votre abonnement est activé. Vos nouvelles fonctionnalités sont disponibles immédiatement.
            </p>
          </div>
        </div>
      )}

      {canceled && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">Paiement annulé. Vous pouvez réessayer à tout moment.</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Bouton gérer abonnement existant */}
      {hasSubscription && (
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-brand-dark">
                Plan actuel : <span className="text-brand-amber capitalize">{user.tier}</span>
                {user.subscription_status === 'past_due' && (
                  <span className="ml-2 text-xs text-red-600 font-medium">(Paiement en retard)</span>
                )}
              </p>
              {user.subscription_period_end && (
                <p className="text-xs text-gray-500">
                  Prochain renouvellement : {new Date(user.subscription_period_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <button
              onClick={handleOpenPortal}
              disabled={loadingPortal}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-dark border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {loadingPortal ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Chargement...</>
              ) : (
                <><Settings className="h-4 w-4" /> Gérer mon abonnement</>
              )}
            </button>
          </CardContent>
        </Card>
      )}

      {/* Grille des plans */}
      {showTabs ? (
        <SubscriptionTabs
          candidateContent={
            <TierGrid
              tiers={CANDIDATE_TIERS}
              currentTier={user.tier}
              loadingTier={loadingTier}
              onSubscribe={handleSubscribe}
              hasSubscription={hasSubscription}
            />
          }
          recruiterContent={
            <TierGrid
              tiers={RECRUITER_TIERS}
              currentTier={user.tier}
              loadingTier={loadingTier}
              onSubscribe={handleSubscribe}
              hasSubscription={hasSubscription}
            />
          }
          defaultTab={isCandidateView ? 'candidate' : 'recruiter'}
        />
      ) : isCandidateView ? (
        <TierGrid
          tiers={CANDIDATE_TIERS}
          currentTier={user.tier}
          loadingTier={loadingTier}
          onSubscribe={handleSubscribe}
          hasSubscription={hasSubscription}
        />
      ) : (
        <TierGrid
          tiers={RECRUITER_TIERS}
          currentTier={user.tier}
          loadingTier={loadingTier}
          onSubscribe={handleSubscribe}
          hasSubscription={hasSubscription}
        />
      )}
    </div>
  );
}
