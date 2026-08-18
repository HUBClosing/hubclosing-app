import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function createSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set() {},
        remove() {},
      },
    }
  );
}

// PATCH /api/matching/suggestions/[id] — mettre à jour le statut candidat
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await req.json();
  const newStatus = body.candidate_status;
  const validStatuses = ['unseen', 'interested', 'passed'];
  if (!newStatus || !validStatuses.includes(newStatus)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
  }

  // Vérifier que le résultat appartient au candidat
  const { data: result } = await supabase
    .from('matching_results')
    .select('id, candidate_id')
    .eq('id', params.id)
    .eq('candidate_id', user.id)
    .single();

  if (!result) {
    return NextResponse.json({ error: 'Résultat non trouvé' }, { status: 404 });
  }

  // Mettre à jour le statut candidat
  const { error: updateError } = await supabase
    .from('matching_results')
    .update({ candidate_status: newStatus })
    .eq('id', params.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
