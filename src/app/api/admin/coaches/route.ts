import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

async function verifyAdmin(authUserId: string) {
  const serviceClient = getSupabaseAdmin();
  const { data: adminUser } = await serviceClient
    .from('users')
    .select('role, role_type')
    .eq('id', authUserId)
    .single();
  return adminUser && (adminUser.role === 'admin' || adminUser.role_type === 'admin');
}

// GET /api/admin/coaches — Liste complète des coachs avec stats
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  if (!(await verifyAdmin(authUser.id))) {
    return NextResponse.json({ error: 'Réservé aux administrateurs' }, { status: 403 });
  }

  const serviceClient = getSupabaseAdmin();
  const { searchParams } = new URL(req.url);
  const coachId = searchParams.get('coach_id');

  // Détail d'un coach spécifique
  if (coachId) {
    const { data: coach } = await serviceClient
      .from('users')
      .select('id, full_name, email, role_type, created_at, is_suspended, avatar_url')
      .eq('id', coachId)
      .eq('role_type', 'coach')
      .single();

    if (!coach) return NextResponse.json({ error: 'Coach non trouvé' }, { status: 404 });

    // Ses événements avec inscriptions
    const { data: events } = await serviceClient
      .from('events')
      .select('*, event_registrations(id, user_id, paid_at, amount_paid, created_at, users:user_id(full_name, email))')
      .eq('host_id', coachId)
      .order('start_date', { ascending: false });

    // Stats revenus
    const { data: registrations } = await serviceClient
      .from('event_registrations')
      .select('amount_paid, paid_at, event_id')
      .in('event_id', (events || []).map(e => e.id))
      .not('paid_at', 'is', null);

    const totalRevenue = (registrations || []).reduce((sum: number, r: { amount_paid: number | null }) => sum + (r.amount_paid || 0), 0);
    const totalRegistrations = (registrations || []).length;

    return NextResponse.json({
      coach,
      events: events || [],
      stats: {
        totalEvents: (events || []).length,
        totalRegistrations,
        totalRevenue,
        activeEvents: (events || []).filter((e: { status: string }) => e.status === 'upcoming').length,
      }
    });
  }

  // Liste de tous les coachs avec stats agrégées
  const { data: coaches } = await serviceClient
    .from('users')
    .select('id, full_name, email, role_type, created_at, is_suspended, avatar_url')
    .eq('role_type', 'coach')
    .order('created_at', { ascending: false });

  // Récupérer les événements de tous les coachs
  const coachIds = (coaches || []).map((c: { id: string }) => c.id);
  const { data: allEvents } = await serviceClient
    .from('events')
    .select('id, host_id, status, stripe_price_cents')
    .in('host_id', coachIds.length > 0 ? coachIds : ['none']);

  // Récupérer les inscriptions payées
  const eventIds = (allEvents || []).map((e: { id: string }) => e.id);
  const { data: allRegistrations } = await serviceClient
    .from('event_registrations')
    .select('event_id, amount_paid, paid_at')
    .in('event_id', eventIds.length > 0 ? eventIds : ['none'])
    .not('paid_at', 'is', null);

  // Mapper les stats par coach
  const coachesWithStats = (coaches || []).map((coach: { id: string }) => {
    const coachEvents = (allEvents || []).filter((e: { host_id: string }) => e.host_id === coach.id);
    const coachEventIds = coachEvents.map((e: { id: string }) => e.id);
    const coachRegs = (allRegistrations || []).filter((r: { event_id: string }) => coachEventIds.includes(r.event_id));
    const totalRevenue = coachRegs.reduce((sum: number, r: { amount_paid: number | null }) => sum + (r.amount_paid || 0), 0);

    return {
      ...coach,
      stats: {
        totalEvents: coachEvents.length,
        activeEvents: coachEvents.filter((e: { status: string }) => e.status === 'upcoming').length,
        totalRegistrations: coachRegs.length,
        totalRevenue,
      }
    };
  });

  return NextResponse.json({ coaches: coachesWithStats });
}

// PATCH /api/admin/coaches — Suspendre/réactiver un coach
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  if (!(await verifyAdmin(authUser.id))) {
    return NextResponse.json({ error: 'Réservé aux administrateurs' }, { status: 403 });
  }

  const body = await req.json();
  const { coach_id, action } = body;

  if (!coach_id) return NextResponse.json({ error: 'coach_id requis' }, { status: 400 });

  const serviceClient = getSupabaseAdmin();

  if (action === 'suspend') {
    const { error } = await serviceClient
      .from('users')
      .update({ is_suspended: true })
      .eq('id', coach_id)
      .eq('role_type', 'coach');

    if (error) return NextResponse.json({ error: 'Erreur suspension' }, { status: 500 });

    // Annuler tous ses événements à venir
    await serviceClient
      .from('events')
      .update({ status: 'cancelled' })
      .eq('host_id', coach_id)
      .eq('status', 'upcoming');

    return NextResponse.json({ success: true, message: 'Coach suspendu' });
  }

  if (action === 'reactivate') {
    const { error } = await serviceClient
      .from('users')
      .update({ is_suspended: false })
      .eq('id', coach_id)
      .eq('role_type', 'coach');

    if (error) return NextResponse.json({ error: 'Erreur réactivation' }, { status: 500 });
    return NextResponse.json({ success: true, message: 'Coach réactivé' });
  }

  if (action === 'remove') {
    // Repasser le coach en role_type 'candidate'
    const { error } = await serviceClient
      .from('users')
      .update({ role_type: 'candidate', is_suspended: false })
      .eq('id', coach_id)
      .eq('role_type', 'coach');

    if (error) return NextResponse.json({ error: 'Erreur suppression rôle coach' }, { status: 500 });

    // Annuler ses événements
    await serviceClient
      .from('events')
      .update({ status: 'cancelled' })
      .eq('host_id', coach_id)
      .eq('status', 'upcoming');

    return NextResponse.json({ success: true, message: 'Rôle coach retiré' });
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}
