import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { User, RoleType } from '@/types/database';

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

  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) {
    // NOTE: on ne fait PAS signOut() ici pour préserver les cookies de debug
    // Le signOut détruisait les preuves, empêchant le diagnostic
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
  const user = await requireUser();
  if (user.role !== 'admin' && user.role_type !== 'admin') {
    redirect('/dashboard');
  }
  return user;
}
