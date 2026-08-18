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

// PATCH /api/matching/results/[id] — mettre à jour le statut d'un résultat
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
  const newStatus = body.status;
  const validStatuses = ['pending', 'liked', 'passed', 'contacted'];
  if (!newStatus || !validStatuses.includes(newStatus)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
  }

  // Vérifier que le résultat existe et appartient à une fiche du recruteur
  const { data: result } = await supabase
    .from('matching_results')
    .select('id, fiche_id')
    .eq('id', params.id)
    .single();

  if (!result) {
    return NextResponse.json({ error: 'Résultat non trouvé' }, { status: 404 });
  }

  // Vérifier que la fiche appartient au recruteur (via RLS, mais double-check)
  const { data: fiche } = await supabase
    .from('matching_fiches')
    .select('id')
    .eq('id', result.fiche_id)
    .eq('recruiter_id', user.id)
    .single();

  if (!fiche) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  // Mettre à jour le statut
  const { error: updateError } = await supabase
    .from('matching_results')
    .update({ status: newStatus })
    .eq('id', params.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
