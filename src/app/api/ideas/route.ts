import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

// GET — liste des idées
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: ideas, error } = await supabase
    .from('ideas')
    .select('*, users:user_id(full_name, avatar_url)')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ideas: ideas || [] });
}

// POST — soumettre une idée
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, category } = body;

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: 'Titre et description requis' }, { status: 400 });
  }

  if (title.trim().length > 200) {
    return NextResponse.json({ error: 'Titre trop long (200 max)' }, { status: 400 });
  }

  if (description.trim().length > 2000) {
    return NextResponse.json({ error: 'Description trop longue (2000 max)' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ideas')
    .insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      category: category || 'suggestion',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ idea: data }, { status: 201 });
}
