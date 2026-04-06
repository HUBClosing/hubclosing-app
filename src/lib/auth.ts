import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@/types/database';

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  // If auth user exists but no DB row, auto-create with 'pending' role
  // This prevents redirect loops when the DB trigger didn't fire
  if (!user && authUser) {
    const { data: newUser, error } = await supabase
      .from('users')
      .upsert({
        id: authUser.id,
        email: authUser.email || '',
        role: 'pending',
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        avatar_url: authUser.user_metadata?.avatar_url || null,
      }, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      console.error('Failed to auto-create user row:', error);
      return null;
    }
    return newUser;
  }

  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) {
    redirect('/auth/login');
  }
  // If user hasn't completed onboarding, redirect there
  if (user.role === 'pending') {
    redirect('/onboarding');
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
