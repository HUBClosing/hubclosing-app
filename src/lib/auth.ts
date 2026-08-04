import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { User, RoleType } from '@/types/database';

const IMPERSONATE_COOKIE = 'hubclosing_impersonate';

/**
 * Vérifie si l'admin impersone un utilisateur.
 * Retourne { realUser, impersonatedUser } ou null.
 */
async function checkImpersonation(realUser: User): Promise<User | null> {
  // Seuls les admins peuvent impersoner
  if (realUser.role !== 'admin' && realUser.role_type !== 'admin') return null;

  const cookieStore = await cookies();
  const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value;
  if (!impersonateId || impersonateId === realUser.id) return null;

  // Récupérer le profil cible via service role (bypass RLS)
  const adminClient = getSupabaseAdmin();
  const { data: targetUser } = await adminClient
    .from('users')
    .select('*')
    .eq('id', impersonateId)
    .single();

  return targetUser || null;
}

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) return null;

  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  // Si erreur de requête, log et retourne null
  if (fetchError) {
    console.error('[getUser] fetch error:', fetchError.message);
    return null;
  }

  // Si auth user existe mais pas de profil DB, créer avec upsert
  if (!user) {
    await supabase
      .from('users')
      .upsert({
        id: authUser.id,
        email: authUser.email || '',
        role: 'pending',
        role_type: 'pending',
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        avatar_url: authUser.user_metadata?.avatar_url || null,
      }, { onConflict: 'id' });

    const { data: createdUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    return createdUser;
  }

  // Vérifier l'impersonation admin
  const impersonated = await checkImpersonation(user);
  if (impersonated) return impersonated;

  return user;
}

/**
 * Retourne le vrai user admin (pas l'impersoné) — pour les checks admin.
 */
export async function getRealUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) return null;

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  return user;
}

/**
 * Retourne les infos d'impersonation pour le banner.
 */
export async function getImpersonationInfo(): Promise<{ isImpersonating: boolean; realUser?: User; targetUser?: User }> {
  const realUser = await getRealUser();
  if (!realUser) return { isImpersonating: false };

  if (realUser.role !== 'admin' && realUser.role_type !== 'admin') {
    return { isImpersonating: false };
  }

  const cookieStore = await cookies();
  const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value;
  if (!impersonateId || impersonateId === realUser.id) {
    return { isImpersonating: false };
  }

  const adminClient = getSupabaseAdmin();
  const { data: targetUser } = await adminClient
    .from('users')
    .select('*')
    .eq('id', impersonateId)
    .single();

  if (!targetUser) return { isImpersonating: false };

  return { isImpersonating: true, realUser, targetUser };
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) {
    redirect('/auth/login');
  }
  return user;
}

/** Vérifie le role_type (nouveau système), avec fallback sur role (legacy) */
export async function requireRoleType(roleType: RoleType): Promise<User> {
  const user = await requireUser();
  const userRoleType = user.role_type || (user.role === 'manager' ? 'recruiter' : user.role === 'closer' ? 'candidate' : user.role);
  if (userRoleType !== roleType && userRoleType !== 'admin') {
    redirect('/dashboard');
  }
  return user;
}

/** Legacy — gardé pour rétrocompatibilité */
export async function requireRole(role: 'closer' | 'manager' | 'admin'): Promise<User> {
  const user = await requireUser();
  // Check both old role and new role_type
  const isAdmin = user.role === 'admin' || user.role_type === 'admin';
  if (isAdmin) return user;

  const roleMatch = user.role === role;
  const roleTypeMatch =
    (role === 'closer' && user.role_type === 'candidate') ||
    (role === 'manager' && user.role_type === 'recruiter');

  if (!roleMatch && !roleTypeMatch) {
    redirect('/dashboard');
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  // Pour les pages admin, toujours vérifier le VRAI user
  const user = await getRealUser();
  if (!user) {
    redirect('/auth/login');
  }
  if (user.role !== 'admin' && user.role_type !== 'admin') {
    redirect('/dashboard');
  }
  return user;
}
