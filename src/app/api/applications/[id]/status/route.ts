import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { APPLICATION_STATUS_CONFIG } from '@/types/database';
import type { ApplicationStatus } from '@/types/database';

const VALID_STATUSES: ApplicationStatus[] = ['pending', 'reviewing', 'accepted', 'rejected'];

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

  const oldStatus = application.status;
  if (oldStatus === newStatus) {
    return NextResponse.json({ message: 'Statut inchangé' });
  }

  // Mettre à jour le statut
  const { error: updateError } = await supabase
    .from('applications')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', params.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const statusConfig = APPLICATION_STATUS_CONFIG[newStatus];

  // Créer une notification pour le candidat
  await supabase.from('notifications').insert({
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

  // Récupérer l'email du candidat pour envoi email
  const { data: candidateUser } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', application.closer_id)
    .single();

  // TODO: Intégrer un service d'email (Resend, SendGrid, etc.)
  // Pour l'instant, on log l'email à envoyer
  console.log('[EMAIL] Notification statut candidature:', {
    to: candidateUser?.email,
    subject: `HUBClosing — Votre candidature est "${statusConfig.label}"`,
    body: `Bonjour ${candidateUser?.full_name || ''},\n\nVotre candidature pour "${offer.title}" est passée au statut "${statusConfig.label}".\n\n${statusConfig.description}\n\nConnectez-vous pour voir les détails : https://hubclosing.fr/dashboard/candidatures`,
  });

  return NextResponse.json({
    success: true,
    newStatus,
    label: statusConfig.label,
  });
}
