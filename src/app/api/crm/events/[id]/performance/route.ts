import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { triggerWebhooks } from '@/lib/webhooks';

// GET /api/crm/events/[id]/performance — performances de tous les closers d'un événement
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
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

    const { data, error } = await supabase
      .from('event_performances')
      .select(`
        *,
        assignment:event_assignments(
          id,
          closer_id,
          closer_name,
          closer_email,
          status
        )
      `)
      .eq('event_id', params.id)
      .order('performance_date', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/crm/events/[id]/performance — ajouter une entrée de performance
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
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
    const {
      assignment_id,
      performance_date,
      calls_scheduled,
      calls_completed,
      revenue_collected,
      revenue_invoiced,
      no_shows,
      cancellations,
      notes,
    } = body;

    if (!assignment_id || !performance_date) {
      return NextResponse.json({ error: 'assignment_id et performance_date requis' }, { status: 400 });
    }

    // Vérifier que l'assignation existe et appartient à cet événement
    const { data: assignment } = await supabase
      .from('event_assignments')
      .select('id, closer_id')
      .eq('id', assignment_id)
      .eq('event_id', params.id)
      .single();

    if (!assignment) {
      return NextResponse.json({ error: 'Assignation non trouvée' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('event_performances')
      .insert({
        event_id: params.id,
        assignment_id,
        closer_id: assignment.closer_id,
        performance_date,
        calls_scheduled: calls_scheduled || 0,
        calls_completed: calls_completed || 0,
        revenue_collected: revenue_collected || 0,
        revenue_invoiced: revenue_invoiced || 0,
        no_shows: no_shows || 0,
        cancellations: cancellations || 0,
        notes: notes?.trim() || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Webhook: performance saisie
    triggerWebhooks(user.id, 'performance.created', {
      event_id: params.id,
      performance: data,
    }).catch(() => {});

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/crm/events/[id]/performance — modifier une entrée de performance
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
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
    const { performance_id, ...updates } = body;

    if (!performance_id) {
      return NextResponse.json({ error: 'performance_id requis' }, { status: 400 });
    }

    const allowedFields = [
      'performance_date', 'calls_scheduled', 'calls_completed',
      'revenue_collected', 'revenue_invoiced', 'no_shows',
      'cancellations', 'notes',
    ];

    const cleanUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        cleanUpdates[key] = key === 'notes' ? (updates[key]?.trim() || null) : updates[key];
      }
    }

    if (Object.keys(cleanUpdates).length === 0) {
      return NextResponse.json({ error: 'Aucune modification' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('event_performances')
      .update(cleanUpdates)
      .eq('id', performance_id)
      .eq('event_id', params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Webhook: performance modifiée
    triggerWebhooks(user.id, 'performance.updated', {
      event_id: params.id,
      performance: data,
    }).catch(() => {});

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/crm/events/[id]/performance — supprimer une entrée de performance
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const performanceId = searchParams.get('performance_id');

    if (!performanceId) {
      return NextResponse.json({ error: 'performance_id requis' }, { status: 400 });
    }

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

    const { error } = await supabase
      .from('event_performances')
      .delete()
      .eq('id', performanceId)
      .eq('event_id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Webhook: performance supprimée
    triggerWebhooks(user.id, 'performance.deleted', {
      event_id: params.id,
      performance_id: performanceId,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
