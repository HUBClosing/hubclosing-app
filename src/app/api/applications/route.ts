import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRemainingApplications, canUserDo, isOfferPremium } from '@/types/database';
import type { User } from '@/types/database';
import { sendEmail } from '@/lib/email';
import { newApplicationEmail } from '@/lib/email/templates/new-application';
import { createNotification } from '@/lib/supabase/admin';

/**
 * POST /api/applications
 * Crée une candidature avec vérification quota + premium côté serveur.
 * Body: { offer_id: string, cover_letter?: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // Récupérer le profil complet de l'utilisateur
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (!user) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
  }

  // ── Vérification rôle candidat ──
  const isCandidate =
    user.role_type === 'candidate' ||
    (user.role_type === 'both' && user.active_role === 'candidate') ||
    user.role_type === 'admin';

  if (!isCandidate) {
    return NextResponse.json({ error: 'Seuls les candidats peuvent postuler' }, { status: 403 });
  }

  let body: { offer_id?: string; cover_letter?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }
  const { offer_id, cover_letter } = body;

  if (!offer_id) {
    return NextResponse.json({ error: 'offer_id requis' }, { status: 400 });
  }

  // Validation UUID format
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(offer_id)) {
    return NextResponse.json({ error: 'offer_id invalide' }, { status: 400 });
  }

  // Validation longueur cover_letter (max 5000 caractères)
  if (cover_letter && cover_letter.length > 5000) {
    return NextResponse.json({ error: 'Lettre de motivation trop longue (5000 car. max)' }, { status: 400 });
  }

  // Récupérer l'offre
  const { data: offer } = await supabase
    .from('offers')
    .select('*')
    .eq('id', offer_id)
    .single();

  if (!offer) {
    return NextResponse.json({ error: 'Offre introuvable' }, { status: 404 });
  }

  if (offer.status !== 'active') {
    return NextResponse.json({ error: 'Cette offre n\'est plus active' }, { status: 400 });
  }

  // ── Vérification 1 : Offre premium ──
  if (isOfferPremium(offer) && !canUserDo(user as User, 'see_premium_offers')) {
    return NextResponse.json(
      { error: 'Cette offre est réservée aux abonnés Pro et supérieurs.', code: 'PREMIUM_REQUIRED' },
      { status: 403 }
    );
  }

  // ── Vérification 2 : Quota mensuel ──
  const remaining = getRemainingApplications(user as User);
  if (remaining <= 0) {
    return NextResponse.json(
      { error: 'Vous avez atteint votre limite de candidatures ce mois-ci. Passez au tier supérieur pour postuler davantage.', code: 'QUOTA_EXCEEDED' },
      { status: 403 }
    );
  }

  // ── Vérification 3 : Deadline ──
  if (offer.application_deadline) {
    const deadline = new Date(offer.application_deadline);
    if (deadline < new Date()) {
      return NextResponse.json(
        { error: 'La date limite de candidature est dépassée.' },
        { status: 400 }
      );
    }
  }

  // ── Vérification 4 : Max applicants ──
  if (offer.max_applicants) {
    const { count } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('offer_id', offer_id)
      .not('status', 'eq', 'withdrawn');

    if ((count || 0) >= offer.max_applicants) {
      return NextResponse.json(
        { error: 'Le nombre maximum de candidatures pour cette offre a été atteint.' },
        { status: 400 }
      );
    }
  }

  // ── Vérification 5 : Doublon ──
  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('offer_id', offer_id)
    .eq('closer_id', authUser.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'Vous avez déjà postulé à cette offre.', code: 'ALREADY_APPLIED', application_id: existing.id },
      { status: 409 }
    );
  }

  // ── Créer la candidature ──
  const { data: app, error: insertErr } = await supabase
    .from('applications')
    .insert({
      offer_id,
      closer_id: authUser.id,
      cover_letter: cover_letter?.trim() || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (insertErr) {
    console.error('[applications] insert error:', insertErr.message);
    return NextResponse.json({ error: 'Erreur lors de la création de la candidature' }, { status: 500 });
  }

  // ── Incrémenter le compteur mensuel ──
  await supabase
    .from('users')
    .update({
      monthly_applications_count: (user.monthly_applications_count || 0) + 1,
    })
    .eq('id', authUser.id);

  // ── Notifier le recruteur (in-app + email) ──
  if (offer.manager_id) {
    await createNotification({
      user_id: offer.manager_id,
      type: 'new_application',
      title: 'Nouvelle candidature',
      body: `Un candidat a postulé à "${offer.title}".`,
      link: `/dashboard/offers/${offer_id}/candidates/${app.id}`,
      metadata: { application_id: app.id, offer_id },
    });

    // Email au recruteur
    const { data: recruiter } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', offer.manager_id)
      .single();

    if (recruiter?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const { subject, html } = newApplicationEmail({
        recruiterName: recruiter.full_name || 'Recruteur',
        candidateName: user.full_name || 'Candidat',
        offerTitle: offer.title,
        offerId: offer_id,
        candidateRole: user.role || 'closer',
        appUrl,
      });
      // Fire-and-forget — on ne bloque pas la réponse
      sendEmail({ to: recruiter.email, subject, html }).catch(() => {});
    }
  }

  return NextResponse.json({
    success: true,
    application_id: app.id,
    has_questionnaire: !!offer.questionnaire_id,
    questionnaire_id: offer.questionnaire_id,
  });
}

/**
 * PATCH /api/applications
 * Permet au candidat de retirer sa candidature.
 * Body: { application_id: string, status: 'withdrawn' }
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await request.json();
  const { application_id, status } = body;

  if (!application_id || status !== 'withdrawn') {
    return NextResponse.json(
      { error: 'Requête invalide. Seul le statut "withdrawn" est autorisé.' },
      { status: 400 }
    );
  }

  // Validation UUID format
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(application_id)) {
    return NextResponse.json({ error: 'application_id invalide' }, { status: 400 });
  }

  // Récupérer la candidature
  const { data: application } = await supabase
    .from('applications')
    .select('*, offer:offers(id, title, manager_id)')
    .eq('id', application_id)
    .single();

  if (!application) {
    return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 });
  }

  // Vérifier que l'utilisateur est bien le candidat
  if (application.closer_id !== user.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  // Vérifier que le statut permet le retrait
  if (!['pending', 'reviewing'].includes(application.status)) {
    return NextResponse.json(
      { error: `Impossible de retirer une candidature au statut "${application.status}"` },
      { status: 400 }
    );
  }

  // Mettre à jour le statut
  const { error: updateError } = await supabase
    .from('applications')
    .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
    .eq('id', application_id);

  if (updateError) {
    console.error('[applications] withdraw error:', updateError.message);
    return NextResponse.json({ error: 'Erreur lors du retrait de la candidature' }, { status: 500 });
  }

  // Décrémenter le compteur mensuel (rendre la candidature)
  const { data: candidateUser } = await supabase
    .from('users')
    .select('monthly_applications_count')
    .eq('id', application.closer_id)
    .single();

  if (candidateUser && candidateUser.monthly_applications_count > 0) {
    await supabase
      .from('users')
      .update({
        monthly_applications_count: candidateUser.monthly_applications_count - 1,
      })
      .eq('id', application.closer_id);
  }

  // Notifier le recruteur
  const offer = application.offer as { id: string; title: string; manager_id: string } | null;
  if (offer?.manager_id) {
    await createNotification({
      user_id: offer.manager_id,
      type: 'status_change',
      title: 'Candidature retirée',
      body: `Un candidat a retiré sa candidature pour "${offer.title}".`,
      link: `/dashboard/offers/${offer.id}/candidates`,
      metadata: {
        application_id,
        offer_id: offer.id,
        old_status: application.status,
        new_status: 'withdrawn',
      },
    });
  }

  return NextResponse.json({ success: true, newStatus: 'withdrawn' });
}
