'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui';
import {
  ArrowLeft, Users, User, Search, ChevronRight,
  ClipboardList, Loader2, FileText, ChevronDown,
  ArrowUpDown, ArrowUp, ArrowDown, ExternalLink,
} from 'lucide-react';
import type { Offer, ApplicationStatus } from '@/types/database';
import { APPLICATION_STATUS_CONFIG } from '@/types/database';

// ============================================================
// Config statuts
// ============================================================

const STATUS_LIST: { status: ApplicationStatus; label: string; emoji: string }[] = [
  { status: 'pending', label: 'En attente', emoji: '🕐' },
  { status: 'reviewing', label: 'À étudier', emoji: '🔍' },
  { status: 'accepted', label: 'Profil validé', emoji: '✅' },
  { status: 'rejected', label: 'Non retenu', emoji: '❌' },
];

// ============================================================
// Types
// ============================================================

interface CandidateRow {
  id: string;
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

type SortField = 'name' | 'created_at' | 'status';
type SortDir = 'asc' | 'desc';

export default function CandidatesOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // ============================================================
  // Chargement données
  // ============================================================

  const loadData = useCallback(async () => {
    setLoading(true);

    const { data: offerData } = await supabase
      .from('offers')
      .select('*')
      .eq('id', offerId)
      .single();

    if (!offerData) { setLoading(false); return; }
    setOffer(offerData as Offer);

    const { data: appData } = await supabase
      .from('applications')
      .select('*, closer:users!applications_closer_id_fkey(full_name, email, avatar_url, skills)')
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false });

    const appIds = (appData || []).map((a: Record<string, unknown>) => a.id as string);
    let responseAppIds = new Set<string>();

    if (appIds.length > 0 && offerData.questionnaire_id) {
      const { data: respData } = await supabase
        .from('questionnaire_responses')
        .select('application_id')
        .in('application_id', appIds);
      responseAppIds = new Set((respData || []).map((r: Record<string, unknown>) => r.application_id as string));
    }

    const rows: CandidateRow[] = (appData || []).map((app: Record<string, unknown>) => {
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

    setCandidates(rows);
    setLoading(false);
  }, [offerId, supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  // ============================================================
  // Changement de statut
  // ============================================================

  const changeStatus = async (applicationId: string, newStatus: ApplicationStatus) => {
    setStatusLoading(applicationId);
    setOpenDropdown(null);
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

  // ============================================================
  // Tri
  // ============================================================

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const statusOrder: ApplicationStatus[] = ['pending', 'reviewing', 'accepted', 'rejected', 'withdrawn'];

  const sortedAndFiltered = candidates
    .filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.skills.some(s => s.toLowerCase().includes(q));
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'created_at') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortField === 'status') cmp = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  // Fermer dropdown au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) setOpenDropdown(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ============================================================
  // Compteurs par statut
  // ============================================================

  const countByStatus = (s: ApplicationStatus) => candidates.filter(c => c.status === s).length;

  // ============================================================
  // Render helpers
  // ============================================================

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-gray-300" />;
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 text-brand-dark" />
      : <ArrowDown className="h-3 w-3 text-brand-dark" />;
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Chargement des candidatures...</div>;
  }

  if (!offer) {
    return <div className="text-center py-12"><p className="text-gray-500">Offre introuvable</p></div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <a href="/dashboard/offers" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-dark transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour aux offres
        </a>
        <h1 className="text-2xl font-bold text-brand-dark mt-2">Candidatures — {offer.title}</h1>
        <p className="text-gray-500 mt-1">{candidates.length} candidature{candidates.length !== 1 ? 's' : ''} au total</p>
      </div>

      {/* Stats badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_LIST.map(s => (
          <button
            key={s.status}
            onClick={() => setStatusFilter(statusFilter === s.status ? 'all' : s.status)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              statusFilter === s.status
                ? `${APPLICATION_STATUS_CONFIG[s.status].bgColor} ${APPLICATION_STATUS_CONFIG[s.status].color} border-current`
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            <span>{s.emoji}</span>
            {s.label}
            <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs ${
              statusFilter === s.status ? 'bg-white/60' : 'bg-gray-100'
            }`}>
              {countByStatus(s.status)}
            </span>
          </button>
        ))}
        {statusFilter !== 'all' && (
          <button
            onClick={() => setStatusFilter('all')}
            className="text-xs text-gray-400 hover:text-gray-600 underline ml-1"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Barre de recherche + liens */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou compétence..."
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
            <FileText className="h-4 w-4" /> Réponses
          </a>
        )}
      </div>

      {/* ============================================================ */}
      {/* TABLE AIRTABLE-STYLE                                         */}
      {/* ============================================================ */}

      {candidates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucune candidature pour le moment</p>
            <p className="text-sm text-gray-400 mt-1">Les candidatures apparaîtront ici au fur et à mesure.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {/* Header */}
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="text-left font-medium text-gray-500 px-4 py-3 whitespace-nowrap">
                    <button onClick={() => handleSort('name')} className="inline-flex items-center gap-1.5 hover:text-brand-dark transition-colors">
                      Candidat <SortIcon field="name" />
                    </button>
                  </th>
                  <th className="text-left font-medium text-gray-500 px-4 py-3 whitespace-nowrap hidden md:table-cell">
                    Compétences
                  </th>
                  <th className="text-left font-medium text-gray-500 px-4 py-3 whitespace-nowrap">
                    <button onClick={() => handleSort('status')} className="inline-flex items-center gap-1.5 hover:text-brand-dark transition-colors">
                      Statut <SortIcon field="status" />
                    </button>
                  </th>
                  <th className="text-left font-medium text-gray-500 px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                    Questionnaire
                  </th>
                  <th className="text-left font-medium text-gray-500 px-4 py-3 whitespace-nowrap">
                    <button onClick={() => handleSort('created_at')} className="inline-flex items-center gap-1.5 hover:text-brand-dark transition-colors">
                      Date <SortIcon field="created_at" />
                    </button>
                  </th>
                  <th className="text-right font-medium text-gray-500 px-4 py-3 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {sortedAndFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      Aucun résultat pour cette recherche.
                    </td>
                  </tr>
                ) : (
                  sortedAndFiltered.map((c, idx) => {
                    const statusConf = APPLICATION_STATUS_CONFIG[c.status];
                    const isLast = idx === sortedAndFiltered.length - 1;

                    return (
                      <tr
                        key={c.id}
                        className={`group hover:bg-gray-50/60 transition-colors ${!isLast ? 'border-b border-gray-100' : ''}`}
                      >
                        {/* Candidat */}
                        <td className="px-4 py-3">
                          <a
                            href={`/dashboard/offers/${offerId}/candidates/${c.id}`}
                            className="flex items-center gap-3 group/link"
                          >
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                              {c.avatar_url ? (
                                <img src={c.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                              ) : (
                                <User className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-brand-dark truncate group-hover/link:text-brand-green transition-colors">
                                {c.name}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{c.email}</p>
                            </div>
                          </a>
                        </td>

                        {/* Compétences */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {c.skills.length > 0 ? (
                              c.skills.slice(0, 3).map(s => (
                                <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize whitespace-nowrap">
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                            {c.skills.length > 3 && (
                              <span className="text-xs text-gray-400">+{c.skills.length - 3}</span>
                            )}
                          </div>
                        </td>

                        {/* Statut — dropdown */}
                        <td className="px-4 py-3">
                          <div className="relative" data-dropdown>
                            <button
                              onClick={() => setOpenDropdown(openDropdown === c.id ? null : c.id)}
                              disabled={statusLoading === c.id}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConf.bgColor} ${statusConf.color} hover:opacity-80 transition-opacity`}
                            >
                              {statusLoading === c.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  {statusConf.label}
                                  <ChevronDown className="h-3 w-3" />
                                </>
                              )}
                            </button>

                            {/* Dropdown statuts */}
                            {openDropdown === c.id && (
                              <div className="absolute z-20 top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]">
                                {STATUS_LIST.map(s => (
                                  <button
                                    key={s.status}
                                    onClick={() => changeStatus(c.id, s.status)}
                                    disabled={c.status === s.status}
                                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                                      c.status === s.status
                                        ? 'bg-gray-50 text-gray-400 cursor-default'
                                        : 'hover:bg-gray-50 text-gray-700'
                                    }`}
                                  >
                                    <span>{s.emoji}</span>
                                    <span className="font-medium">{s.label}</span>
                                    {c.status === s.status && (
                                      <span className="ml-auto text-xs text-gray-300">actuel</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Questionnaire */}
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {offer.questionnaire_id ? (
                            c.has_questionnaire_response ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                                <ClipboardList className="h-3.5 w-3.5" /> Rempli
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">En attente</span>
                            )
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs text-gray-500">
                            {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <a
                            href={`/dashboard/offers/${offerId}/candidates/${c.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-green hover:text-brand-green/80 transition-colors"
                          >
                            Voir <ChevronRight className="h-3.5 w-3.5" />
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer compteur */}
          <div className="px-4 py-2.5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {sortedAndFiltered.length} résultat{sortedAndFiltered.length !== 1 ? 's' : ''}
              {statusFilter !== 'all' && ` · Filtre : ${APPLICATION_STATUS_CONFIG[statusFilter].label}`}
              {searchTerm && ` · Recherche : "${searchTerm}"`}
            </span>
            <span className="text-xs text-gray-400">
              Tri : {sortField === 'name' ? 'nom' : sortField === 'created_at' ? 'date' : 'statut'} ({sortDir === 'asc' ? '↑' : '↓'})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
