import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/crm/events/[id]/assign — assigner un closer à un événement
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    // Vérifier que l'événement appartient au recruteur
    const { data: event } = await supabase
      .from('recruiter_events')
      .select('id')
      .eq('id', params.id)
      .eq('recruiter_id', user.id)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
    }

    const body = await req.json();
    const { closer_id, closer_name, closer_email } = body;

    if (!closer_name?.trim()) {
      return NextResponse.json({ error: 'Nom du closer requis' }, { status: 400 });
    }

    // Si closer_id fourni, vérifier qu'il existe et récupérer ses infos
    let resolvedCloserId = closer_id || null;
    let resolvedName = closer_name.trim();
    let resolvedEmail = closer_email?.trim() || null;

    if (closer_id) {
      const { data: closerUser } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', closer_id)
        .single();

      if (closerUser) {
        resolvedName = closerUser.full_name || resolvedName;
        resolvedEmail = closerUser.email || resolvedEmail;
      }
    }

    // Vérifier pas de doublon
    if (resolvedCloserId) {
      const { data: existing } = await supabase
        .from('event_assignments')
        .select('id')
        .eq('event_id', params.id)
        .eq('closer_id', resolvedCloserId)
        .neq('status', 'removed')
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'Ce closer est déjà assigné à cet événement' }, { status: 409 });
      }
    }

    const { data, error } = await supabase
      .from('event_assignments')
      .insert({
        event_id: params.id,
        closer_id: resolvedCloserId,
        closer_name: resolvedName,
        closer_email: resolvedEmail,
        status: resolvedCloserId ? 'assigned' : 'invited',
        invited_at: resolvedCloserId ? null : new Date().toISOString(),
        joined_at: resolvedCloserId ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/crm/events/[id]/assign — retirer un closer d'un événement
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    // Vérifier que l'événement appartient au recruteur
    const { data: event } = await supabase
      .from('recruiter_events')
      .select('id')
      .eq('id', params.id)
      .eq('recruiter_id', user.id)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('assignment_id');

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignment_id requis' }, { status: 400 });
    }

    const { error } = await supabase
      .from('event_assignments')
      .update({ status: 'removed' })
      .eq('id', assignmentId)
      .eq('event_id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
