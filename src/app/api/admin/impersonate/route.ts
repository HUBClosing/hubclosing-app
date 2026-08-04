import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'hubclosing_impersonate';

/**
 * POST /api/admin/impersonate
 * Body: { userId: string }
 * Démarre l'impersonation — l'admin voit le dashboard comme cet utilisateur.
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier que le caller est admin
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const adminClient = getSupabaseAdmin();
    const { data: adminProfile } = await adminClient
      .from('users')
      .select('role, role_type')
      .eq('id', authUser.id)
      .single();

    if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role_type !== 'admin')) {
      return NextResponse.json({ error: 'Accès refusé — admin uniquement' }, { status: 403 });
    }

    // Valider le userId cible
    const body = await request.json();
    const { userId } = body;
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    // Vérifier que l'utilisateur cible existe
    const { data: targetUser } = await adminClient
      .from('users')
      .select('id, full_name, email, role, role_type')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    // Set le cookie d'impersonation
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 heure max
    });

    return NextResponse.json({
      success: true,
      impersonating: {
        id: targetUser.id,
        name: targetUser.full_name,
        email: targetUser.email,
        role: targetUser.role_type || targetUser.role,
      },
    });
  } catch (err) {
    console.error('[impersonate] error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/impersonate
 * Arrête l'impersonation — retour au compte admin.
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[impersonate] delete error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
