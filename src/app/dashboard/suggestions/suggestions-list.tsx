'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Heart, X, Eye, RefreshCw, Loader2,
  Target, Briefcase, Award, Globe2, TrendingUp,
  Video, GraduationCap, Clock, Star, Filter,
  ChevronDown, ChevronUp, MapPin, Building2,
} from 'lucide-react';

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

interface FicheInfo {
  id: string;
  title: string;
  niche: string | null;
  offer_type: string | null;
  description: string | null;
  location: string | null;
}

interface RecruiterInfo {
  full_name: string;
  avatar_url: string | null;
  company_name: string | null;
}

interface Suggestion {
  id: string;
  score: number;
  score_details: ScoreDetails;
  candidate_status: string;
  created_at: string;
  fiche: FicheInfo;
  recruiter: RecruiterInfo;
}

const OFFER_TYPE_LABELS: Record<string, string> = {
  challenge: 'Challenge',
  recurring: 'Récurrent',
  mission: 'Mission',
  full_time: 'CDI',
  part_time: 'Temps partiel',
  commission_only: 'Commission',
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
  { key: 'location', label: 'Localisation', max: 5, icon: MapPin },
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

export function SuggestionsList() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'interested' | 'passed'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  async function fetchSuggestions() {
    try {
      const res = await fetch('/api/matching/suggestions');
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch {
      console.error('Erreur chargement suggestions');
    } finally {
      setLoading(false);
    }
  }

  async function handleCompute() {
    setComputing(true);
    try {
      await fetch('/api/matching/suggestions', {
        method: 'POST',
      });
      await fetchSuggestions();
    } catch {
      console.error('Erreur calcul suggestions');
    } finally {
      setComputing(false);
    }
  }

  async function updateStatus(resultId: string, candidateStatus: string) {
    setUpdatingId(resultId);
    try {
      await fetch(`/api/matching/suggestions/${resultId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_status: candidateStatus }),
      });
      setSuggestions(prev => prev.map(s =>
        s.id === resultId ? { ...s, candidate_status: candidateStatus } : s
      ));
    } catch {
      console.error('Erreur mise à jour statut');
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredSuggestions = filter === 'all'
    ? suggestions.filter(s => s.candidate_status !== 'passed')
    : suggestions.filter(s => s.candidate_status === filter);

  const interestedCount = suggestions.filter(s => s.candidate_status === 'interested').length;
  const passedCount = suggestions.filter(s => s.candidate_status === 'passed').length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand-amber" />
            Suggestions IA
          </h1>
          <p className="text-gray-500 mt-1">
            Les opportunités qui correspondent le mieux à votre profil
          </p>
        </div>
        <button
          onClick={handleCompute}
          disabled={computing}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-amber text-white rounded-lg font-medium hover:bg-brand-amber/90 transition-colors disabled:opacity-50"
        >
          {computing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {computing ? 'Analyse en cours...' : 'Actualiser'}
        </button>
      </div>

      {/* Filters */}
      {suggestions.length > 0 && (
        <div className="flex items-center gap-2 mb-6">
          <Filter className="h-4 w-4 text-gray-400" />
          {(['all', 'interested', 'passed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-brand-amber text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' && `Nouvelles (${suggestions.filter(s => s.candidate_status !== 'passed').length})`}
              {f === 'interested' && `Intéressé (${interestedCount})`}
              {f === 'passed' && `Passées (${passedCount})`}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <div className="animate-spin h-8 w-8 border-2 border-brand-amber border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-3">Chargement...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && suggestions.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Sparkles className="h-12 w-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900 mt-4">Aucune suggestion pour le moment</h3>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            Cliquez sur &quot;Actualiser&quot; pour lancer l&apos;analyse IA de votre profil
            et découvrir les opportunités qui vous correspondent.
          </p>
          <button
            onClick={handleCompute}
            disabled={computing}
            className="mt-6 px-6 py-2.5 bg-brand-amber text-white rounded-lg font-medium hover:bg-brand-amber/90 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
          >
            {computing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {computing ? 'Analyse en cours...' : 'Lancer l\'analyse'}
          </button>
        </div>
      )}

      {/* Filtered empty */}
      {!loading && suggestions.length > 0 && filteredSuggestions.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">
            {filter === 'interested' ? 'Aucune opportunité marquée comme intéressante.' : 'Aucune opportunité passée.'}
          </p>
        </div>
      )}

      {/* Suggestions list */}
      <div className="space-y-4">
        {filteredSuggestions.map((suggestion, index) => {
          const isExpanded = expandedId === suggestion.id;

          return (
            <div
              key={suggestion.id}
              className={`bg-white rounded-xl border transition-all ${
                suggestion.candidate_status === 'interested'
                  ? 'border-pink-200 shadow-sm'
                  : suggestion.candidate_status === 'passed'
                  ? 'border-gray-100 opacity-60'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 text-center">
                    <div className={`text-2xl font-bold ${index < 3 ? 'text-brand-amber' : 'text-gray-300'}`}>
                      #{index + 1}
                    </div>
                  </div>

                  {/* Recruiter avatar */}
                  <div className="flex-shrink-0">
                    {suggestion.recruiter.avatar_url ? (
                      <img
                        src={suggestion.recruiter.avatar_url}
                        alt={suggestion.recruiter.full_name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
                        <Building2 className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {suggestion.fiche.title}
                      </h3>
                      {suggestion.candidate_status === 'interested' && (
                        <span className="px-2 py-0.5 bg-pink-100 text-pink-600 text-xs rounded-full font-medium flex items-center gap-1">
                          <Heart className="h-3 w-3 fill-current" />
                          Intéressé
                        </span>
                      )}
                    </div>

                    {/* Recruiter + meta */}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
                      <span className="flex items-center gap-1 font-medium text-gray-700">
                        <Building2 className="h-3.5 w-3.5" />
                        {suggestion.recruiter.company_name || suggestion.recruiter.full_name}
                      </span>
                      {suggestion.fiche.niche && (
                        <span className="flex items-center gap-1">
                          <Target className="h-3.5 w-3.5" />
                          {suggestion.fiche.niche}
                        </span>
                      )}
                      {suggestion.fiche.offer_type && (
                        <span className="px-2 py-0.5 bg-brand-amber/10 text-brand-amber text-xs rounded-full font-medium">
                          {OFFER_TYPE_LABELS[suggestion.fiche.offer_type] || suggestion.fiche.offer_type}
                        </span>
                      )}
                      {suggestion.fiche.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {suggestion.fiche.location}
                        </span>
                      )}
                    </div>

                    {/* Description preview */}
                    {suggestion.fiche.description && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {suggestion.fiche.description}
                      </p>
                    )}
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-center mr-2">
                    <div className={`text-3xl font-bold ${getScoreColor(suggestion.score)}`}>
                      {Math.round(suggestion.score)}%
                    </div>
                    <p className={`text-xs font-medium ${getScoreColor(suggestion.score)}`}>
                      {getScoreLabel(suggestion.score)}
                    </p>
                    <div className="w-20 h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getScoreBgColor(suggestion.score)}`}
                        style={{ width: `${Math.min(100, suggestion.score)}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex flex-col gap-2">
                    <button
                      onClick={() => updateStatus(
                        suggestion.id,
                        suggestion.candidate_status === 'interested' ? 'unseen' : 'interested'
                      )}
                      disabled={updatingId === suggestion.id}
                      className={`p-2.5 rounded-full transition-colors ${
                        suggestion.candidate_status === 'interested'
                          ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-pink-50 hover:text-pink-500'
                      }`}
                      title={suggestion.candidate_status === 'interested' ? 'Retirer' : 'Intéressé(e)'}
                    >
                      <Heart className={`h-5 w-5 ${suggestion.candidate_status === 'interested' ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => updateStatus(
                        suggestion.id,
                        suggestion.candidate_status === 'passed' ? 'unseen' : 'passed'
                      )}
                      disabled={updatingId === suggestion.id}
                      className={`p-2.5 rounded-full transition-colors ${
                        suggestion.candidate_status === 'passed'
                          ? 'bg-gray-200 text-gray-600'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                      }`}
                      title={suggestion.candidate_status === 'passed' ? 'Reconsidérer' : 'Passer'}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Expand */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : suggestion.id)}
                  className="mt-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {isExpanded ? 'Masquer le détail' : 'Voir pourquoi ce match'}
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Expanded score breakdown */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Détail de la compatibilité avec votre profil
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {SCORE_CRITERIA.map(criteria => {
                      const value = (suggestion.score_details as Record<string, number>)[criteria.key] || 0;
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

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                    <p>
                      <strong>Conseil :</strong> Complétez votre profil dans les Paramètres pour améliorer vos scores de matching.
                      Ajoutez vos compétences, langues, expérience et vidéo Loom pour maximiser vos chances.
                    </p>
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
