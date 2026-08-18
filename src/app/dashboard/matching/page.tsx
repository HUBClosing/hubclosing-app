import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { MatchingList } from './matching-list';

export const metadata = { title: 'Matching IA — HUBClosing' };

export default async function MatchingPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set() {},
        remove() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: userData } = await supabase
    .from('users')
    .select('role_type, active_role, tier')
    .eq('id', user.id)
    .single();

  if (!userData || (userData.role_type !== 'recruiter' && userData.role_type !== 'both' && userData.role_type !== 'admin')) {
    redirect('/dashboard');
  }

  return <MatchingList />;
}
