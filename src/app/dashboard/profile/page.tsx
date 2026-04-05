import { requireUser } from '@/lib/auth';
import { ProfileContent } from './profile-content';
import { createClient } from '@/lib/supabase/server';

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createClient();

  let profile = null;
  if (user.role === 'closer') {
    const { data } = await supabase.from('closer_profiles').select('*').eq('user_id', user.id).single();
    profile = data;
  } else if (user.role === 'manager') {
    const { data } = await supabase.from('manager_profiles').select('*').eq('user_id', user.id).single();
    profile = data;
  }

  return <ProfileContent user={user} profile={profile} />;
}
