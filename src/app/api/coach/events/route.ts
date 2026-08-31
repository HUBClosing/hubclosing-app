import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { randomBytes } from 'crypto';


// POST /api/coach/events — Créer un événement coaching
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  // Vérifier coach ou admin
  const { data: user } = await supabase
    .from('users')
    .select('id, role, role_type')
    .eq('id', authUser.id)
    .single();

  if (!user || (user.role_type !== 'coach' && user.role_type !== 'admin' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Réservé aux coachs' }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, event_type, start_date, end_date, price, max_participants, link_type, meeting_url } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'Titre requis' }, { status: 400 });
  if (!start_date) return NextResponse.json({ error: 'Date de début requise' }, { status: 400 });
  if (!event_type) return NextResponse.json({ error: 'Type requis' }, { status: 400 });

  // Générer un room ID Jitsi si besoin
  const jitsiRoomId = link_type === 'jitsi' ? `hubclosing-${randomBytes(8).toString('hex')}` : null;
  const finalMeetingUrl = link_type === 'jitsi'
    ? `https://meet.jit.si/${jitsiRoomId}`
    : (meeting_url || null);

  const serviceClient = getSupabaseAdmin();
  const { data: event, error } = await serviceClient
    .from('events')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      event_type: event_type || 'coaching',
      host_id: user.id,
      start_date,
      end_date: end_date || null,
      is_online: true,
      meeting_url: finalMeetingUrl,
      max_participants: max_participants ? parseInt(max_participants) : null,
      price: parseFloat(price) || 0,
      stripe_price_cents: Math.round((parseFloat(price) || 0) * 100),
      status: 'upcoming',
      link_type: link_type || 'external',
      jitsi_room_id: jitsiRoomId,
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur création événement coach:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }

  return NextResponse.json({ event });
}

// GET /api/coach/events — Lister les événements du coach
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { data: user } = await supabase
    .from('users')
    .select('id, role, role_type')
    .eq('id', authUser.id)
    .single();

  if (!user || (user.role_type !== 'coach' && user.role_type !== 'admin' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Réservé aux coachs' }, { status: 403 });
  }

  const { data: events } = await supabase
    .from('events')
    .select('*, event_registrations(count)')
    .eq('host_id', user.id)
    .order('start_date', { ascending: false });

  return NextResponse.json({ events: events || [] });
}

// PATCH /api/coach/events — Modifier un événement
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json();
  const { event_id, ...updates } = body;

  if (!event_id) return NextResponse.json({ error: 'event_id requis' }, { status: 400 });

  // Vérifier que l'événement appartient au coach
  const { data: event } = await supabase
    .from('events')
    .select('id, host_id')
    .eq('id', event_id)
    .eq('host_id', authUser.id)
    .single();

  if (!event) return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });

  // Mettre à jour le prix en centimes si le prix change
  if (updates.price !== undefined) {
    updates.stripe_price_cents = Math.round(parseFloat(updates.price) * 100);
  }

  // Si on change le type de lien vers Jitsi, générer un room ID
  if (updates.link_type === 'jitsi' && !updates.jitsi_room_id) {
    updates.jitsi_room_id = `hubclosing-${randomBytes(8).toString('hex')}`;
    updates.meeting_url = `https://meet.jit.si/${updates.jitsi_room_id}`;
  }

  const serviceClient = getSupabaseAdmin();
  const { error } = await serviceClient
    .from('events')
    .update(updates)
    .eq('id', event_id);

  if (error) {
    console.error('Erreur mise à jour événement:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/coach/events — Annuler un événement
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('event_id');
  if (!eventId) return NextResponse.json({ error: 'event_id requis' }, { status: 400 });

  // Vérifier propriété
  const { data: event } = await supabase
    .from('events')
    .select('id, host_id')
    .eq('id', eventId)
    .eq('host_id', authUser.id)
    .single();

  if (!event) return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });

  const serviceClient = getSupabaseAdmin();
  const { error } = await serviceClient
    .from('events')
    .update({ status: 'cancelled' })
    .eq('id', eventId);

  if (error) {
    console.error('Erreur annulation événement:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'annulation' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
