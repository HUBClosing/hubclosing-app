import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { ProfileContent } from './profile-content';
import type { Profile } from '@/types/database';

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createClient();

  // Charger le profil depuis la table profiles (créer si inexistant)
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile) {
    const { data: created } = await supabase
      .from('profiles')
      .insert({ user_id: user.id })
      .select('*')
      .single();
    profile = created;
  }

  return <ProfileContent user={user} profile={profile as Profile} />;
}
