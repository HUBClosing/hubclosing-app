import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { triggerWebhooks } from '@/lib/webhooks';

// GET /api/crm/events — liste des événements du recruteur
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('recruiter_events')
      .select(`
        *,
        offer:offers(id, title),
        assignments:event_assignments(
          id,
          closer_id,
          closer_name,
          closer_email,
          status,
          performances:event_performances(
            calls_scheduled,
            calls_completed,
            revenue_collected,
            revenue_invoiced,
            no_shows,
            cancellations
          )
        )
      `)
      .eq('recruiter_id', user.id)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/crm/events — créer un événement
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    // Vérifier que c'est un recruteur
    const { data: userData } = await supabase
      .from('users')
      .select('role_type, active_role')
      .eq('id', user.id)
      .single();

    if (!userData || (userData.role_type !== 'admin' && userData.active_role !== 'recruiter')) {
      return NextResponse.json({ error: 'Accès réservé aux recruteurs' }, { status: 403 });
    }

    const body = await req.json();
    const { title, event_type, start_date, end_date, description, offer_id, status: eventStatus, notes } = body;

    if (!title?.trim() || !event_type || !start_date) {
      return NextResponse.json({ error: 'Titre, type et date de début requis' }, { status: 400 });
    }

    const validTypes = ['challenge', 've', 'webinaire'];
    if (!validTypes.includes(event_type)) {
      return NextResponse.json({ error: 'Type d\'événement invalide' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('recruiter_events')
      .insert({
        recruiter_id: user.id,
        title: title.trim(),
        event_type,
        start_date,
        end_date: end_date || null,
        description: description?.trim() || null,
        offer_id: offer_id || null,
        status: eventStatus || 'active',
        notes: notes?.trim() || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Webhook: événement créé
    triggerWebhooks(user.id, 'event.created', data).catch(() => {});

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
