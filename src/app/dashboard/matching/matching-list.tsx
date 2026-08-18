'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Sparkles, Calendar, Users, TrendingUp,
  Archive, MoreVertical, Search,
} from 'lucide-react';

interface Fiche {
  id: string;
  title: string;
  niche: string | null;
  offer_type: string | null;
  status: string;
  created_at: string;
  results_count: number;
  top_score: number;
}

const OFFER_TYPE_LABELS: Record<string, string> = {
  challenge: 'Challenge',
  recurring: 'Récurrent',
  mission: 'Mission',
  full_time: 'CDI',
  part_time: 'Temps partiel',
  commission_only: 'Commission',
};

export function MatchingList() {
  const router = useRouter();
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchFiches();
  }, []);

  async function fetchFiches() {
    try {
      const res = await fetch('/api/matching/fiches');
      const data = await res.json();
      setFiches(data.fiches || []);
    } catch {
      console.error('Erreur chargement fiches');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function getScoreColor(score: number) {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-gray-500';
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand-amber" />
            Matching IA
          </h1>
          <p className="text-gray-500 mt-1">
            Créez une fiche de poste et trouvez les meilleurs profils automatiquement
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/matching/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-amber text-white rounded-lg font-medium hover:bg-brand-amber/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle fiche
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <div className="animate-spin h-8 w-8 border-2 border-brand-amber border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-3">Chargement...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && fiches.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Sparkles className="h-12 w-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900 mt-4">Aucune fiche de poste</h3>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            Créez votre première fiche de poste pour découvrir les candidats qui correspondent
            le mieux à vos besoins grâce à notre algorithme de matching IA.
          </p>
          <button
            onClick={() => router.push('/dashboard/matching/new')}
            className="mt-6 px-6 py-2.5 bg-brand-amber text-white rounded-lg font-medium hover:bg-brand-amber/90 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Créer une fiche de poste
          </button>
        </div>
      )}

      {/* List */}
      {!loading && fiches.length > 0 && (
        <div className="space-y-4">
          {fiches.map(fiche => (
            <div
              key={fiche.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-amber/30 hover:shadow-sm transition-all cursor-pointer relative group"
              onClick={() => router.push(`/dashboard/matching/${fiche.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {fiche.title}
                    </h3>
                    {fiche.status === 'archived' && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full flex items-center gap-1">
                        <Archive className="h-3 w-3" />
                        Archivée
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {fiche.niche && (
                      <span className="flex items-center gap-1">
                        <Search className="h-3.5 w-3.5" />
                        {fiche.niche}
                      </span>
                    )}
                    {fiche.offer_type && (
                      <span className="px-2 py-0.5 bg-brand-amber/10 text-brand-amber text-xs rounded-full font-medium">
                        {OFFER_TYPE_LABELS[fiche.offer_type] || fiche.offer_type}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(fiche.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 ml-4">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-gray-900 font-semibold">
                      <Users className="h-4 w-4 text-gray-400" />
                      {fiche.results_count}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">matchs</p>
                  </div>

                  <div className="text-center">
                    <div className={`font-bold text-lg ${getScoreColor(fiche.top_score)}`}>
                      {fiche.top_score > 0 ? `${Math.round(fiche.top_score)}%` : '—'}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">top score</p>
                  </div>

                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === fiche.id ? null : fiche.id);
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>
                    {menuOpen === fiche.id && (
                      <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 w-48">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/matching/${fiche.id}`);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <TrendingUp className="h-4 w-4" />
                          Voir les résultats
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Relancer le matching
                            fetch('/api/matching/compute', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ fiche_id: fiche.id }),
                            }).then(() => {
                              fetchFiches();
                              setMenuOpen(null);
                            });
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Sparkles className="h-4 w-4" />
                          Relancer le matching
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
