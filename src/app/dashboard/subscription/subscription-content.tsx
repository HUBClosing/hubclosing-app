'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { Check, X, Crown, Zap, Lock, TrendingUp, Award, Users, BarChart3, Loader2, Settings, CheckCircle, AlertTriangle } from 'lucide-react';
import { TIER_PRICES, RECRUITER_ADDON_PRICES, ONE_TIME_TIERS } from '@/types/database';
import type { User, SubscriptionTier } from '@/types/database';
import { SubscriptionTabs } from './subscription-tabs';
import { ShoppingCart, Package, Sparkles } from 'lucide-react';

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
    tier: 'solo', name: 'Solo', subtitle: 'Recruter un profil ciblé', icon: <Zap className="h-6 w-6" />,
    features: [
      { label: '1 annonce (60 jours)', included: true },
      { label: '3 profils débloqués', included: true },
      { label: 'Smart Sourcing IA', included: true },
      { label: 'Questionnaire personnalisé', included: true },
      { label: 'Garantie republication', included: true },
      { label: 'Profils anonymisés avant déblocage', included: true },
      { label: 'Boost d\'offre', included: false },
      { label: 'Dashboard analytics', included: false },
    ],
  },
  {
    tier: 'equipe', name: 'Équipe', subtitle: 'Plus de profils à découvrir', highlight: 'Populaire', icon: <Users className="h-6 w-6" />,
    features: [
      { label: '1 annonce (90 jours)', included: true },
      { label: '5 profils débloqués', included: true },
      { label: '1 boost d\'offre inclus', included: true },
      { label: 'Smart Sourcing IA', included: true },
      { label: 'Questionnaire personnalisé', included: true },
      { label: 'Garantie republication', included: true },
      { label: 'Profils anonymisés avant déblocage', included: true },
      { label: 'Dashboard analytics', included: false },
    ],
  },
  {
    tier: 'campagne', name: 'Campagne', subtitle: 'Accès élargi aux talents', icon: <TrendingUp className="h-6 w-6" />,
    features: [
      { label: '1 annonce (120 jours)', included: true },
      { label: '10 profils débloqués', included: true },
      { label: '3 boosts d\'offre inclus', included: true },
      { label: 'Smart Sourcing IA', included: true },
      { label: 'Questionnaire personnalisé', included: true },
      { label: 'Garantie republication', included: true },
      { label: 'Profils anonymisés avant déblocage', included: true },
      { label: 'Dashboard analytics', included: false },
    ],
  },
  {
    tier: 'agency', name: 'Agence', subtitle: 'Volume illimité + analytics', icon: <BarChart3 className="h-6 w-6" />,
    features: [
      { label: 'Annonces illimitées', included: true },
      { label: '20 profils débloqués / mois', included: true },
      { label: '5 boosts / mois', included: true },
      { label: 'Smart Sourcing IA prioritaire', included: true },
      { label: 'Dashboard analytics avancé', included: true },
      { label: 'Questionnaire personnalisé', included: true },
      { label: 'Garantie republication', included: true },
      { label: 'Profils anonymisés avant déblocage', included: true },
    ],
  },
];

/** Add-ons achetables individuellement */
interface AddonInfo {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
}

const RECRUITER_ADDONS: AddonInfo[] = [
  { id: 'deblocage_1', name: '1 Déblocage', description: 'Débloquer un profil candidat supplémentaire', price: 12, icon: <Lock className="h-5 w-5" /> },
  { id: 'deblocage_5', name: '5 Déblocages', description: 'Pack de 5 déblocages de profils', price: 49, icon: <Package className="h-5 w-5" /> },
  { id: 'boost', name: '1 Boost', description: 'Mettre en avant une annonce pendant 7 jours', price: 9, icon: <Sparkles className="h-5 w-5" /> },
  { id: 'annonce_sup', name: '1 Annonce', description: 'Publier une annonce supplémentaire', price: 19, icon: <ShoppingCart className="h-5 w-5" /> },
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
  const isOneTime = ONE_TIME_TIERS.has(info.tier);

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
              {price}&euro;{isOneTime ? (
                <span className="text-sm font-normal text-gray-500"> unique</span>
              ) : (
                <span className="text-sm font-normal text-gray-500">/mois</span>
              )}
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
              ) : isOneTime ? (
                'Acheter ce pack'
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
// Addon Card (recruteur)
// ==========================================

function AddonCard({
  addon,
  loadingTier,
  onPurchase,
}: {
  addon: AddonInfo;
  loadingTier: string | null;
  onPurchase: (addonId: string) => void;
}) {
  const isLoading = loadingTier === addon.id;

  return (
    <Card className="flex flex-col justify-between">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-9 w-9 rounded-lg bg-brand-amber/10 flex items-center justify-center text-brand-amber">
            {addon.icon}
          </div>
          <div>
            <h4 className="font-semibold text-brand-dark text-sm">{addon.name}</h4>
            <p className="text-xs text-gray-500">{addon.description}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-brand-dark">{addon.price}&euro;</span>
          <button
            onClick={() => onPurchase(addon.id)}
            disabled={isLoading || loadingTier !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-amber rounded-lg hover:bg-brand-amber/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> ...</>
            ) : (
              'Acheter'
            )}
          </button>
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
        <h1 className="text-2xl font-bold text-brand-dark">
          {isCandidateView ? 'Abonnement' : 'Packs Recruteur'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isCandidateView
            ? 'Chaque plan inclut toutes les fonctionnalités des plans inférieurs.'
            : 'Choisissez le pack adapté à vos besoins de recrutement. Smart Sourcing IA et garantie inclus.'}
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
      {(() => {
        const recruiterContent = (
          <>
            <TierGrid
              tiers={RECRUITER_TIERS}
              currentTier={user.tier}
              loadingTier={loadingTier}
              onSubscribe={handleSubscribe}
              hasSubscription={hasSubscription}
            />
            {/* Crédits restants */}
            {(user.recruiter_annonces_remaining > 0 || user.recruiter_deblocages_remaining > 0 || user.recruiter_boosts_remaining > 0) && (
              <Card className="mt-6">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-brand-dark mb-3">Vos crédits restants</h3>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-brand-amber">{user.recruiter_annonces_remaining}</p>
                      <p className="text-xs text-gray-500">Annonces</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-brand-amber">{user.recruiter_deblocages_remaining}</p>
                      <p className="text-xs text-gray-500">Déblocages</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-brand-amber">{user.recruiter_boosts_remaining}</p>
                      <p className="text-xs text-gray-500">Boosts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Add-ons */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-brand-dark mb-1">Recharges à la carte</h3>
              <p className="text-sm text-gray-500 mb-4">Besoin de plus ? Achetez des crédits supplémentaires.</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {RECRUITER_ADDONS.map((addon) => (
                  <AddonCard
                    key={addon.id}
                    addon={addon}
                    loadingTier={loadingTier}
                    onPurchase={handleSubscribe}
                  />
                ))}
              </div>
            </div>
          </>
        );

        if (showTabs) {
          return (
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
              recruiterContent={recruiterContent}
              defaultTab={isCandidateView ? 'candidate' : 'recruiter'}
            />
          );
        }
        if (isCandidateView) {
          return (
            <TierGrid
              tiers={CANDIDATE_TIERS}
              currentTier={user.tier}
              loadingTier={loadingTier}
              onSubscribe={handleSubscribe}
              hasSubscription={hasSubscription}
            />
          );
        }
        return recruiterContent;
      })()}
    </div>
  );
}
