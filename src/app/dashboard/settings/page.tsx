import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SettingsContent } from './settings-content';
import type { Profile } from '@/types/database';

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  // Fetch ou créer le profil
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // Si pas de profil, en créer un
  if (!profile) {
    const { data: created } = await supabase
      .from('profiles')
      .insert({ user_id: user.id })
      .select('*')
      .single();
    profile = created;
  }

  return <SettingsContent user={user} profile={profile as Profile} />;
}
