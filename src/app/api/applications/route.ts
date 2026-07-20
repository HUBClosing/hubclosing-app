import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Notifier le recruteur
  const offer = application.offer as { id: string; title: string; manager_id: string } | null;
  if (offer?.manager_id) {
    await supabase.from('notifications').insert({
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
