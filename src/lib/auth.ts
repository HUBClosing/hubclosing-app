import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@/types/database';

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
  // upsert évite les race conditions de doublon
  if (!user) {
    const { data: newUser, error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: authUser.id,
        email: authUser.email || null,
        role: 'pending',
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        avatar_url: authUser.user_metadata?.avatar_url || null,
      }, { onConflict: 'id', ignoreDuplicates: true })
      .select('*')
      .single();

    if (upsertError) {
      console.error('[getUser] upsert error:', upsertError.message);
      // Tenter une dernière lecture en cas de conflit
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();
      return existingUser;
    }
    return newUser;
  }

  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) {
    // Nettoyer la session invalide pour éviter une boucle de redirection
    // entre le middleware et cette fonction
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/auth/login');
  }
  return user;
}

export async function requireRole(role: 'closer' | 'manager' | 'admin'): Promise<User> {
  const user = await requireUser();
  if (user.role !== role && user.role !== 'admin') {
    redirect('/dashboard');
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== 'admin') {
    redirect('/dashboard');
  }
  return user;
}
