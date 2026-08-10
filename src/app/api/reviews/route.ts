import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBadgeForScore } from '@/types/database';
import { createNotification } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await request.json();
  const {
    application_id,
    reviewed_id,
    rating,
    rating_reactivity,
    rating_quality,
    rating_communication,
    rating_results,
    comment,
  } = body;

  // Validations
  if (!application_id || !reviewed_id || !rating) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }

  // Validation UUID format
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(application_id) || !UUID_RE.test(reviewed_id)) {
    return NextResponse.json({ error: 'IDs invalides' }, { status: 400 });
  }

  // Validation stricte du type et de la plage pour rating
  if (typeof rating !== 'number' || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Note entre 1 et 5' }, { status: 400 });
  }

  if (reviewed_id === user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez pas vous noter vous-même' }, { status: 400 });
  }

  // Valider les sous-notes (1-5 si fournies)
  const subRatings = [rating_reactivity, rating_quality, rating_communication, rating_results];
  for (const sr of subRatings) {
    if (sr !== undefined && sr !== null) {
      if (typeof sr !== 'number' || !Number.isFinite(sr) || sr < 1 || sr > 5) {
        return NextResponse.json({ error: 'Les sous-notes doivent être entre 1 et 5' }, { status: 400 });
      }
    }
  }

  // Valider longueur commentaire
  if (comment && comment.length > 2000) {
    return NextResponse.json({ error: 'Commentaire trop long (2000 car. max)' }, { status: 400 });
  }

  // Vérifier que la candidature existe et est 'completed'
  const { data: application } = await supabase
    .from('applications')
    .select('*, offer:offers!applications_offer_id_fkey(id, title, manager_id)')
    .eq('id', application_id)
    .single();

  if (!application) {
    return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 });
  }

  if (application.status !== 'completed') {
    return NextResponse.json({ error: 'La collaboration doit être terminée pour laisser un avis' }, { status: 400 });
  }

  const offer = application.offer as { id: string; title: string; manager_id: string };

  // Vérifier que l'utilisateur est bien partie prenante
  const isRecruiter = offer.manager_id === user.id;
  const isCandidate = application.closer_id === user.id;

  if (!isRecruiter && !isCandidate) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  // Vérifier que reviewed_id est bien la contrepartie (pas un user arbitraire)
  const expectedReviewedId = isRecruiter ? application.closer_id : offer.manager_id;
  if (reviewed_id !== expectedReviewedId) {
    return NextResponse.json({ error: 'Vous ne pouvez noter que votre contrepartie dans cette collaboration' }, { status: 403 });
  }

  // Vérifier qu'un avis n'existe pas déjà
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('reviewer_id', user.id)
    .eq('reviewed_id', reviewed_id)
    .eq('application_id', application_id)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Vous avez déjà laissé un avis pour cette collaboration' }, { status: 409 });
  }

  // Créer l'avis
  const { data: review, error: insertError } = await supabase
    .from('reviews')
    .insert({
      reviewer_id: user.id,
      reviewed_id,
      offer_id: offer.id,
      application_id,
      rating,
      rating_reactivity: rating_reactivity || null,
      rating_quality: rating_quality || null,
      rating_communication: rating_communication || null,
      rating_results: rating_results || null,
      reviewer_role: isRecruiter ? 'recruiter' : 'candidate',
      comment: comment?.trim() || null,
      is_public: true,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('[reviews] insert error:', insertError.message);
    return NextResponse.json({ error: 'Erreur lors de la création de l\'avis' }, { status: 500 });
  }

  // Recalculer le score moyen du profil noté
  const { data: allReviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewed_id', reviewed_id);

  if (allReviews && allReviews.length > 0) {
    const avgRating = allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / allReviews.length;
    // Score sur 100 basé sur la moyenne des notes (5 étoiles = 100)
    const score = Math.round(avgRating * 20);
    const badgeLevel = getBadgeForScore(score);

    // Utiliser le client admin pour mettre à jour le profil d'un autre utilisateur (bypass RLS)
    const { getSupabaseAdmin: getAdmin } = await import('@/lib/supabase/admin');
    const adminSupa = getAdmin();
    await adminSupa
      .from('profiles')
      .update({
        score,
        total_reviews: allReviews.length,
        badge_level: badgeLevel,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', reviewed_id);
  }

  // Notifier la personne notée
  const { data: reviewerUser } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single();

  await createNotification({
    user_id: reviewed_id,
    type: 'review_received',
    title: 'Nouvel avis reçu',
    body: `${reviewerUser?.full_name || 'Un utilisateur'} vous a laissé un avis ${rating}/5 pour "${offer.title}".`,
    link: '/dashboard/reputation',
    metadata: {
      review_id: review.id,
      application_id,
      offer_id: offer.id,
      rating,
    },
  });

  return NextResponse.json({
    success: true,
    review_id: review.id,
  });
}
