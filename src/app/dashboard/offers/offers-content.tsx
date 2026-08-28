'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui';
import {
  Briefcase, Plus, Eye, Users, Clock, Pause, CheckCircle, XCircle,
  Pencil, ExternalLink, ChevronDown, ChevronUp, ClipboardList, Download,
  User,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { QuestionnaireQuestion, QuestionnaireResponse } from '@/types/database';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface OfferData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  is_boosted?: boolean;
  is_premium?: boolean;
  views_count?: number;
  created_at: string;
  niche?: string | null;
  questionnaire_id?: string | null;
  _appCount: number;
}

interface CandidateRow {
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  status: string;
  createdAt: string;
  responses: Record<string, QuestionnaireResponse>;
}

interface QuestionnaireData {
  questions: QuestionnaireQuestion[];
  candidates: CandidateRow[];
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  paused: { label: 'En pause', color: 'bg-amber-100 text-amber-700' },
  closed: { label: 'Fermée', color: 'bg-gray-100 text-gray-600' },
};

const appStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700' },
  accepted: { label: 'Accepté', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Refusé', color: 'bg-red-100 text-red-700' },
  withdrawn: { label: 'Retiré', color: 'bg-gray-100 text-gray-600' },
  reviewing: { label: 'En cours', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Terminé', color: 'bg-purple-100 text-purple-700' },
};

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

interface Props {
  offers: OfferData[];
  canPost: boolean;
  activeCount: number;
  maxOffers: number; // -1 = illimité
  totalViews: number;
  totalApplications: number;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function OffersContent({
  offers, canPost, activeCount, maxOffers, totalViews, totalApplications,
}: Props) {
  const supabase = createClient();
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, QuestionnaireData>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const maxLabel = maxOffers === -1 ? '∞' : maxOffers;

  /* ---- Lazy-load questionnaire data ---- */
  const loadQuestionnaire = useCallback(async (offerId: string, questionnaireId: string) => {
    if (cache[offerId]) return;
    setLoadingId(offerId);

    const { data: qData } = await supabase
      .from('questionnaire_questions')
      .select('*')
      .eq('questionnaire_id', questionnaireId)
      .order('sort_order', { ascending: true });

    const { data: appData } = await supabase
      .from('applications')
      .select('*, closer:users!applications_closer_id_fkey(full_name, email)')
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false });

    const apps = (appData || []) as any[];
    const appIds = apps.map((a: any) => a.id);
    let allResp: QuestionnaireResponse[] = [];
    if (appIds.length > 0) {
      const { data: rData } = await supabase
        .from('questionnaire_responses')
        .select('*')
        .in('application_id', appIds);
      allResp = (rData || []) as QuestionnaireResponse[];
    }

    const candidates: CandidateRow[] = apps.map((app: any) => {
      const appResp = allResp.filter(r => r.application_id === app.id);
      const map: Record<string, QuestionnaireResponse> = {};
      appResp.forEach(r => { map[r.question_id] = r; });
      return {
        applicationId: app.id,
        candidateName: app.closer?.full_name || 'Anonyme',
        candidateEmail: app.closer?.email || '',
        status: app.status,
        createdAt: app.created_at,
        responses: map,
      };
    });

    setCache(prev => ({
      ...prev,
      [offerId]: { questions: (qData || []) as QuestionnaireQuestion[], candidates },
    }));
    setLoadingId(null);
  }, [supabase, cache]);

  const toggleOffer = async (offerId: string, questionnaireId: string | null | undefined) => {
    if (expandedOffer === offerId) {
      setExpandedOffer(null);
      setExpandedCandidate(null);
      return;
    }
    setExpandedOffer(offerId);
    setExpandedCandidate(null);
    if (questionnaireId) await loadQuestionnaire(offerId, questionnaireId);
  };

  /* ---- CSV export ---- */
  const exportCSV = (offerId: string, title: string) => {
    const data = cache[offerId];
    if (!data || data.candidates.length === 0) return;

    const headers = ['Candidat', 'Email', 'Statut', 'Date',
      ...data.questions.map(q => q.question_text)];
    const rows = data.candidates.map(c => [
      c.candidateName, c.candidateEmail, c.status,
      new Date(c.createdAt).toLocaleDateString('fr-FR'),
      ...data.questions.map(q => {
        const r = c.responses[q.id];
        if (!r) return '';
        if (q.question_type === 'mcq') return (r.answer_options || []).join(', ');
        return (r.answer_text || '').replace(/"/g, '""');
      }),
    ]);
    const csv = [headers.map(h => `"${h}"`).join(';'),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(';'))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reponses_${title.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Mes offres</h1>
          <p className="text-gray-500 mt-1">
            {activeCount}/{maxLabel} offre{activeCount !== 1 ? 's' : ''} active{activeCount !== 1 ? 's' : ''}
          </p>
        </div>
        {canPost ? (
          <a
            href="/dashboard/offers/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-amber text-white rounded-lg hover:bg-brand-amber/90 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Publier une offre
          </a>
        ) : (
          <div className="text-right">
            <span className="text-sm text-gray-500 block">Limite atteinte</span>
            <a href="/dashboard/subscription" className="text-xs text-brand-amber hover:underline">
              Passer au plan supérieur
            </a>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{offers.length}</p>
                <p className="text-xs text-gray-500">Total offres</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{totalViews}</p>
                <p className="text-xs text-gray-500">Vues totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{totalApplications}</p>
                <p className="text-xs text-gray-500">Candidatures reçues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des offres */}
      {offers.length > 0 ? (
        <div className="space-y-4">
          {offers.map((offer) => {
            const config = statusConfig[offer.status] || statusConfig.closed;
            const isExpanded = expandedOffer === offer.id;
            const hasQ = !!offer.questionnaire_id;
            const data = cache[offer.id];
            const isLoading = loadingId === offer.id;

            return (
              <Card key={offer.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* En-tête offre */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-brand-dark text-base truncate">{offer.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>
                            {config.label}
                          </span>
                          {offer.is_boosted && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-amber/10 text-brand-amber font-medium">
                              Boostée
                            </span>
                          )}
                          {offer.is_premium && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                              Premium
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-1">{offer.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true, locale: fr })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {offer.views_count || 0} vues
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {offer._appCount} candidature{offer._appCount !== 1 ? 's' : ''}
                          </span>
                          {offer.niche && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{offer.niche}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`/dashboard/offers/${offer.id}/candidates`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-dark bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <Users className="h-3.5 w-3.5" /> Gérer
                        </a>
                        <a
                          href={`/dashboard/offers/${offer.id}/edit`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Modifier
                        </a>
                        <a
                          href={`/dashboard/marketplace/${offer.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-white hover:bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Voir
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Bouton questionnaire (si l'offre en a un) */}
                  {hasQ && (
                    <button
                      onClick={() => toggleOffer(offer.id, offer.questionnaire_id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-amber-50/50 hover:bg-amber-50 transition-colors text-sm"
                    >
                      <span className="flex items-center gap-2 text-brand-dark font-medium">
                        <ClipboardList className="h-4 w-4 text-brand-amber" />
                        Questionnaire &amp; réponses
                      </span>
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-gray-400" />
                        : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </button>
                  )}

                  {/* Section questionnaire dépliée */}
                  {hasQ && isExpanded && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50/30 space-y-5">
                      {isLoading ? (
                        <p className="text-sm text-gray-400 text-center py-6">Chargement du questionnaire...</p>
                      ) : data ? (
                        <>
                          {/* Liste des questions */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              Questions ({data.questions.length})
                            </p>
                            <div className="space-y-2">
                              {data.questions.map((q, idx) => (
                                <div key={q.id} className="bg-white border border-gray-100 p-3 rounded-lg text-sm">
                                  <span className="font-semibold text-brand-dark">Q{idx + 1}.</span>{' '}
                                  <span className="text-gray-700">{q.question_text}</span>
                                  <span className="text-xs text-gray-400 ml-2">
                                    ({q.question_type === 'mcq' ? 'QCM' : q.question_type === 'yesno' ? 'Oui/Non' : 'Texte libre'})
                                  </span>
                                  {q.question_type === 'mcq' && q.options && (
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                      {(q.options as string[]).map((opt, i) => (
                                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{opt}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Réponses par candidat */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Réponses candidats ({data.candidates.filter(c => Object.keys(c.responses).length > 0).length}/{data.candidates.length})
                              </p>
                              {data.candidates.some(c => Object.keys(c.responses).length > 0) && (
                                <button
                                  onClick={() => exportCSV(offer.id, offer.title)}
                                  className="flex items-center gap-1.5 text-xs text-brand-amber hover:text-brand-amber/80 font-medium transition-colors"
                                >
                                  <Download className="h-3.5 w-3.5" /> Exporter CSV
                                </button>
                              )}
                            </div>

                            {data.candidates.length === 0 ? (
                              <p className="text-sm text-gray-400 italic py-2">Aucune candidature pour le moment.</p>
                            ) : (
                              <div className="space-y-2">
                                {data.candidates.map((c) => {
                                  const hasResp = Object.keys(c.responses).length > 0;
                                  const isCandExpanded = expandedCandidate === c.applicationId;
                                  const cStatus = appStatusConfig[c.status] || appStatusConfig.pending;

                                  return (
                                    <div key={c.applicationId} className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                                      <button
                                        onClick={() => setExpandedCandidate(isCandExpanded ? null : c.applicationId)}
                                        className="w-full text-left p-3 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className="h-8 w-8 rounded-full bg-brand-dark/5 flex items-center justify-center shrink-0">
                                            <User className="h-4 w-4 text-brand-dark/40" />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-sm font-medium text-brand-dark truncate">{c.candidateName}</p>
                                            <p className="text-xs text-gray-400">
                                              {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cStatus.color}`}>
                                            {cStatus.label}
                                          </span>
                                          {hasResp ? (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
                                              Répondu
                                            </span>
                                          ) : (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium">
                                              Non répondu
                                            </span>
                                          )}
                                          {isCandExpanded
                                            ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                                            : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
                                        </div>
                                      </button>

                                      {isCandExpanded && (
                                        <div className="border-t border-gray-100 p-3 space-y-2">
                                          {!hasResp ? (
                                            <p className="text-sm text-gray-400 italic">
                                              Ce candidat n&apos;a pas encore rempli le questionnaire.
                                            </p>
                                          ) : (
                                            data.questions.map((q, idx) => {
                                              const resp = c.responses[q.id];
                                              let displayAnswer = '— Non répondu';
                                              if (resp) {
                                                if (q.question_type === 'mcq') {
                                                  displayAnswer = (resp.answer_options || []).join(', ') || '— Aucune sélection';
                                                } else {
                                                  displayAnswer = resp.answer_text || '— Non répondu';
                                                }
                                              }
                                              const isYes = q.question_type === 'yesno' && resp?.answer_text === 'Oui';
                                              const isNo = q.question_type === 'yesno' && resp?.answer_text === 'Non';

                                              return (
                                                <div key={q.id} className="bg-gray-50 p-2.5 rounded-lg">
                                                  <p className="text-xs text-gray-500 mb-0.5">
                                                    <span className="font-medium">Q{idx + 1}.</span> {q.question_text}
                                                  </p>
                                                  <div className="flex items-start gap-1.5">
                                                    {isYes && <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />}
                                                    {isNo && <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />}
                                                    <p className={`text-sm font-medium ${
                                                      isYes ? 'text-green-700' : isNo ? 'text-red-700' : 'text-brand-dark'
                                                    }`}>
                                                      {displayAnswer}
                                                    </p>
                                                  </div>
                                                </div>
                                              );
                                            })
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucune offre publiée</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">
              Publiez votre première offre pour recevoir des candidatures.
            </p>
            {canPost && (
              <a
                href="/dashboard/offers/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-amber text-white rounded-lg hover:bg-brand-amber/90 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4" /> Publier une offre
              </a>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
