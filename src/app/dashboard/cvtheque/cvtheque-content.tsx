'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, Avatar, Badge, EmptyState } from '@/components/ui';
import {
  Search, SlidersHorizontal, X, ChevronDown, ChevronUp,
  Star, Briefcase, DollarSign, Phone, MapPin, CheckCircle2,
  XCircle, Shield, Trophy, Crown, Gem,
} from 'lucide-react';
import type { User, Profile, ExperienceLevel, BadgeLevel, Skill } from '@/types/database';
import { BADGE_THRESHOLDS, getRemainingContacts } from '@/types/database';

// ── Config ──

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  junior: 'Junior',
  intermediaire: 'Intermédiaire',
  senior: 'Senior',
  expert: 'Expert',
};

const SKILL_LABELS: Record<Skill, string> = {
  closing: 'Closing',
  setting: 'Setting',
  management: 'Management',
  hos: 'HOS',
  coaching: 'Coaching',
  training: 'Formation',
};

const BADGE_ICONS: Record<BadgeLevel, typeof Shield> = {
  bronze: Shield,
  silver: Star,
  gold: Trophy,
  platinum: Crown,
  diamond: Gem,
};

type SortOption = 'score' | 'deals' | 'revenue' | 'newest';

interface CandidateProfile extends Profile {
  user: User;
}

interface CvthequeContentProps {
  candidates: CandidateProfile[];
  user: User;
}

export function CvthequeContent({ candidates, user }: CvthequeContentProps) {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterNiche, setFilterNiche] = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [filterExperience, setFilterExperience] = useState('');
  const [filterBadge, setFilterBadge] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');
  const [sort, setSort] = useState<SortOption>('score');

  const remainingContacts = getRemainingContacts(user);

  // Niches disponibles à partir des données réelles
  const availableNiches = useMemo(() => {
    const niches = new Set<string>();
    candidates.forEach((c) => {
      c.preferred_niches?.forEach((n: string) => niches.add(n));
      c.user?.niches?.forEach((n: string) => niches.add(n));
    });
    return Array.from(niches).sort();
  }, [candidates]);

  // Filtre + tri
  const filtered = useMemo(() => {
    let result = [...candidates];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        const name = (c.user?.full_name || '').toLowerCase();
        const bio = (c.bio || '').toLowerCase();
        const niches = [...(c.preferred_niches || []), ...(c.user?.niches || [])].join(' ').toLowerCase();
        const skills = (c.user?.skills || []).join(' ').toLowerCase();
        const specialties = (c.specialties || []).join(' ').toLowerCase();
        return name.includes(q) || bio.includes(q) || niches.includes(q) || skills.includes(q) || specialties.includes(q);
      });
    }

    // Filter niche
    if (filterNiche) {
      result = result.filter((c) => {
        const allNiches = [...(c.preferred_niches || []), ...(c.user?.niches || [])];
        return allNiches.some((n: string) => n === filterNiche);
      });
    }

    // Filter skill
    if (filterSkill) {
      result = result.filter((c) => c.user?.skills?.includes(filterSkill as Skill));
    }

    // Filter experience
    if (filterExperience) {
      result = result.filter((c) => c.experience_level === filterExperience);
    }

    // Filter badge
    if (filterBadge) {
      result = result.filter((c) => c.badge_level === filterBadge);
    }

    // Filter availability
    if (filterAvailability === 'available') {
      result = result.filter((c) => c.availability);
    } else if (filterAvailability === 'unavailable') {
      result = result.filter((c) => !c.availability);
    }

    // Sort
    result.sort((a, b) => {
      switch (sort) {
        case 'score':
          return (b.score || 0) - (a.score || 0);
        case 'deals':
          return (b.total_deals_closed || 0) - (a.total_deals_closed || 0);
        case 'revenue':
          return (b.total_revenue_generated || 0) - (a.total_revenue_generated || 0);
        case 'newest':
          return new Date(b.user?.created_at || 0).getTime() - new Date(a.user?.created_at || 0).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [candidates, search, filterNiche, filterSkill, filterExperience, filterBadge, filterAvailability, sort]);

  const hasActiveFilters = !!(filterNiche || filterSkill || filterExperience || filterBadge || filterAvailability);

  const clearFilters = () => {
    setFilterNiche('');
    setFilterSkill('');
    setFilterExperience('');
    setFilterBadge('');
    setFilterAvailability('');
  };

  return (
    <div className="space-y-4">
      {/* Contacts restants (recruteurs) */}
      {remainingContacts !== Infinity && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <Phone className="h-4 w-4 text-blue-500 shrink-0" />
          <span className="text-blue-700">
            <strong>{remainingContacts === 0 ? 'Aucun' : remainingContacts}</strong> contact{remainingContacts > 1 ? 's' : ''} restant{remainingContacts > 1 ? 's' : ''} ce mois
          </span>
          {remainingContacts === 0 && (
            <Link href="/dashboard/subscription" className="ml-auto text-xs font-medium text-blue-600 hover:underline">
              Augmenter mon quota →
            </Link>
          )}
        </div>
      )}

      {/* Search + Sort bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, niche, compétence..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green bg-white"
          >
            <option value="score">Score réputation ↓</option>
            <option value="deals">Deals closés ↓</option>
            <option value="revenue">Revenu généré ↓</option>
            <option value="newest">Plus récents</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? 'border-brand-green bg-brand-green/5 text-brand-green'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtres
            {hasActiveFilters && (
              <span className="h-5 w-5 bg-brand-green text-white rounded-full text-xs flex items-center justify-center">
                {[filterNiche, filterSkill, filterExperience, filterBadge, filterAvailability].filter(Boolean).length}
              </span>
            )}
            {showFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Niche</label>
                <select
                  value={filterNiche}
                  onChange={(e) => setFilterNiche(e.target.value)}
                  className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                >
                  <option value="">Toutes les niches</option>
                  {availableNiches.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Compétence</label>
                <select
                  value={filterSkill}
                  onChange={(e) => setFilterSkill(e.target.value)}
                  className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                >
                  <option value="">Toutes</option>
                  {(Object.keys(SKILL_LABELS) as Skill[]).map((s) => (
                    <option key={s} value={s}>{SKILL_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Expérience</label>
                <select
                  value={filterExperience}
                  onChange={(e) => setFilterExperience(e.target.value)}
                  className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                >
                  <option value="">Tous niveaux</option>
                  {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((l) => (
                    <option key={l} value={l}>{EXPERIENCE_LABELS[l]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Badge</label>
                <select
                  value={filterBadge}
                  onChange={(e) => setFilterBadge(e.target.value)}
                  className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                >
                  <option value="">Tous badges</option>
                  {(Object.keys(BADGE_THRESHOLDS) as BadgeLevel[]).map((b) => (
                    <option key={b} value={b}>{BADGE_THRESHOLDS[b].label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Disponibilité</label>
                <select
                  value={filterAvailability}
                  onChange={(e) => setFilterAvailability(e.target.value)}
                  className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                >
                  <option value="">Tous</option>
                  <option value="available">Disponible</option>
                  <option value="unavailable">Non disponible</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                {filterNiche && (
                  <FilterChip label={`Niche: ${filterNiche}`} onRemove={() => setFilterNiche('')} />
                )}
                {filterSkill && (
                  <FilterChip label={`Compétence: ${SKILL_LABELS[filterSkill as Skill] || filterSkill}`} onRemove={() => setFilterSkill('')} />
                )}
                {filterExperience && (
                  <FilterChip label={`Exp: ${EXPERIENCE_LABELS[filterExperience as ExperienceLevel] || filterExperience}`} onRemove={() => setFilterExperience('')} />
                )}
                {filterBadge && (
                  <FilterChip label={`Badge: ${BADGE_THRESHOLDS[filterBadge as BadgeLevel]?.label || filterBadge}`} onRemove={() => setFilterBadge('')} />
                )}
                {filterAvailability && (
                  <FilterChip label={filterAvailability === 'available' ? 'Disponible' : 'Non disponible'} onRemove={() => setFilterAvailability('')} />
                )}
                <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium ml-2">
                  Tout effacer
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results count */}
      {(search || hasActiveFilters) && (
        <p className="text-sm text-gray-500">
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
          {search && <> pour &quot;{search}&quot;</>}
        </p>
      )}

      {/* Candidate grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title="Aucun candidat trouvé"
              description={
                hasActiveFilters || search
                  ? 'Essayez de modifier vos critères de recherche ou filtres.'
                  : 'Aucun profil public n\'est encore disponible.'
              }
              action={
                hasActiveFilters ? (
                  <button
                    onClick={() => { clearFilters(); setSearch(''); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-brand-green border border-brand-green rounded-lg hover:bg-brand-green/5 transition-colors"
                  >
                    Réinitialiser les filtres
                  </button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-green/10 text-brand-green rounded-full text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-brand-dark transition-colors">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function CandidateCard({ candidate }: { candidate: CandidateProfile }) {
  const u = candidate.user;
  const badgeConfig = BADGE_THRESHOLDS[candidate.badge_level] || BADGE_THRESHOLDS.bronze;
  const BadgeIcon = BADGE_ICONS[candidate.badge_level] || Shield;

  const allNiches = Array.from(new Set([...(candidate.preferred_niches || []), ...(u?.niches || [])]));

  return (
    <Link href={`/dashboard/cvtheque/${u.id}`}>
      <Card hover className="h-full">
        <CardContent className="p-5">
          {/* Header : avatar + name + badge */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar src={u.avatar_url} fallback={u.full_name || u.email} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-brand-dark truncate">{u.full_name || 'Anonyme'}</h3>
                {candidate.is_featured && (
                  <span className="text-brand-amber" title="Profil mis en avant">
                    <Star className="h-4 w-4 fill-current" />
                  </span>
                )}
              </div>
              {/* Badge + score */}
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${badgeConfig.bgColor} ${badgeConfig.color}`}>
                  <BadgeIcon className="h-3 w-3" />
                  {badgeConfig.label}
                </span>
                <span className="text-xs text-gray-500">{candidate.score}/100</span>
              </div>
              {/* Experience level */}
              {candidate.experience_level && (
                <p className="text-xs text-gray-500 mt-0.5 capitalize">
                  {EXPERIENCE_LABELS[candidate.experience_level]}
                </p>
              )}
            </div>
            {/* Disponibilité */}
            <div className="shrink-0">
              {candidate.availability ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Dispo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full font-medium">
                  <XCircle className="h-3 w-3" /> Indispo
                </span>
              )}
            </div>
          </div>

          {/* Bio preview */}
          {candidate.bio && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{candidate.bio}</p>
          )}

          {/* Skills */}
          {u.skills && u.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {u.skills.map((skill: string) => (
                <span key={skill} className="text-xs bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full capitalize font-medium">
                  {SKILL_LABELS[skill as Skill] || skill}
                </span>
              ))}
            </div>
          )}

          {/* Niches */}
          {allNiches.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {allNiches.slice(0, 3).map((niche: string) => (
                <span key={niche} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {niche}
                </span>
              ))}
              {allNiches.length > 3 && (
                <span className="text-xs text-gray-400">+{allNiches.length - 3}</span>
              )}
            </div>
          )}

          {/* Stats footer */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xs text-gray-400">Deals</p>
              <p className="text-sm font-bold text-brand-dark">{candidate.total_deals_closed || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Revenu</p>
              <p className="text-sm font-bold text-brand-dark">
                {candidate.total_revenue_generated
                  ? `${(candidate.total_revenue_generated / 1000).toFixed(0)}k€`
                  : '0€'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Avis</p>
              <p className="text-sm font-bold text-brand-dark">{candidate.total_reviews || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
