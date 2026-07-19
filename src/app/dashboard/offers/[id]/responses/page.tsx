'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Button } from '@/components/ui';
import {
  ArrowLeft, Download, ClipboardList, Users, Eye, Filter,
  ChevronDown, ChevronUp, User, Calendar, CheckCircle, XCircle,
} from 'lucide-react';
import type {
  Offer, Application, QuestionnaireQuestion, QuestionnaireResponse,
} from '@/types/database';

// ============================================================
// Types locaux
// ============================================================

interface CandidateRow {
  application: Application;
  candidateName: string;
  candidateEmail: string;
  responses: Record<string, QuestionnaireResponse>;
  submittedAt: string | null;
}

export default function ResponsesPage() {
  const params = useParams();
  const offerId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadData = useCallback(async () => {
    setLoading(true);

    // 1. Charger l'offre
    const { data: offerData } = await supabase
      .from('offers')
      .select('*')
      .eq('id', offerId)
      .single();

    if (!offerData) { setLoading(false); return; }
    setOffer(offerData as Offer);

    // 2. Charger les questions du questionnaire
    if (offerData.questionnaire_id) {
      const { data: qData } = await supabase
        .from('questionnaire_questions')
        .select('*')
        .eq('questionnaire_id', offerData.questionnaire_id)
        .order('sort_order', { ascending: true });
      setQuestions((qData || []) as QuestionnaireQuestion[]);
    }

    // 3. Charger les candidatures avec user info
    const { data: appData } = await supabase
      .from('applications')
      .select('*, closer:users!applications_closer_id_fkey(full_name, email)')
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false });

    const applications = (appData || []) as (Application & { closer: { full_name: string | null; email: string } })[];

    // 4. Charger toutes les réponses de ces candidatures
    const appIds = applications.map(a => a.id);
    let allResponses: QuestionnaireResponse[] = [];

    if (appIds.length > 0) {
      const { data: respData } = await supabase
        .from('questionnaire_responses')
        .select('*')
        .in('application_id', appIds);
      allResponses = (respData || []) as QuestionnaireResponse[];
    }

    // 5. Construire les lignes candidats
    const rows: CandidateRow[] = applications.map(app => {
      const appResponses = allResponses.filter(r => r.application_id === app.id);
      const responseMap: Record<string, QuestionnaireResponse> = {};
      appResponses.forEach(r => { responseMap[r.question_id] = r; });

      return {
        application: app,
        candidateName: app.closer?.full_name || 'Anonyme',
        candidateEmail: app.closer?.email || '',
        responses: responseMap,
        submittedAt: appResponses.length > 0 ? appResponses[0].created_at : null,
      };
    });

    setCandidates(rows);
    setLoading(false);
  }, [offerId, supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  // ============================================================
  // Export CSV
  // ============================================================

  const exportCSV = () => {
    if (candidates.length === 0) return;

    // En-têtes
    const headers = [
      'Candidat',
      'Email',
      'Statut',
      'Date candidature',
      'Lettre de motivation',
      ...questions.map(q => q.question_text),
    ];

    // Lignes
    const rows = filteredCandidates.map(c => [
      c.candidateName,
      c.candidateEmail,
      c.application.status,
      new Date(c.application.created_at).toLocaleDateString('fr-FR'),
      (c.application.cover_letter || '').replace(/"/g, '""'),
      ...questions.map(q => {
        const resp = c.responses[q.id];
        if (!resp) return '';
        if (q.question_type === 'mcq') return (resp.answer_options || []).join(', ');
        return (resp.answer_text || '').replace(/"/g, '""');
      }),
    ]);

    // Encoder en CSV
    const csvContent = [
      headers.map(h => `"${h}"`).join(';'),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(';')),
    ].join('\n');

    // BOM UTF-8 pour Excel
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reponses_${offer?.title?.replace(/\s+/g, '_') || offerId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtrage
  const filteredCandidates = filterStatus === 'all'
    ? candidates
    : candidates.filter(c => c.application.status === filterStatus);

  // ============================================================
  // Rendu
  // ============================================================

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Chargement des réponses...</div>;
  }

  if (!offer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Offre introuvable</p>
      </div>
    );
  }

  const hasQuestionnaire = questions.length > 0;
  const respondedCount = candidates.filter(c => Object.keys(c.responses).length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <a
          href={`/dashboard/offers/${offerId}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-dark transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Retour à l&apos;offre
        </a>
        <h1 className="text-2xl font-bold text-brand-dark mt-2">Réponses des candidats</h1>
        <p className="text-gray-500 mt-1">{offer.title}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{candidates.length}</p>
                <p className="text-xs text-gray-500">Candidatures</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{respondedCount}</p>
                <p className="text-xs text-gray-500">Questionnaires remplis</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Eye className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{questions.length}</p>
                <p className="text-xs text-gray-500">Questions posées</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="accepted">Accepté</option>
            <option value="rejected">Refusé</option>
          </select>
        </div>
        <Button onClick={exportCSV} variant="secondary" size="sm" disabled={candidates.length === 0}>
          <Download className="h-4 w-4 mr-2" /> Exporter CSV
        </Button>
      </div>

      {/* Liste des candidats */}
      {filteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucune candidature</p>
            <p className="text-sm text-gray-400 mt-1">
              Les réponses des candidats apparaîtront ici au fur et à mesure.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCandidates.map((c) => {
            const isExpanded = expandedCandidate === c.application.id;
            const hasResponses = Object.keys(c.responses).length > 0;
            const statusConfig: Record<string, { label: string; color: string }> = {
              pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700' },
              accepted: { label: 'Accepté', color: 'bg-green-100 text-green-700' },
              rejected: { label: 'Refusé', color: 'bg-red-100 text-red-700' },
              withdrawn: { label: 'Retiré', color: 'bg-gray-100 text-gray-600' },
            };
            const status = statusConfig[c.application.status] || statusConfig.pending;

            return (
              <Card key={c.application.id}>
                <CardContent className="p-0">
                  {/* En-tête candidat (cliquable pour expand) */}
                  <button
                    onClick={() => setExpandedCandidate(isExpanded ? null : c.application.id)}
                    className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-brand-dark/5 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-brand-dark/50" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-brand-dark truncate">{c.candidateName}</p>
                        <p className="text-xs text-gray-400">{c.candidateEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      {hasResponses && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
                          Questionnaire rempli
                        </span>
                      )}
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {new Date(c.application.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Détail expandé */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 space-y-4">
                      {/* Lettre de motivation */}
                      {c.application.cover_letter && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            Lettre de motivation
                          </p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                            {c.application.cover_letter}
                          </p>
                        </div>
                      )}

                      {/* Réponses au questionnaire */}
                      {hasQuestionnaire && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                            Réponses au questionnaire
                          </p>

                          {!hasResponses ? (
                            <p className="text-sm text-gray-400 italic">
                              Le candidat n&apos;a pas encore rempli le questionnaire.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {questions.map((q, idx) => {
                                const resp = c.responses[q.id];
                                let displayAnswer = '';

                                if (!resp) {
                                  displayAnswer = '— Non répondu';
                                } else if (q.question_type === 'mcq') {
                                  displayAnswer = (resp.answer_options || []).join(', ') || '— Aucune sélection';
                                } else if (q.question_type === 'yesno') {
                                  displayAnswer = resp.answer_text || '— Non répondu';
                                } else {
                                  displayAnswer = resp.answer_text || '— Non répondu';
                                }

                                const isYes = q.question_type === 'yesno' && resp?.answer_text === 'Oui';
                                const isNo = q.question_type === 'yesno' && resp?.answer_text === 'Non';

                                return (
                                  <div key={q.id} className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">
                                      <span className="font-medium">Q{idx + 1}.</span> {q.question_text}
                                    </p>
                                    <div className="flex items-start gap-2">
                                      {isYes && <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />}
                                      {isNo && <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
                                      <p className={`text-sm font-medium ${
                                        isYes ? 'text-green-700' : isNo ? 'text-red-700' : 'text-brand-dark'
                                      }`}>
                                        {displayAnswer}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
