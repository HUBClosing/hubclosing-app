import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/performances — lister les performances du candidat connecté
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { data, error } = await supabase
    .from('performance_records')
    .select('*')
    .eq('user_id', user.id)
    .order('event_date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ performances: data });
}

// POST /api/performances — créer un nouveau record de performance
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  // Vérifier le tier
  const { data: userData } = await supabase
    .from('users')
    .select('tier')
    .eq('id', user.id)
    .single();

  const tierOrder: Record<string, number> = { free: 0, starter: 1, pro: 2, elite: 3 };
  if ((tierOrder[userData?.tier || 'free'] || 0) < 1) {
    return NextResponse.json({ error: 'Abonnement Starter requis' }, { status: 403 });
  }

  const body = await req.json();
  const {
    event_name, event_type, event_date,
    calls_scheduled, calls_completed,
    revenue_collected, revenue_invoiced,
    no_shows, cancellations,
    hos_name, hos_email, notes,
  } = body;

  // Validation
  if (!event_name?.trim() || !event_type || !event_date || !hos_name?.trim()) {
    return NextResponse.json(
      { error: 'Champs requis : nom événement, type, date, nom du HOS' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('performance_records')
    .insert({
      user_id: user.id,
      event_name: event_name.trim(),
      event_type,
      event_date,
      calls_scheduled: parseInt(calls_scheduled) || 0,
      calls_completed: parseInt(calls_completed) || 0,
      revenue_collected: parseFloat(revenue_collected) || 0,
      revenue_invoiced: parseFloat(revenue_invoiced) || 0,
      no_shows: parseInt(no_shows) || 0,
      cancellations: parseInt(cancellations) || 0,
      hos_name: hos_name.trim(),
      hos_email: hos_email?.trim() || null,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ performance: data }, { status: 201 });
}
