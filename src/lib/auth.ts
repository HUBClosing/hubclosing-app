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

  // If auth user exists but no DB row, create with 'pending' role
  // Uses insert (not upsert) to never overwrite an existing row
  if (!user && authUser) {
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        email: authUser.email || '',
        role: 'pending',
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        avatar_url: authUser.user_metadata?.avatar_url || null,
      })
      .select('*')
      .single();

    // If insert fails (duplicate), try to fetch the existing row
    if (error) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      return existingUser;
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
