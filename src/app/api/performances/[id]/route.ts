import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/performances/[id] — modifier une performance non vérifiée
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = params;

  // Vérifier ownership et non-vérifié
  const { data: existing } = await supabase
    .from('performance_records')
    .select('id, user_id, is_verified')
    .eq('id', id)
    .single();

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
  }
  if (existing.is_verified) {
    return NextResponse.json({ error: 'Impossible de modifier une performance vérifiée' }, { status: 403 });
  }

  const body = await req.json();
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

  const allowedFields = [
    'event_name', 'event_type', 'event_date',
    'calls_scheduled', 'calls_completed',
    'revenue_collected', 'revenue_invoiced',
    'no_shows', 'cancellations',
    'hos_name', 'hos_email', 'notes',
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (['calls_scheduled', 'calls_completed', 'no_shows', 'cancellations'].includes(field)) {
        updates[field] = parseInt(body[field]) || 0;
      } else if (['revenue_collected', 'revenue_invoiced'].includes(field)) {
        updates[field] = parseFloat(body[field]) || 0;
      } else {
        updates[field] = typeof body[field] === 'string' ? body[field].trim() || null : body[field];
      }
    }
  }

  const { data, error } = await supabase
    .from('performance_records')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ performance: data });
}

// DELETE /api/performances/[id] — supprimer une performance non vérifiée
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = params;

  const { data: existing } = await supabase
    .from('performance_records')
    .select('id, user_id, is_verified')
    .eq('id', id)
    .single();

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
  }
  if (existing.is_verified) {
    return NextResponse.json({ error: 'Impossible de supprimer une performance vérifiée' }, { status: 403 });
  }

  const { error } = await supabase
    .from('performance_records')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
