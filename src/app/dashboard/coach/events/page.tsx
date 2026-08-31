import { requireUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CoachEventsContent from './coach-events-content';

export default async function CoachEventsPage() {
  const user = await requireUser();

  // Seuls coach et admin peuvent accéder
  if (user.role_type !== 'coach' && user.role_type !== 'admin' && user.role !== 'admin') {
    redirect('/dashboard');
  }

  const supabase = await createClient();
  const { data: events } = await supabase
    .from('events')
    .select('*, event_registrations(count)')
    .eq('host_id', user.id)
    .order('start_date', { ascending: false });

  return <CoachEventsContent events={events || []} />;
}
