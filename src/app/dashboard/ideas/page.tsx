import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { IdeasContent } from './ideas-content';

export const metadata = {
  title: 'Boîte à idées — HUBClosing',
};

export default async function IdeasPage() {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: ideas } = await supabase
    .from('ideas')
    .select('*, users:user_id(full_name, avatar_url)')
    .order('created_at', { ascending: false });

  return <IdeasContent ideas={ideas || []} currentUserId={user.id} />;
}
