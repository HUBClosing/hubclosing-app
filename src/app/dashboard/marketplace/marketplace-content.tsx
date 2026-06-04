'use client';

import { useState } from 'react';
import type { Offer, User } from '@/types/database';
import { OfferCard } from '@/components/offers/OfferCard';
import { RemainingApplicationsBanner } from '@/components/paywall/RemainingApplicationsBanner';
import { isOfferPremium } from '@/types/database';
import {
  Target, PhoneCall, Crown, Briefcase, LayoutGrid, Layers,
  ShoppingBag,
} from 'lucide-react';

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

export function MarketplaceContent({ offers, user }: MarketplaceContentProps) {
  const [activeTab, setActiveTab] = useState('all');

  const filteredOffers = offers.filter(o => matchesTab(o, activeTab));

  // Separate boosted, regular, and premium (auto-qualifié ou manuel)
  const boostedOffers = filteredOffers.filter(o => o.is_boosted);
  const regularOffers = filteredOffers.filter(o => !o.is_boosted && !isOfferPremium(o));
  const premiumOffers = filteredOffers.filter(o => isOfferPremium(o) && !o.is_boosted);

  return (
    <div className="space-y-4">
      {/* Banner candidatures restantes */}
      <RemainingApplicationsBanner user={user} />

      {/* Onglets par métier */}
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

      {filteredOffers.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune offre dans cette catégorie</p>
          <p className="text-sm text-gray-400 mt-1">Essayez un autre onglet ou revenez plus tard.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Boosted en premier */}
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

          {/* Premium locked offers */}
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
