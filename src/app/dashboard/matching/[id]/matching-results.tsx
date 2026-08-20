'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Sparkles, Heart, X, MessageCircle, Eye,
  Award, Target, Globe2, TrendingUp, Video, GraduationCap,
  Clock, Star, CheckCircle2, Filter,
  ChevronDown, ChevronUp, RefreshCw, Loader2,
  Briefcase, Users,
} from 'lucide-react';
import { getNicheColor } from '@/lib/niche-colors';

interface ScoreDetails {
  niche: number;
  skills: number;
  experience: number;
  years: number;
  languages: number;
  commission: number;
  availability: number;
  location: number;
  reputation: number;
  performance: number;
  loom: number;
  training: number;
  reviews: number;
  revenue: number;
  total: number;
}

interface CandidateInfo {
  full_name: string;
  avatar_url: string | null;
  email: string;
  niches: string[];
  skills: string[];
  years_experience: number | null;
  languages: string[];
  loom_url: string | null;
  training_center: string | null;
  is_employed: boolean;
  profile?: {
    experience_level: string | null;
    commission_rate: number | null;
    availability: boolean;
    available_hours_per_week: number | null;
    score: number;
    badge_level: string;
    total_deals_closed: number;
    total_revenue_generated: number;
    total_reviews: number;
  };
}

interface Result {
  id: string;
  score: number;
  score_details: ScoreDetails;
  status: string;
  candidate_id: string;
  candidate: CandidateInfo;
}

interface Fiche {
  id: string;
  title: string;
  niche: string | null;
  offer_type: string | null;
  status: string;
  created_at: string;
}

const SKILL_LABELS: Record<string, string> = {
  closing: 'Closing', setting: 'Setting', management: 'Management',
  hos: 'HOS', coaching: 'Coaching', training: 'Formation',
};

const EXP_LABELS: Record<string, string> = {
  junior: 'Junior', intermediaire: 'Intermédiaire', senior: 'Senior', expert: 'Expert',
};

const BADGE_CONFIG: Record<string, { icon: string; color: string }> = {
  bronze: { icon: '🥉', color: 'text-amber-700' },
  silver: { icon: '🥈', color: 'text-gray-500' },
  gold: { icon: '🥇', color: 'text-yellow-600' },
  platinum: { icon: '💎', color: 'text-blue-600' },
  diamond: { icon: '💎', color: 'text-purple-600' },
};

const SCORE_CRITERIA = [
  { key: 'niche', label: 'Niche', max: 15, icon: Target },
  { key: 'skills', label: 'Compétences', max: 15, icon: Briefcase },
  { key: 'experience', label: 'Expérience', max: 10, icon: Award },
  { key: 'languages', label: 'Langues', max: 10, icon: Globe2 },
  { key: 'availability', label: 'Disponibilité', max: 10, icon: Clock },
  { key: 'reputation', label: 'Réputation', max: 8, icon: Star },
  { key: 'performance', label: 'Performance', max: 7, icon: TrendingUp },
  { key: 'years', label: 'Années', max: 5, icon: Award },
  { key: 'commission', label: 'Commission', max: 5, icon: Award },
  { key: 'location', label: 'Localisation', max: 5, icon: Target },
  { key: 'loom', label: 'Vidéo', max: 3, icon: Video },
  { key: 'training', label: 'Formation', max: 3, icon: GraduationCap },
  { key: 'reviews', label: 'Avis', max: 2, icon: Star },
  { key: 'revenue', label: 'CA', max: 2, icon: TrendingUp },
];

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-500';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-400';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Match parfait';
  if (score >= 75) return 'Excellent match';
  if (score >= 60) return 'Bon match';
  if (score >= 40) return 'Match moyen';
  return 'Match faible';
}

export function MatchingResults({ fiche, results: initialResults }: { fiche: Fiche; results: Result[] }) {
  const router = useRouter();
  const [results, setResults] = useState<Result[]>(initialResults);
  const [filter, setFilter] = useState<'all' | 'liked' | 'passed' | 'contacted'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredResults = filter === 'all'
    ? results
    : results.filter(r => r.status === filter);

  const likedCount = results.filter(r => r.status === 'liked').length;
  const contactedCount = results.filter(r => r.status === 'contacted').length;

  async function updateStatus(resultId: string, status: string) {
    setUpdatingId(resultId);
    try {
      await fetch(`/api/matching/results/${resultId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setResults(prev => prev.map(r =>
        r.id === resultId ? { ...r, status } : r
      ));
    } catch {
      console.error('Erreur mise à jour');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetch('/api/matching/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiche_id: fiche.id }),
      });
      router.refresh();
    } catch {
      console.error('Erreur refresh');
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/matching')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux fiches
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-brand-amber" />
              {fiche.title}
            </h1>
            <p className="text-gray-500 mt-1">
              {results.length} candidat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
              {likedCount > 0 && ` · ${likedCount} liké${likedCount > 1 ? 's' : ''}`}
              {contactedCount > 0 && ` · ${contactedCount} contacté${contactedCount > 1 ? 's' : ''}`}
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Recalculer
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-4 w-4 text-gray-400" />
        {(['all', 'liked', 'contacted', 'passed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-brand-amber text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' && `Tous (${results.length})`}
            {f === 'liked' && `Likés (${likedCount})`}
            {f === 'contacted' && `Contactés (${contactedCount})`}
            {f === 'passed' && `Passés (${results.filter(r => r.status === 'passed').length})`}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filteredResults.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Users className="h-12 w-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900 mt-4">
            {filter === 'all' ? 'Aucun candidat trouvé' : `Aucun candidat ${filter}`}
          </h3>
          <p className="text-gray-500 mt-2">
            {filter === 'all'
              ? 'Essayez de modifier vos critères de recherche pour élargir les résultats.'
              : 'Modifiez le filtre pour voir les autres candidats.'}
          </p>
        </div>
      )}

      {/* Results list */}
      <div className="space-y-4">
        {filteredResults.map((result, index) => {
          const candidate = result.candidate;
          const profile = candidate.profile;
          const isExpanded = expandedId === result.id;
          const badge = profile?.badge_level ? BADGE_CONFIG[profile.badge_level] : null;

          return (
            <div
              key={result.id}
              className={`bg-white rounded-xl border transition-all ${
                result.status === 'liked' ? 'border-pink-200 shadow-sm' :
                result.status === 'contacted' ? 'border-emerald-200 shadow-sm' :
                result.status === 'passed' ? 'border-gray-100 opacity-60' :
                'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Main card */}
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 text-center">
                    <div className={`text-2xl font-bold ${index < 3 ? 'text-brand-amber' : 'text-gray-300'}`}>
                      #{index + 1}
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {candidate.avatar_url ? (
                      <img
                        src={candidate.avatar_url}
                        alt={candidate.full_name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-brand-amber/10 flex items-center justify-center text-brand-amber font-bold text-lg">
                        {candidate.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {candidate.full_name}
                      </h3>
                      {badge && (
                        <span className={`text-sm ${badge.color}`}>{badge.icon}</span>
                      )}
                      {result.status === 'liked' && (
                        <span className="px-2 py-0.5 bg-pink-100 text-pink-600 text-xs rounded-full font-medium">
                          Liké
                        </span>
                      )}
                      {result.status === 'contacted' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-xs rounded-full font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Contacté
                        </span>
                      )}
                      {result.status === 'passed' && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">
                          Passé
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {candidate.skills.slice(0, 4).map(skill => (
                        <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {SKILL_LABELS[skill] || skill}
                        </span>
                      ))}
                      {profile?.experience_level && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                          {EXP_LABELS[profile.experience_level] || profile.experience_level}
                        </span>
                      )}
                      {candidate.years_experience != null && candidate.years_experience > 0 && (
                        <span className="text-xs text-gray-500">
                          {candidate.years_experience} an{candidate.years_experience > 1 ? 's' : ''} d&apos;exp.
                        </span>
                      )}
                      {candidate.loom_url && (
                        <span className="text-xs text-purple-500 flex items-center gap-0.5">
                          <Video className="h-3 w-3" />
                          Loom
                        </span>
                      )}
                    </div>

                    {/* Niches */}
                    {candidate.niches.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {candidate.niches.slice(0, 3).map(niche => {
                          const nc = getNicheColor(niche);
                          return (
                            <span key={niche} className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${nc.bg} ${nc.text} ${nc.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${nc.dot}`} />
                              {niche}
                            </span>
                          );
                        })}
                        {candidate.niches.length > 3 && (
                          <span className="text-xs text-gray-400">+{candidate.niches.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-center mr-2">
                    <div className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                      {Math.round(result.score)}%
                    </div>
                    <p className={`text-xs font-medium ${getScoreColor(result.score)}`}>
                      {getScoreLabel(result.score)}
                    </p>
                    {/* Score bar */}
                    <div className="w-20 h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getScoreBgColor(result.score)}`}
                        style={{ width: `${Math.min(100, result.score)}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex flex-col gap-2">
                    <button
                      onClick={() => updateStatus(result.id, result.status === 'liked' ? 'pending' : 'liked')}
                      disabled={updatingId === result.id}
                      className={`p-2.5 rounded-full transition-colors ${
                        result.status === 'liked'
                          ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-pink-50 hover:text-pink-500'
                      }`}
                      title={result.status === 'liked' ? 'Retirer le like' : 'Liker'}
                    >
                      <Heart className={`h-5 w-5 ${result.status === 'liked' ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => updateStatus(result.id, result.status === 'passed' ? 'pending' : 'passed')}
                      disabled={updatingId === result.id}
                      className={`p-2.5 rounded-full transition-colors ${
                        result.status === 'passed'
                          ? 'bg-gray-200 text-gray-600'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                      }`}
                      title={result.status === 'passed' ? 'Reconsidérer' : 'Passer'}
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        updateStatus(result.id, 'contacted');
                        router.push('/dashboard/messages');
                      }}
                      disabled={updatingId === result.id}
                      className="p-2.5 rounded-full bg-gray-100 text-gray-400 hover:bg-emerald-50 hover:text-emerald-500 transition-colors"
                      title="Contacter"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Expand button */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : result.id)}
                  className="mt-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {isExpanded ? 'Masquer le détail' : 'Voir le détail du score'}
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Détail du score de matching</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {SCORE_CRITERIA.map(criteria => {
                      const value = (result.score_details as unknown as Record<string, number>)[criteria.key] || 0;
                      const pct = (value / criteria.max) * 100;
                      const Icon = criteria.icon;

                      return (
                        <div key={criteria.key} className="bg-white rounded-lg p-3 border border-gray-100">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Icon className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-xs text-gray-500">{criteria.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  pct >= 80 ? 'bg-emerald-500' :
                                  pct >= 50 ? 'bg-blue-500' :
                                  pct >= 25 ? 'bg-amber-500' :
                                  'bg-red-400'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700">
                              {Math.round(value * 10) / 10}/{criteria.max}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick info */}
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {profile?.total_deals_closed != null && profile.total_deals_closed > 0 && (
                      <div>
                        <span className="text-gray-500">Deals closés:</span>{' '}
                        <span className="font-medium">{profile.total_deals_closed}</span>
                      </div>
                    )}
                    {profile?.total_revenue_generated != null && profile.total_revenue_generated > 0 && (
                      <div>
                        <span className="text-gray-500">CA généré:</span>{' '}
                        <span className="font-medium">{profile.total_revenue_generated.toLocaleString('fr-FR')}€</span>
                      </div>
                    )}
                    {profile?.commission_rate != null && (
                      <div>
                        <span className="text-gray-500">Commission:</span>{' '}
                        <span className="font-medium">{profile.commission_rate}%</span>
                      </div>
                    )}
                    {profile?.score != null && profile.score > 0 && (
                      <div>
                        <span className="text-gray-500">Score réputation:</span>{' '}
                        <span className="font-medium">{profile.score}/100</span>
                      </div>
                    )}
                    {candidate.training_center && candidate.training_center !== 'Aucune formation' && (
                      <div>
                        <span className="text-gray-500">Formation:</span>{' '}
                        <span className="font-medium">{candidate.training_center}</span>
                      </div>
                    )}
                    {candidate.languages.length > 0 && (
                      <div>
                        <span className="text-gray-500">Langues:</span>{' '}
                        <span className="font-medium">{candidate.languages.join(', ')}</span>
                      </div>
                    )}
                    {profile?.availability && (
                      <div>
                        <span className="text-gray-500">Dispo:</span>{' '}
                        <span className="font-medium text-emerald-600">
                          Disponible{profile.available_hours_per_week ? ` (${profile.available_hours_per_week}h/sem)` : ''}
                        </span>
                      </div>
                    )}
                    {profile?.total_reviews != null && profile.total_reviews > 0 && (
                      <div>
                        <span className="text-gray-500">Avis:</span>{' '}
                        <span className="font-medium">{profile.total_reviews} avis</span>
                      </div>
                    )}
                  </div>

                  {/* Loom + Profile link */}
                  <div className="flex items-center gap-4 mt-4">
                    {candidate.loom_url && (
                      <a
                        href={candidate.loom_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        <Video className="h-4 w-4" />
                        Voir la vidéo Loom
                      </a>
                    )}
                    <a
                      href={`/dashboard/cvtheque/${result.candidate_id}`}
                      className="flex items-center gap-1.5 text-sm text-brand-amber hover:text-brand-amber/80 font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      Voir le profil complet
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
