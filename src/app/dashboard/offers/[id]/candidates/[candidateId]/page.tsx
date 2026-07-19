'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Button } from '@/components/ui';
import {
  ArrowLeft, User, Mail, Phone, Briefcase, Star, TrendingUp,
  Award, Globe, Linkedin, Calendar, MessageSquare, ClipboardList,
  CheckCircle, XCircle, Clock, Eye, Search, Loader2,
} from 'lucide-react';
import type {
  Application, User as UserType, Profile, PortfolioEntry,
  QuestionnaireQuestion, QuestionnaireResponse,
  ApplicationStatus, APPLICATION_STATUS_CONFIG,
} from '@/types/database';

// On importe la config directement
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'En attente', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  reviewing: { label: 'À étudier', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  accepted: { label: 'Profil validé', color: 'text-green-700', bgColor: 'bg-green-100' },
  rejected: { label: 'Non retenu', color: 'text-red-700', bgColor: 'bg-red-100' },
  withdrawn: { label: 'Retiré', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

const STATUS_ACTIONS: { value: ApplicationStatus; label: string; color: string; hoverColor: string }[] = [
  { value: 'pending', label: 'En attente', color: 'bg-amber-50 text-amber-700 border-amber-200', hoverColor: 'hover:bg-amber-100' },
  { value: 'reviewing', label: 'À étudier', color: 'bg-blue-50 text-blue-700 border-blue-200', hoverColor: 'hover:bg-blue-100' },
  { value: 'accepted', label: 'Profil validé', color: 'bg-green-50 text-green-700 border-green-200', hoverColor: 'hover:bg-green-100' },
  { value: 'rejected', label: 'Non retenu', color: 'bg-red-50 text-red-700 border-red-200', hoverColor: 'hover:bg-red-100' },
];

export default function CandidateProfilePage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.id as string;
  const candidateId = params.candidateId as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [candidate, setCandidate] = useState<UserType | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, QuestionnaireResponse>>({});
  const [offerTitle, setOfferTitle] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);

    // 1. Candidature
    const { data: appData } = await supabase
      .from('applications')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (!appData) { setLoading(false); return; }
    setApplication(appData as Application);

    // 2. Offre (pour le titre et questionnaire)
    const { data: offerData } = await supabase
      .from('offers')
      .select('title, questionnaire_id')
      .eq('id', offerId)
      .single();
    setOfferTitle(offerData?.title || '');

    // 3. Utilisateur candidat
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', appData.closer_id)
      .single();
    setCandidate(userData as UserType);

    // 4. Profil (stats, bio, réputation)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', appData.closer_id)
      .single();
    setProfile(profileData as Profile);

    // 5. Portfolio
    const { data: portfolioData } = await supabase
      .from('portfolio_entries')
      .select('*')
      .eq('user_id', appData.closer_id)
      .order('start_date', { ascending: false })
      .limit(5);
    setPortfolio((portfolioData || []) as PortfolioEntry[]);

    // 6. Questionnaire + réponses
    if (offerData?.questionnaire_id) {
      const { data: qData } = await supabase
        .from('questionnaire_questions')
        .select('*')
        .eq('questionnaire_id', offerData.questionnaire_id)
        .order('sort_order', { ascending: true });
      setQuestions((qData || []) as QuestionnaireQuestion[]);

      const { data: rData } = await supabase
        .from('questionnaire_responses')
        .select('*')
        .eq('application_id', candidateId);

      const respMap: Record<string, QuestionnaireResponse> = {};
      (rData || []).forEach((r: QuestionnaireResponse) => { respMap[r.question_id] = r; });
      setResponses(respMap);
    }

    setLoading(false);
  }, [candidateId, offerId, supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  // Changer le statut via l'API
  const changeStatus = async (newStatus: ApplicationStatus) => {
    if (!application || application.status === newStatus) return;
    setStatusLoading(true);

    try {
      const res = await fetch(`/api/applications/${candidateId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setApplication(prev => prev ? { ...prev, status: newStatus } : prev);
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur');
      }
    } catch {
      alert('Erreur réseau');
    }

    setStatusLoading(false);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Chargement du profil...</div>;
  }

  if (!application || !candidate) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Candidature introuvable</p>
      </div>
    );
  }

  const currentStatus = STATUS_CONFIG[application.status] || STATUS_CONFIG.pending;
  const skills = candidate.skills || [];
  const tier = candidate.tier || 'free';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <a
          href={`/dashboard/offers/${offerId}/candidates`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-dark transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux candidatures
        </a>
      </div>

      {/* Carte profil principal */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-full bg-brand-dark/5 flex items-center justify-center shrink-0">
              {candidate.avatar_url ? (
                <img src={candidate.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-brand-dark/40" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-brand-dark">{candidate.full_name || 'Anonyme'}</h1>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${currentStatus.bgColor} ${currentStatus.color}`}>
                  {currentStatus.label}
                </span>
                {tier !== 'free' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium capitalize">
                    {tier}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {candidate.email}
                </span>
                {candidate.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {candidate.phone}
                  </span>
                )}
                {candidate.years_experience && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> {candidate.years_experience} an{candidate.years_experience > 1 ? 's' : ''} exp.
                  </span>
                )}
              </div>

              {/* Skills */}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {skills.map((s: string) => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-brand-dark/5 text-brand-dark font-medium capitalize">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Date candidature */}
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Candidature le {new Date(application.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Boutons de changement de statut */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Changer le statut</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_ACTIONS.map((action) => {
                const isActive = application.status === action.value;
                return (
                  <button
                    key={action.value}
                    onClick={() => changeStatus(action.value)}
                    disabled={statusLoading || isActive}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      isActive
                        ? `${action.color} ring-2 ring-offset-1 ring-current`
                        : `${action.color} ${action.hoverColor} opacity-60 hover:opacity-100`
                    } disabled:cursor-not-allowed`}
                  >
                    {statusLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" /> : null}
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio + liens */}
      {profile && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-brand-dark">Profil détaillé</h2>

            {profile.bio && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Bio</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}

            {/* Liens */}
            <div className="flex flex-wrap gap-3">
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </a>
              )}
              {profile.portfolio_url && (
                <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-brand-dark hover:underline">
                  <Globe className="h-4 w-4" /> Portfolio
                </a>
              )}
              {profile.website_url && (
                <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-brand-dark hover:underline">
                  <Globe className="h-4 w-4" /> Site web
                </a>
              )}
            </div>

            {/* Stats de réputation */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-brand-dark">{profile.score || 0}</p>
                <p className="text-xs text-gray-500">Score</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-brand-dark">{profile.total_deals_closed || 0}</p>
                <p className="text-xs text-gray-500">Deals closés</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-brand-dark">
                  {(profile.total_revenue_generated || 0).toLocaleString('fr-FR')}€
                </p>
                <p className="text-xs text-gray-500">CA généré</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-brand-dark">{profile.total_reviews || 0}</p>
                <p className="text-xs text-gray-500">Avis reçus</p>
              </div>
            </div>

            {/* Badge */}
            {profile.badge_level && profile.badge_level !== 'bronze' && (
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-brand-amber" />
                <span className="text-sm font-medium text-brand-dark capitalize">Badge {profile.badge_level}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lettre de motivation */}
      {application.cover_letter && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold text-brand-dark mb-3">Lettre de motivation</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
              {application.cover_letter}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Réponses questionnaire */}
      {questions.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2 mb-4">
              <ClipboardList className="h-5 w-5 text-brand-amber" />
              Réponses au questionnaire
            </h2>

            {Object.keys(responses).length === 0 ? (
              <p className="text-sm text-gray-400 italic">Le candidat n&apos;a pas encore rempli le questionnaire.</p>
            ) : (
              <div className="space-y-3">
                {questions.map((q, idx) => {
                  const resp = responses[q.id];
                  let displayAnswer = '— Non répondu';
                  if (resp) {
                    if (q.question_type === 'mcq') displayAnswer = (resp.answer_options || []).join(', ');
                    else displayAnswer = resp.answer_text || '— Non répondu';
                  }

                  const isYes = q.question_type === 'yesno' && resp?.answer_text === 'Oui';
                  const isNo = q.question_type === 'yesno' && resp?.answer_text === 'Non';

                  return (
                    <div key={q.id} className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">
                        <span className="font-medium">Q{idx + 1}.</span> {q.question_text}
                        {q.is_required && <span className="text-red-500 ml-1">*</span>}
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
          </CardContent>
        </Card>
      )}

      {/* Portfolio */}
      {portfolio.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-brand-amber" />
              Expériences portfolio
            </h2>
            <div className="space-y-3">
              {portfolio.map((entry) => (
                <div key={entry.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-brand-dark">{entry.offer_name}</h3>
                    {entry.is_current && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">En cours</span>
                    )}
                  </div>
                  {entry.niche && <p className="text-xs text-gray-500 mb-2">{entry.niche}</p>}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-sm font-bold text-brand-dark">{entry.deals_closed}</p>
                      <p className="text-xs text-gray-400">Deals</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-dark">{entry.revenue_closed.toLocaleString('fr-FR')}€</p>
                      <p className="text-xs text-gray-400">CA closé</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-dark">{entry.calls_made}</p>
                      <p className="text-xs text-gray-400">Appels</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-dark">{entry.cash_per_call}€</p>
                      <p className="text-xs text-gray-400">€/appel</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions rapides */}
      <div className="flex gap-3">
        <Button onClick={() => router.push('/dashboard/messages')} variant="secondary" size="sm" className="flex-1">
          <MessageSquare className="h-4 w-4 mr-2" /> Envoyer un message
        </Button>
        <Button onClick={() => router.back()} variant="secondary" size="sm">
          Retour
        </Button>
      </div>
    </div>
  );
}
