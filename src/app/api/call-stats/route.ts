import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/call-stats?userId=xxx
 * Récupère les stats de calls d'un utilisateur.
 * Sans userId → stats de l'utilisateur connecté.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = request.nextUrl.searchParams.get('userId') || authUser.id;

    const { data: stats, error } = await supabase
      .from('call_stats')
      .select('*')
      .eq('user_id', userId)
      .order('event_date', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calcul des métriques agrégées
    const totalCalls = stats.reduce((sum, s) => sum + s.total_calls, 0);
    const totalEffective = stats.reduce((sum, s) => sum + (s.effective_calls || 0), 0);
    const totalRevenue = stats.reduce((sum, s) => sum + Number(s.total_revenue), 0);
    const avgCashPerCall = totalEffective > 0 ? totalRevenue / totalEffective : 0;
    const bestCashPerCall = stats.length > 0
      ? Math.max(...stats.map(s => Number(s.cash_per_call) || 0))
      : 0;

    return NextResponse.json({
      stats,
      aggregated: {
        total_events: stats.length,
        total_calls: totalCalls,
        total_effective_calls: totalEffective,
        total_revenue: totalRevenue,
        average_cash_per_call: Math.round(avgCashPerCall * 100) / 100,
        best_cash_per_call: Math.round(bestCashPerCall * 100) / 100,
      },
    });
  } catch (err) {
    console.error('[call-stats] GET error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/call-stats
 * Ajoute une entrée de stats de calls.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { event_type, event_name, event_date, total_calls, ns_count, cancelled_count, total_revenue, notes } = body;

    // Validation
    if (!event_type || !['challenge', 'webinaire', 've'].includes(event_type)) {
      return NextResponse.json({ error: 'Type d\'event invalide (challenge, webinaire, ve)' }, { status: 400 });
    }
    if (!event_name?.trim()) {
      return NextResponse.json({ error: 'Nom de l\'event requis' }, { status: 400 });
    }
    if (!event_date) {
      return NextResponse.json({ error: 'Date de l\'event requise' }, { status: 400 });
    }
    if (typeof total_calls !== 'number' || total_calls < 0) {
      return NextResponse.json({ error: 'Nombre de calls invalide' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('call_stats')
      .insert({
        user_id: authUser.id,
        event_type,
        event_name: event_name.trim(),
        event_date,
        total_calls: total_calls || 0,
        ns_count: ns_count || 0,
        cancelled_count: cancelled_count || 0,
        total_revenue: total_revenue || 0,
        notes: notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ stat: data }, { status: 201 });
  } catch (err) {
    console.error('[call-stats] POST error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/call-stats?id=xxx
 * Supprime une entrée de stats.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const { error } = await supabase
      .from('call_stats')
      .delete()
      .eq('id', id)
      .eq('user_id', authUser.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[call-stats] DELETE error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
