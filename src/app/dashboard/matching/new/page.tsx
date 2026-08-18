import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { MatchingForm } from './matching-form';

export const metadata = { title: 'Nouvelle fiche de poste — Matching IA — HUBClosing' };

export default async function NewMatchingPage() {
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

  return <MatchingForm />;
}
