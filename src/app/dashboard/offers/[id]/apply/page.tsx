'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Button, Textarea } from '@/components/ui';
import {
  Send, ArrowLeft, CheckCircle, ClipboardList, AlertTriangle,
  Type, ListChecks, ToggleLeft,
} from 'lucide-react';
import type { Offer, QuestionnaireQuestion } from '@/types/database';

// ============================================================
// Étapes du flow candidature
// ============================================================
type Step = 'apply' | 'questionnaire' | 'done';

export default function ApplyPage() {
  const router = useRouter();
  const params = useParams();
  const offerId = params.id as string;
  const supabase = createClient();

  const [step, setStep] = useState<Step>('apply');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Données
  const [offer, setOffer] = useState<Offer | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, { text: string; options: string[] }>>({});

  // Charger l'offre + vérifier si déjà postulé
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      // Charger l'offre
      const { data: offerData } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (!offerData) {
        setError('Offre introuvable');
        setLoading(false);
        return;
      }
      setOffer(offerData as Offer);

      // Vérifier si le candidat a déjà postulé
      const { data: existing } = await supabase
        .from('applications')
        .select('id')
        .eq('offer_id', offerId)
        .eq('closer_id', user.id)
        .single();

      if (existing) {
        setApplicationId(existing.id);
        // Vérifier si questionnaire déjà rempli
        const { count } = await supabase
          .from('questionnaire_responses')
          .select('id', { count: 'exact', head: true })
          .eq('application_id', existing.id);

        if ((count || 0) > 0) {
          setStep('done');
        } else if (offerData.questionnaire_id) {
          // Candidature existante mais questionnaire pas encore rempli
          await loadQuestions(offerData.questionnaire_id);
          setStep('questionnaire');
        } else {
          setStep('done');
        }
      }

      setLoading(false);
    }
    load();
  }, [offerId, supabase, router]);

  const loadQuestions = async (questionnaireId: string) => {
    const { data } = await supabase
      .from('questionnaire_questions')
      .select('*')
      .eq('questionnaire_id', questionnaireId)
      .order('sort_order', { ascending: true });

    const qs = (data || []) as QuestionnaireQuestion[];
    setQuestions(qs);

    // Initialiser les réponses vides
    const initial: Record<string, { text: string; options: string[] }> = {};
    qs.forEach(q => { initial[q.id] = { text: '', options: [] }; });
    setAnswers(initial);
  };

  // Étape 1 : Postuler
  const handleApply = async () => {
    setSubmitting(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Non connecté'); setSubmitting(false); return; }

    const { data: app, error: appErr } = await supabase
      .from('applications')
      .insert({
        offer_id: offerId,
        closer_id: user.id,
        cover_letter: coverLetter.trim() || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (appErr) {
      if (appErr.message.includes('duplicate') || appErr.message.includes('unique')) {
        setError('Vous avez déjà postulé à cette offre.');
      } else {
        setError(appErr.message);
      }
      setSubmitting(false);
      return;
    }

    setApplicationId(app.id);

    // Si l'offre a un questionnaire, passer à l'étape questionnaire
    if (offer?.questionnaire_id) {
      await loadQuestions(offer.questionnaire_id);
      setStep('questionnaire');
    } else {
      setStep('done');
    }

    setSubmitting(false);
  };

  // Étape 2 : Soumettre le questionnaire
  const handleSubmitQuestionnaire = async () => {
    setSubmitting(true);
    setError('');

    if (!applicationId) { setError('Erreur : candidature introuvable'); setSubmitting(false); return; }

    // Validation des champs obligatoires
    for (const q of questions) {
      if (!q.is_required) continue;
      const a = answers[q.id];
      if (!a) { setError(`Veuillez répondre à : "${q.question_text}"`); setSubmitting(false); return; }
      if (q.question_type === 'text' && !a.text.trim()) {
        setError(`Veuillez répondre à : "${q.question_text}"`); setSubmitting(false); return;
      }
      if (q.question_type === 'yesno' && !a.text) {
        setError(`Veuillez répondre à : "${q.question_text}"`); setSubmitting(false); return;
      }
      if (q.question_type === 'mcq' && a.options.length === 0) {
        setError(`Veuillez sélectionner au moins une option pour : "${q.question_text}"`); setSubmitting(false); return;
      }
    }

    // Insérer les réponses
    const responses = questions.map(q => ({
      application_id: applicationId,
      question_id: q.id,
      answer_text: answers[q.id]?.text || null,
      answer_options: q.question_type === 'mcq' ? answers[q.id]?.options || [] : null,
    }));

    const { error: insertErr } = await supabase
      .from('questionnaire_responses')
      .insert(responses);

    if (insertErr) {
      setError(insertErr.message);
      setSubmitting(false);
      return;
    }

    setStep('done');
    setSubmitting(false);
  };

  // Helpers pour les réponses
  const updateAnswerText = (questionId: string, text: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: { ...prev[questionId], text } }));
  };

  const toggleOption = (questionId: string, option: string) => {
    setAnswers(prev => {
      const current = prev[questionId]?.options || [];
      const updated = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
      return { ...prev, [questionId]: { ...prev[questionId], options: updated } };
    });
  };

  // ============================================================
  // Chargement
  // ============================================================

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-gray-400">
        Chargement de l&apos;offre...
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Offre introuvable</p>
        <a href="/dashboard/marketplace" className="text-sm text-brand-amber hover:underline mt-2 block">
          Retour à la marketplace
        </a>
      </div>
    );
  }

  // ============================================================
  // Étape 3 : Confirmation
  // ============================================================

  if (step === 'done') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-brand-dark mb-2">Candidature envoyée !</h1>
            <p className="text-gray-500 mb-6">
              Votre candidature pour <strong>{offer.title}</strong> a bien été soumise.
              Le recruteur reviendra vers vous prochainement.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push('/dashboard/candidatures')} size="sm">
                Voir mes candidatures
              </Button>
              <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard/marketplace')}>
                Retour marketplace
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================
  // Étape 1 : Candidature (lettre de motivation)
  // ============================================================

  if (step === 'apply') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <a
            href="/dashboard/marketplace"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-dark transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à la marketplace
          </a>
          <h1 className="text-2xl font-bold text-brand-dark mt-2">Postuler</h1>
          <p className="text-gray-500 mt-1">{offer.title}</p>
        </div>

        {/* Résumé de l'offre */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-brand-dark">{offer.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{offer.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  {offer.niche && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{offer.niche}</span>}
                  {offer.commission_rate && <span>Commission max : {offer.commission_rate}%</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lettre de motivation */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-brand-dark">Votre message au recruteur</h2>
            <Textarea
              label="Lettre de motivation (optionnel)"
              placeholder="Présentez-vous, expliquez pourquoi cette offre vous intéresse, vos résultats passés..."
              rows={6}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />

            {offer.questionnaire_id && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <ClipboardList className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Après votre candidature, vous serez redirigé vers un questionnaire du recruteur pour compléter votre profil.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={handleApply} isLoading={submitting} className="flex-1" size="lg">
            <Send className="h-4 w-4 mr-2" />
            {offer.questionnaire_id ? 'Postuler et continuer' : 'Envoyer ma candidature'}
          </Button>
          <Button variant="secondary" size="lg" onClick={() => router.back()}>
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  // ============================================================
  // Étape 2 : Questionnaire
  // ============================================================

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
            </div>
            <span className="text-xs text-green-600 font-medium">Candidature envoyée</span>
          </div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className="flex items-center gap-1">
            <div className="h-6 w-6 rounded-full bg-brand-amber/10 flex items-center justify-center">
              <ClipboardList className="h-3.5 w-3.5 text-brand-amber" />
            </div>
            <span className="text-xs text-brand-amber font-medium">Questionnaire</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-brand-dark">Questionnaire du recruteur</h1>
        <p className="text-gray-500 mt-1">
          Le recruteur souhaite en savoir plus sur vous. Répondez aux questions ci-dessous pour finaliser votre candidature.
        </p>
      </div>

      {questions.map((q, idx) => (
        <Card key={q.id}>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded-full h-6 w-6 flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm font-medium text-brand-dark">
                    {q.question_text}
                    {q.is_required && <span className="text-red-500 ml-1">*</span>}
                  </p>
                </div>

                {/* Texte libre */}
                {q.question_type === 'text' && (
                  <textarea
                    value={answers[q.id]?.text || ''}
                    onChange={(e) => updateAnswerText(q.id, e.target.value)}
                    placeholder="Votre réponse..."
                    rows={3}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-green focus:ring-brand-green/20 resize-none"
                  />
                )}

                {/* QCM */}
                {q.question_type === 'mcq' && (
                  <div className="space-y-2">
                    {(q.options || []).map((opt, optIdx) => {
                      const isSelected = answers[q.id]?.options?.includes(opt);
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => toggleOption(q.id, opt)}
                          className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                            isSelected
                              ? 'bg-brand-dark text-white border-brand-dark'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-brand-dark'
                          }`}
                        >
                          <span className="font-medium mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Oui / Non */}
                {q.question_type === 'yesno' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateAnswerText(q.id, 'Oui')}
                      className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-all ${
                        answers[q.id]?.text === 'Oui'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-green-400'
                      }`}
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => updateAnswerText(q.id, 'Non')}
                      className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-all ${
                        answers[q.id]?.text === 'Non'
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-red-400'
                      }`}
                    >
                      Non
                    </button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={handleSubmitQuestionnaire} isLoading={submitting} className="flex-1" size="lg">
          <Send className="h-4 w-4 mr-2" /> Envoyer mes réponses
        </Button>
      </div>
    </div>
  );
}
