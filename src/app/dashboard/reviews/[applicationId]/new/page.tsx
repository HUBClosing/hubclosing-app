'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Button } from '@/components/ui';
import {
  ArrowLeft, Star, Send, CheckCircle, AlertTriangle, Loader2,
} from 'lucide-react';
import { REVIEW_CRITERIA } from '@/types/database';

// ============================================================
// Composant étoiles cliquables
// ============================================================

function StarRating({
  value,
  onChange,
  size = 'md',
}: {
  value: number;
  onChange: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hover, setHover] = useState(0);
  const sizeClass = size === 'lg' ? 'h-8 w-8' : size === 'md' ? 'h-6 w-6' : 'h-5 w-5';

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`${sizeClass} transition-colors ${
              star <= (hover || value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm font-medium text-gray-600">{value}/5</span>
      )}
    </div>
  );
}

// ============================================================
// Page
// ============================================================

interface CollabInfo {
  application_id: string;
  offer_title: string;
  offer_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  my_role: 'candidate' | 'recruiter';
  already_reviewed: boolean;
}

export default function NewReviewPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.applicationId as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [collab, setCollab] = useState<CollabInfo | null>(null);

  // Ratings
  const [globalRating, setGlobalRating] = useState(0);
  const [subRatings, setSubRatings] = useState<Record<string, number>>({
    rating_reactivity: 0,
    rating_quality: 0,
    rating_communication: 0,
    rating_results: 0,
  });
  const [comment, setComment] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      // Charger la candidature
      const { data: app } = await supabase
        .from('applications')
        .select('*, offer:offers!applications_offer_id_fkey(id, title, manager_id), closer:users!applications_closer_id_fkey(id, full_name, avatar_url)')
        .eq('id', applicationId)
        .single();

      if (!app) { setError('Candidature introuvable'); setLoading(false); return; }
      if (app.status !== 'completed') { setError('La collaboration doit être terminée pour laisser un avis'); setLoading(false); return; }

      const offer = app.offer as { id: string; title: string; manager_id: string };
      const closer = app.closer as { id: string; full_name: string | null; avatar_url: string | null };
      const isRecruiter = offer.manager_id === user.id;
      const isCandidate = app.closer_id === user.id;

      if (!isRecruiter && !isCandidate) { setError('Non autorisé'); setLoading(false); return; }

      // Qui va-t-on noter ?
      let otherUserId: string;
      let otherUserName: string;
      let otherUserAvatar: string | null;

      if (isRecruiter) {
        // Le recruteur note le closer
        otherUserId = closer.id;
        otherUserName = closer.full_name || 'Le candidat';
        otherUserAvatar = closer.avatar_url;
      } else {
        // Le candidat note le recruteur
        otherUserId = offer.manager_id;
        // Charger les infos du recruteur
        const { data: recruiter } = await supabase
          .from('users')
          .select('full_name, avatar_url')
          .eq('id', offer.manager_id)
          .single();
        otherUserName = recruiter?.full_name || 'Le recruteur';
        otherUserAvatar = recruiter?.avatar_url || null;
      }

      // Vérifier si déjà noté
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('reviewer_id', user.id)
        .eq('reviewed_id', otherUserId)
        .eq('application_id', applicationId)
        .single();

      setCollab({
        application_id: applicationId,
        offer_title: offer.title,
        offer_id: offer.id,
        other_user_id: otherUserId,
        other_user_name: otherUserName,
        other_user_avatar: otherUserAvatar,
        my_role: isRecruiter ? 'recruiter' : 'candidate',
        already_reviewed: !!existing,
      });
      setLoading(false);
    }
    load();
  }, [applicationId, supabase, router]);

  const handleSubmit = async () => {
    if (globalRating === 0) { setError('Veuillez donner une note globale'); return; }

    setSubmitting(true);
    setError('');

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_id: applicationId,
        reviewed_id: collab!.other_user_id,
        rating: globalRating,
        rating_reactivity: subRatings.rating_reactivity || null,
        rating_quality: subRatings.rating_quality || null,
        rating_communication: subRatings.rating_communication || null,
        rating_results: subRatings.rating_results || null,
        comment: comment.trim(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Erreur lors de l\'envoi');
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
  };

  // ============================================================
  // Render
  // ============================================================

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Chargement...</div>;
  }

  if (error && !collab) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">{error}</p>
        <a href="/dashboard" className="text-sm text-brand-amber hover:underline mt-2 block">Retour au dashboard</a>
      </div>
    );
  }

  if (!collab) return null;

  if (collab.already_reviewed) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center">
        <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
        <p className="text-gray-700 font-medium">Vous avez déjà laissé un avis pour cette collaboration</p>
        <a href="/dashboard/reputation" className="text-sm text-brand-green hover:underline mt-2 block">Voir ma réputation</a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-brand-dark mb-2">Merci pour votre avis !</h1>
            <p className="text-gray-500 mb-6">
              Votre retour aide toute la communauté HUBClosing à progresser.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push('/dashboard/reputation')} size="sm">
                Voir ma réputation
              </Button>
              <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard')}>
                Retour au dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-dark transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <h1 className="text-2xl font-bold text-brand-dark mt-2">Laisser un avis</h1>
        <p className="text-gray-500 mt-1">Collaboration : {collab.offer_title}</p>
      </div>

      {/* Destinataire */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-brand-dark/5 flex items-center justify-center shrink-0">
              {collab.other_user_avatar ? (
                <img src={collab.other_user_avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <span className="text-lg font-medium text-brand-dark/50">
                  {collab.other_user_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium text-brand-dark">{collab.other_user_name}</p>
              <p className="text-xs text-gray-400">
                {collab.my_role === 'recruiter' ? 'Candidat sur cette offre' : 'Recruteur de cette offre'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note globale */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-base font-semibold text-brand-dark mb-1">Note globale</h2>
          <p className="text-sm text-gray-400 mb-3">Comment évaluez-vous cette collaboration dans son ensemble ?</p>
          <StarRating value={globalRating} onChange={setGlobalRating} size="lg" />
        </CardContent>
      </Card>

      {/* Sous-critères */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <h2 className="text-base font-semibold text-brand-dark">Critères détaillés <span className="text-xs font-normal text-gray-400">(optionnel)</span></h2>
          {REVIEW_CRITERIA.map((criteria) => (
            <div key={criteria.key} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{criteria.icon}</span>
                <div>
                  <p className="text-sm font-medium text-brand-dark">{criteria.label}</p>
                  <p className="text-xs text-gray-400">{criteria.description}</p>
                </div>
              </div>
              <StarRating
                value={subRatings[criteria.key] || 0}
                onChange={(v) => setSubRatings(prev => ({ ...prev, [criteria.key]: v }))}
                size="sm"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Commentaire */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-base font-semibold text-brand-dark mb-1">Commentaire</h2>
          <p className="text-sm text-gray-400 mb-3">Partagez votre retour d'expérience (visible publiquement pour les abonnés Starter+)</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Qu'avez-vous apprécié ? Qu'est-ce qui pourrait être amélioré ?"
            rows={4}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-green focus:ring-brand-green/20 resize-none"
          />
        </CardContent>
      </Card>

      {/* Erreur */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <Button onClick={handleSubmit} isLoading={submitting} className="flex-1" size="lg">
          <Send className="h-4 w-4 mr-2" /> Envoyer mon avis
        </Button>
        <Button variant="secondary" size="lg" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
