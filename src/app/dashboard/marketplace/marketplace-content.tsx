'use client';

import { useState, useMemo } from 'react';
import type { Offer, User, OfferType, ExperienceLevel } from '@/types/database';
import { OfferCard } from '@/components/offers/OfferCard';
import { RemainingApplicationsBanner } from '@/components/paywall/RemainingApplicationsBanner';
import { isOfferPremium } from '@/types/database';
import {
  Target, PhoneCall, Crown, Briefcase, LayoutGrid, Layers,
  ShoppingBag, Search, SlidersHorizontal, X, ArrowUpDown,
} from 'lucide-react';

// ============================================================
// Constants
// ============================================================

interface MarketplaceContentProps {
  offers: Offer[];
  user: User;
}

const tabs = [
  { key: 'all', label: 'Toutes', icon: LayoutGrid },
  { key: 'closing', label: 'Closers', icon: Target },
  { key: 'setting', label: 'Setters', icon: PhoneCall },
  { key: 'hos', label: 'HOS', icon: Crown },
  { key: 'management', label: 'Managers', icon: Briefcase },
  { key: 'other', label: 'Autre', icon: Layers },
];

const ALL_NICHES = [
  'Immobilier',
  'Bourse / Trading',
  'Crypto / Blockchain',
  'Coaching / Développement personnel',
  'E-commerce / Dropshipping',
  'Marketing digital',
  'Santé / Bien-être',
  'Finance / Investissement',
  'Formation professionnelle',
];

const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  challenge: 'Challenge',
  recurring: 'Récurrent',
  mission: 'Mission',
  full_time: 'Temps plein',
  part_time: 'Temps partiel',
  commission_only: 'Commission seule',
};

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  junior: 'Junior',
  intermediaire: 'Intermédiaire',
  senior: 'Senior',
  expert: 'Expert',
};

type SortOption = 'newest' | 'commission' | 'views';

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'newest', label: 'Plus récentes' },
  { key: 'commission', label: 'Commission ↑' },
  { key: 'views', label: 'Plus vues' },
];

// ============================================================
// Helpers
// ============================================================

function matchesTab(offer: Offer, tab: string): boolean {
  if (tab === 'all') return true;
  if (tab === 'other') {
    const skills = offer.required_skills || [];
    return skills.length === 0 || !skills.some(s =>
      ['closing', 'setting', 'hos', 'management'].includes(s)
    );
  }
  return (offer.required_skills || []).includes(tab as any);
}

interface Filters {
  search: string;
  niche: string | null;
  offerType: OfferType | null;
  experience: ExperienceLevel | null;
  sort: SortOption;
}

const defaultFilters: Filters = {
  search: '',
  niche: null,
  offerType: null,
  experience: null,
  sort: 'newest',
};

// ============================================================
// Component
// ============================================================

export function MarketplaceContent({ offers, user }: MarketplaceContentProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const activeFilterCount = [filters.niche, filters.offerType, filters.experience]
    .filter(Boolean).length;

  // Compute available niches from actual offers (only show niches that exist)
  const availableNiches = useMemo(() => {
    const niches = new Set(offers.map(o => o.niche).filter(Boolean) as string[]);
    return ALL_NICHES.filter(n => niches.has(n));
  }, [offers]);

  // Compute available offer types from actual offers
  const availableTypes = useMemo(() => {
    const types = new Set(offers.map(o => o.offer_type).filter(Boolean));
    return (Object.keys(OFFER_TYPE_LABELS) as OfferType[]).filter(t => types.has(t));
  }, [offers]);

  // Filtered + sorted offers
  const filteredOffers = useMemo(() => {
    let result = offers.filter(o => matchesTab(o, activeTab));

    // Search — title, description, niche, manager name
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(o =>
        o.title.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q) ||
        (o.niche || '').toLowerCase().includes(q) ||
        (o.manager?.full_name || '').toLowerCase().includes(q)
      );
    }

    // Niche filter
    if (filters.niche) {
      result = result.filter(o => o.niche === filters.niche);
    }

    // Offer type filter
    if (filters.offerType) {
      result = result.filter(o => o.offer_type === filters.offerType);
    }

    // Experience filter
    if (filters.experience) {
      result = result.filter(o => o.required_experience === filters.experience);
    }

    // Sort (boosted always first)
    result.sort((a, b) => {
      if (a.is_boosted !== b.is_boosted) return a.is_boosted ? -1 : 1;

      switch (filters.sort) {
        case 'commission':
          return (b.commission_rate || 0) - (a.commission_rate || 0);
        case 'views':
          return (b.views_count || 0) - (a.views_count || 0);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [offers, activeTab, filters]);

  // Separate sections
  const boostedOffers = filteredOffers.filter(o => o.is_boosted);
  const regularOffers = filteredOffers.filter(o => !o.is_boosted && !isOfferPremium(o));
  const premiumOffers = filteredOffers.filter(o => isOfferPremium(o) && !o.is_boosted);

  const resetFilters = () => setFilters(defaultFilters);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Banner candidatures restantes */}
      <RemainingApplicationsBanner user={user} />

      {/* ──── Search + filter toggle ──── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une offre, niche, recruteur…"
            value={filters.search}
            onChange={e => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-colors placeholder:text-gray-400"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${
            showFilters || activeFilterCount > 0
              ? 'bg-brand-green text-white border-brand-green'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
          {activeFilterCount > 0 && (
            <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort */}
        <div className="relative">
          <select
            value={filters.sort}
            onChange={e => updateFilter('sort', e.target.value as SortOption)}
            className="appearance-none pl-8 pr-6 py-2.5 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green/30 cursor-pointer"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
          <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* ──── Filter panel (collapsible) ──── */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-dark">Filtres avancés</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs text-brand-green hover:underline font-medium"
              >
                Réinitialiser tout
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Niche */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Niche</label>
              <select
                value={filters.niche || ''}
                onChange={e => updateFilter('niche', e.target.value || null)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              >
                <option value="">Toutes les niches</option>
                {availableNiches.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Offer type */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Type d&apos;offre</label>
              <select
                value={filters.offerType || ''}
                onChange={e => updateFilter('offerType', (e.target.value || null) as OfferType | null)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              >
                <option value="">Tous les types</option>
                {availableTypes.map(t => (
                  <option key={t} value={t}>{OFFER_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Niveau requis</label>
              <select
                value={filters.experience || ''}
                onChange={e => updateFilter('experience', (e.target.value || null) as ExperienceLevel | null)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              >
                <option value="">Tous niveaux</option>
                {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map(lvl => (
                  <option key={lvl} value={lvl}>{EXPERIENCE_LABELS[lvl]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {filters.niche && (
                <FilterChip
                  label={filters.niche}
                  onRemove={() => updateFilter('niche', null)}
                />
              )}
              {filters.offerType && (
                <FilterChip
                  label={OFFER_TYPE_LABELS[filters.offerType]}
                  onRemove={() => updateFilter('offerType', null)}
                />
              )}
              {filters.experience && (
                <FilterChip
                  label={EXPERIENCE_LABELS[filters.experience]}
                  onRemove={() => updateFilter('experience', null)}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ──── Skill tabs ──── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const count = offers.filter(o => matchesTab(o, tab.key)).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-brand-dark text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ──── Results count ──── */}
      {(filters.search || activeFilterCount > 0) && (
        <p className="text-xs text-gray-500">
          {filteredOffers.length} résultat{filteredOffers.length !== 1 ? 's' : ''}
          {filters.search && <> pour &quot;{filters.search}&quot;</>}
        </p>
      )}

      {/* ──── Offer grid ──── */}
      {filteredOffers.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {filters.search || activeFilterCount > 0
              ? 'Aucune offre ne correspond à vos critères'
              : 'Aucune offre dans cette catégorie'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {filters.search || activeFilterCount > 0
              ? 'Essayez d\'élargir vos filtres ou votre recherche.'
              : 'Essayez un autre onglet ou revenez plus tard.'}
          </p>
          {(filters.search || activeFilterCount > 0) && (
            <button
              onClick={resetFilters}
              className="mt-3 text-sm font-medium text-brand-green hover:underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Boosted */}
          {boostedOffers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {boostedOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} user={user} />
              ))}
            </div>
          )}

          {/* Regular offers */}
          {regularOffers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} user={user} />
              ))}
            </div>
          )}

          {/* Premium locked */}
          {premiumOffers.length > 0 && (
            <>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                  <Crown className="h-3.5 w-3.5 text-brand-amber" /> OFFRES PREMIUM
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {premiumOffers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} user={user} locked />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-green/10 text-brand-green text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:bg-brand-green/20 rounded-full p-0.5 transition-colors">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
