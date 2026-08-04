import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin, createNotification } from '@/lib/supabase/admin';

/**
 * POST /api/coaching
 * Demande de coaching — enregistre la fiche pré-RDV.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { current_cash_per_call, main_challenge, experience_months, niche, goals, availability } = body;

    // Validation minimale
    if (!main_challenge?.trim()) {
      return NextResponse.json({ error: 'Décris ton principal challenge' }, { status: 400 });
    }

    const { data: booking, error } = await supabase
      .from('coaching_bookings')
      .insert({
        user_id: authUser.id,
        status: 'pending',
        current_cash_per_call: current_cash_per_call || null,
        main_challenge: main_challenge.trim(),
        experience_months: experience_months || null,
        niche: niche?.trim() || null,
        goals: goals?.trim() || null,
        availability: availability?.trim() || null,
        price: 0, // sera défini après confirmation
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notification à l'admin (Céline)
    const adminClient = getSupabaseAdmin();
    const { data: admins } = await adminClient
      .from('users')
      .select('id')
      .or('role.eq.admin,role_type.eq.admin');

    if (admins) {
      for (const admin of admins) {
        await createNotification({
          user_id: admin.id,
          type: 'system',
          title: '🎯 Nouvelle demande de coaching',
          body: `${authUser.email} souhaite un coaching individuel (cash/call: ${current_cash_per_call || 'N/A'}€)`,
          link: '/dashboard/admin/coaching',
          metadata: { booking_id: booking.id, user_email: authUser.email },
        });
      }
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    console.error('[coaching] POST error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * GET /api/coaching
 * Récupère les demandes de coaching de l'utilisateur connecté.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: bookings, error } = await supabase
      .from('coaching_bookings')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookings });
  } catch (err) {
    console.error('[coaching] GET error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
