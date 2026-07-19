'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Button } from '@/components/ui';
import {
  ArrowLeft, Users, User, Clock, Eye, Search,
  ChevronRight, ClipboardList, Loader2, FileText,
} from 'lucide-react';
import type { Offer, ApplicationStatus } from '@/types/database';

// ============================================================
// Config des colonnes pipeline
// ============================================================

interface PipelineColumn {
  status: ApplicationStatus;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

const PIPELINE_COLUMNS: PipelineColumn[] = [
  { status: 'pending', label: 'En attente', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', icon: '🕐' },
  { status: 'reviewing', label: 'À étudier', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: '🔍' },
  { status: 'accepted', label: 'Profil validé', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200', icon: '✅' },
  { status: 'rejected', label: 'Non retenu', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: '❌' },
];

interface CandidateCard {
  id: string; // application id
  closer_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  status: ApplicationStatus;
  cover_letter: string | null;
  created_at: string;
  skills: string[];
  has_questionnaire_response: boolean;
}

export default function CandidatesOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [candidates, setCandidates] = useState<CandidateCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);

    // Offre
    const { data: offerData } = await supabase
      .from('offers')
      .select('*')
      .eq('id', offerId)
      .single();

    if (!offerData) { setLoading(false); return; }
    setOffer(offerData as Offer);

    // Candidatures avec infos user
    const { data: appData } = await supabase
      .from('applications')
      .select('*, closer:users!applications_closer_id_fkey(full_name, email, avatar_url, skills)')
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false });

    // Vérifier quelles candidatures ont des réponses au questionnaire
    const appIds = (appData || []).map((a: Record<string, unknown>) => a.id as string);
    let responseAppIds = new Set<string>();

    if (appIds.length > 0 && offerData.questionnaire_id) {
      const { data: respData } = await supabase
        .from('questionnaire_responses')
        .select('application_id')
        .in('application_id', appIds);
      responseAppIds = new Set((respData || []).map((r: Record<string, unknown>) => r.application_id as string));
    }

    const cards: CandidateCard[] = (appData || []).map((app: Record<string, unknown>) => {
      const closer = app.closer as { full_name: string | null; email: string; avatar_url: string | null; skills: string[] } | null;
      return {
        id: app.id as string,
        closer_id: app.closer_id as string,
        name: closer?.full_name || 'Anonyme',
        email: closer?.email || '',
        avatar_url: closer?.avatar_url || null,
        status: app.status as ApplicationStatus,
        cover_letter: app.cover_letter as string | null,
        created_at: app.created_at as string,
        skills: closer?.skills || [],
        has_questionnaire_response: responseAppIds.has(app.id as string),
      };
    });

    setCandidates(cards);
    setLoading(false);
  }, [offerId, supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  // Changement rapide de statut
  const quickStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    setStatusLoading(applicationId);
    try {
      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCandidates(prev =>
          prev.map(c => c.id === applicationId ? { ...c, status: newStatus } : c)
        );
      }
    } catch { /* ignore */ }
    setStatusLoading(null);
  };

  // Filtrage
  const filtered = searchTerm
    ? candidates.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : candidates;

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Chargement des candidatures...</div>;
  }

  if (!offer) {
    return <div className="text-center py-12"><p className="text-gray-500">Offre introuvable</p></div>;
  }

  const countByStatus = (status: ApplicationStatus) => filtered.filter(c => c.status === status).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <a href={`/dashboard/offers`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-dark transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour aux offres
        </a>
        <h1 className="text-2xl font-bold text-brand-dark mt-2">Candidatures — {offer.title}</h1>
        <p className="text-gray-500 mt-1">{candidates.length} candidature{candidates.length !== 1 ? 's' : ''} au total</p>
      </div>

      {/* Barre de recherche + lien réponses */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un candidat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
          />
        </div>
        {offer.questionnaire_id && (
          <a
            href={`/dashboard/offers/${offerId}/responses`}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
          >
            <FileText className="h-4 w-4" /> Réponses questionnaire
          </a>
        )}
      </div>

      {/* Pipeline visuel — 4 colonnes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PIPELINE_COLUMNS.map((col) => {
          const colCandidates = filtered.filter(c => c.status === col.status);

          return (
            <div key={col.status} className="space-y-2">
              {/* Header colonne */}
              <div className={`${col.bgColor} ${col.borderColor} border rounded-lg p-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{col.icon}</span>
                  <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
                </div>
                <span className={`text-xs font-bold ${col.color} bg-white/60 px-2 py-0.5 rounded-full`}>
                  {countByStatus(col.status)}
                </span>
              </div>

              {/* Cards candidats */}
              <div className="space-y-2 min-h-[60px]">
                {colCandidates.length === 0 ? (
                  <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-400">Aucun candidat</p>
                  </div>
                ) : (
                  colCandidates.map((c) => (
                    <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        {/* Clic sur la fiche → page individuelle */}
                        <a
                          href={`/dashboard/offers/${offerId}/candidates/${c.id}`}
                          className="block"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-8 rounded-full bg-brand-dark/5 flex items-center justify-center shrink-0">
                              {c.avatar_url ? (
                                <img src={c.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                              ) : (
                                <User className="h-4 w-4 text-brand-dark/40" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-brand-dark truncate">{c.name}</p>
                              <p className="text-xs text-gray-400 truncate">{c.email}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                          </div>

                          {/* Skills tags */}
                          {c.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {c.skills.slice(0, 3).map((s: string) => (
                                <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">{s}</span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                            {c.has_questionnaire_response && (
                              <span className="flex items-center gap-1 text-green-600">
                                <ClipboardList className="h-3 w-3" /> Rempli
                              </span>
                            )}
                          </div>
                        </a>

                        {/* Actions rapides de statut */}
                        <div className="mt-2 pt-2 border-t border-gray-100 flex gap-1">
                          {PIPELINE_COLUMNS.filter(pc => pc.status !== c.status).slice(0, 2).map((action) => (
                            <button
                              key={action.status}
                              onClick={(e) => { e.preventDefault(); quickStatusChange(c.id, action.status); }}
                              disabled={statusLoading === c.id}
                              className={`flex-1 text-xs py-1 rounded ${action.bgColor} ${action.color} font-medium hover:opacity-80 transition-opacity disabled:opacity-50`}
                            >
                              {statusLoading === c.id ? (
                                <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                              ) : (
                                action.label
                              )}
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Si pas de candidats du tout */}
      {candidates.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucune candidature pour le moment</p>
            <p className="text-sm text-gray-400 mt-1">Les candidatures apparaîtront ici au fur et à mesure.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
