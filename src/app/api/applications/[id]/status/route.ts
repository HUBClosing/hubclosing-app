import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { APPLICATION_STATUS_CONFIG } from '@/types/database';
import type { ApplicationStatus } from '@/types/database';
import { sendEmail } from '@/lib/email';
import { applicationStatusEmail } from '@/lib/email/templates/application-status';
import { createNotification } from '@/lib/supabase/admin';

const VALID_STATUSES: ApplicationStatus[] = ['pending', 'reviewing', 'accepted', 'rejected', 'completed'];

// Transitions autorisées : from → [to, to, ...]
const ALLOWED_TRANSITIONS: Record<string, ApplicationStatus[]> = {
  pending: ['reviewing', 'rejected'],
  reviewing: ['accepted', 'rejected'],
  accepted: ['completed', 'rejected'],
  rejected: [],       // Terminal
  withdrawn: [],      // Terminal
  completed: [],      // Terminal
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await request.json();
  const newStatus = body.status as ApplicationStatus;

  if (!VALID_STATUSES.includes(newStatus)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
  }

  // Récupérer la candidature avec l'offre pour vérifier les droits
  const { data: application } = await supabase
    .from('applications')
    .select('*, offer:offers!applications_offer_id_fkey(id, title, manager_id)')
    .eq('id', params.id)
    .single();

  if (!application) {
    return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 });
  }

  const offer = application.offer as { id: string; title: string; manager_id: string };

  // Vérifier que l'utilisateur est bien le recruteur de cette offre
  if (offer.manager_id !== user.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const oldStatus = application.status as string;
  if (oldStatus === newStatus) {
    return NextResponse.json({ message: 'Statut inchangé' });
  }

  // Vérifier que la transition est autorisée
  const allowed = ALLOWED_TRANSITIONS[oldStatus] || [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `Transition "${oldStatus}" → "${newStatus}" non autorisée` },
      { status: 400 }
    );
  }

  // Mettre à jour le statut
  const { error: updateError } = await supabase
    .from('applications')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', params.id);

  if (updateError) {
    console.error('[status] update error:', updateError.message);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du statut' }, { status: 500 });
  }

  const statusConfig = APPLICATION_STATUS_CONFIG[newStatus];

  // Créer une notification pour le candidat (via admin — cross-user)
  await createNotification({
    user_id: application.closer_id,
    type: 'status_change',
    title: `Candidature ${statusConfig.label.toLowerCase()}`,
    body: `Votre candidature pour "${offer.title}" est passée à "${statusConfig.label}".`,
    link: `/dashboard/candidatures`,
    metadata: {
      application_id: params.id,
      offer_id: offer.id,
      old_status: oldStatus,
      new_status: newStatus,
    },
  });

  // Récupérer l'email du candidat + nom du recruteur pour envoi email
  const { data: candidateUser } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', application.closer_id)
    .single();

  const { data: recruiterUser } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single();

  // Envoyer l'email de changement de statut au candidat
  if (candidateUser?.email && ['reviewing', 'accepted', 'rejected', 'completed'].includes(newStatus)) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { subject, html } = applicationStatusEmail({
      candidateName: candidateUser.full_name || 'Candidat',
      offerTitle: offer.title,
      recruiterName: recruiterUser?.full_name || 'Recruteur',
      status: newStatus as 'reviewing' | 'accepted' | 'rejected' | 'completed',
      appUrl,
    });
    // Fire-and-forget
    sendEmail({ to: candidateUser.email, subject, html }).catch(() => {});
  }

  // Si la collaboration est terminée → envoyer une demande d'avis aux deux parties
  if (newStatus === 'completed') {
    const reviewLink = `/dashboard/reviews/${params.id}/new`;

    // Demande d'avis au candidat (pour noter le recruteur)
    await createNotification({
      user_id: application.closer_id,
      type: 'review_request',
      title: 'Laissez un avis',
      body: `La collaboration pour "${offer.title}" est terminée. Partagez votre retour d'expérience !`,
      link: reviewLink,
      metadata: { application_id: params.id, offer_id: offer.id, target_id: offer.manager_id },
    });

    // Demande d'avis au recruteur (pour noter le candidat)
    await createNotification({
      user_id: offer.manager_id,
      type: 'review_request',
      title: 'Laissez un avis',
      body: `La collaboration pour "${offer.title}" est terminée. Notez votre closer !`,
      link: reviewLink,
      metadata: { application_id: params.id, offer_id: offer.id, target_id: application.closer_id },
    });
  }

  return NextResponse.json({
    success: true,
    newStatus,
    label: statusConfig.label,
  });
}
