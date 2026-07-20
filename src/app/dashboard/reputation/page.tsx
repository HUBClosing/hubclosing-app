'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui';
import {
  Shield, Star, Award, MessageCircle, TrendingUp,
  Lock, User, ChevronRight,
} from 'lucide-react';
import {
  BADGE_THRESHOLDS, REVIEW_CRITERIA, getBadgeForScore,
  type BadgeLevel, type Review, type User as UserType,
} from '@/types/database';

// ============================================================
// Composant jauge de progression badge
// ============================================================

function BadgeProgress({ score, badgeLevel }: { score: number; badgeLevel: BadgeLevel }) {
  const config = BADGE_THRESHOLDS[badgeLevel];
  const allBadges: BadgeLevel[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const currentIdx = allBadges.indexOf(badgeLevel);

  return (
    <div className="space-y-4">
      {/* Badge actuel */}
      <div className="flex items-center gap-4">
        <div className={`h-16 w-16 rounded-2xl ${config.bgColor} flex items-center justify-center`}>
          <Award className={`h-8 w-8 ${config.color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-brand-dark">{score}<span className="text-base font-normal text-gray-400">/100</span></p>
          <p className={`text-sm font-semibold ${config.color}`}>{config.label}</p>
        </div>
      </div>

      {/* Barre de progression vers le prochain badge */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{config.label} ({config.min})</span>
          {currentIdx < allBadges.length - 1 && (
            <span>{BADGE_THRESHOLDS[allBadges[currentIdx + 1]].label} ({BADGE_THRESHOLDS[allBadges[currentIdx + 1]].min})</span>
          )}
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              badgeLevel === 'diamond' ? 'bg-purple-500' :
              badgeLevel === 'platinum' ? 'bg-blue-500' :
              badgeLevel === 'gold' ? 'bg-yellow-500' :
              badgeLevel === 'silver' ? 'bg-gray-400' : 'bg-amber-500'
            }`}
            style={{
              width: `${currentIdx < allBadges.length - 1
                ? Math.min(100, ((score - config.min) / (config.max - config.min + 1)) * 100)
                : 100
              }%`,
            }}
          />
        </div>
      </div>

      {/* Tous les badges */}
      <div className="flex items-center gap-2">
        {allBadges.map((b) => {
          const bc = BADGE_THRESHOLDS[b];
          const isActive = allBadges.indexOf(b) <= currentIdx;
          return (
            <div
              key={b}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
                isActive ? `${bc.bgColor}` : 'bg-gray-50 opacity-40'
              }`}
            >
              <Award className={`h-4 w-4 ${isActive ? bc.color : 'text-gray-300'}`} />
              <span className={`text-xs font-medium ${isActive ? bc.color : 'text-gray-300'}`}>{bc.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Composant radar simplifié (barres horizontales)
// ============================================================

function CriteriaBreakdown({ reviews }: { reviews: Review[] }) {
  // Calculer les moyennes par critère
  const criteriaAvgs = REVIEW_CRITERIA.map(c => {
    const key = c.key as keyof Review;
    const rated = reviews.filter(r => r[key] != null && typeof r[key] === 'number');
    const avg = rated.length > 0
      ? rated.reduce((sum, r) => sum + (r[key] as number), 0) / rated.length
      : 0;
    return { ...c, avg: Math.round(avg * 10) / 10, count: rated.length };
  });

  return (
    <div className="space-y-3">
      {criteriaAvgs.map(c => (
        <div key={c.key} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span>{c.icon}</span>
              <span className="text-gray-700 font-medium">{c.label}</span>
            </span>
            <span className="text-gray-500 font-medium">
              {c.count > 0 ? `${c.avg}/5` : '—'}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-amber rounded-full transition-all duration-500"
              style={{ width: `${c.count > 0 ? (c.avg / 5) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Page principale
// ============================================================

export default function ReputationPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [score, setScore] = useState(0);
  const [badgeLevel, setBadgeLevel] = useState<BadgeLevel>('bronze');
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviews, setReviews] = useState<(Review & { reviewer?: UserType })[]>([]);
  const [userTier, setUserTier] = useState('free');

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    // User info
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userData) {
      setCurrentUser(userData as UserType);
      setUserTier(userData.tier || 'free');
    }

    // Profil avec score
    const { data: profile } = await supabase
      .from('profiles')
      .select('score, badge_level, total_reviews')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      setScore(profile.score || 0);
      setBadgeLevel((profile.badge_level as BadgeLevel) || 'bronze');
      setTotalReviews(profile.total_reviews || 0);
    }

    // Charger les avis reçus
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*, reviewer:users!reviews_reviewer_id_fkey(full_name, avatar_url, tier)')
      .eq('reviewed_id', user.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50);

    setReviews((reviewsData || []) as (Review & { reviewer?: UserType })[]);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { loadData(); }, [loadData]);

  // L'utilisateur a-t-il un tier suffisant pour voir les commentaires ?
  const canSeeComments = userTier !== 'free';

  // Moyenne globale
  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Chargement de votre réputation...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
          <Shield className="h-6 w-6 text-brand-amber" /> Réputation
        </h1>
        <p className="text-gray-500 mt-1">Votre score de confiance, vos badges et les avis de vos collaborations.</p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-brand-dark">{score}</p>
            <p className="text-xs text-gray-400 mt-1">Score /100</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-brand-dark">{avgRating || '—'}</p>
            <p className="text-xs text-gray-400 mt-1">Note moyenne /5</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-brand-dark">{totalReviews}</p>
            <p className="text-xs text-gray-400 mt-1">Avis reçus</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${BADGE_THRESHOLDS[badgeLevel].color}`}>
              {BADGE_THRESHOLDS[badgeLevel].label}
            </p>
            <p className="text-xs text-gray-400 mt-1">Badge actuel</p>
          </CardContent>
        </Card>
      </div>

      {/* Badge + progression */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-base font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-brand-amber" /> Progression badge
          </h2>
          <BadgeProgress score={score} badgeLevel={badgeLevel} />
        </CardContent>
      </Card>

      {/* Détail par critère */}
      {reviews.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold text-brand-dark mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-amber" /> Détail par critère
            </h2>
            <CriteriaBreakdown reviews={reviews} />
          </CardContent>
        </Card>
      )}

      {/* Liste des avis */}
      <div>
        <h2 className="text-base font-semibold text-brand-dark mb-3 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-brand-amber" />
          Avis reçus
          <span className="text-xs font-normal text-gray-400">({reviews.length})</span>
        </h2>

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Star className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucun avis pour le moment</p>
              <p className="text-sm text-gray-400 mt-1">Les avis apparaîtront après vos premières collaborations terminées.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => {
              const reviewer = review.reviewer as UserType | undefined;
              return (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    {/* Auteur + note */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          {reviewer?.avatar_url ? (
                            <img src={reviewer.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <User className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-brand-dark">{reviewer?.full_name || 'Utilisateur'}</p>
                          <p className="text-xs text-gray-400">
                            {review.reviewer_role === 'recruiter' ? 'Recruteur' : 'Candidat'}
                            {' · '}
                            {new Date(review.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      {/* Étoiles */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Sous-critères en mini */}
                    {(review.rating_reactivity || review.rating_quality || review.rating_communication || review.rating_results) && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {REVIEW_CRITERIA.map(c => {
                          const val = review[c.key as keyof Review] as number | null;
                          if (!val) return null;
                          return (
                            <span key={c.key} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {c.icon} {c.label} {val}/5
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Commentaire — paywall */}
                    {review.comment && (
                      canSeeComments ? (
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
                      ) : (
                        <div className="mt-2 p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center gap-2">
                          <Lock className="h-4 w-4 text-gray-400 shrink-0" />
                          <p className="text-xs text-gray-400 flex-1">
                            Passez au <span className="font-medium text-brand-amber">Starter</span> pour lire les commentaires détaillés
                          </p>
                          <a href="/dashboard/subscription" className="text-xs text-brand-green font-medium hover:underline shrink-0 flex items-center gap-1">
                            Upgrade <ChevronRight className="h-3 w-3" />
                          </a>
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
