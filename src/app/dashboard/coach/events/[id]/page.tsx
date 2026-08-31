import { requireUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CoachEventDetail from './coach-event-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CoachEventDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();

  if (user.role_type !== 'coach' && user.role_type !== 'admin' && user.role !== 'admin') {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('host_id', user.id)
    .single();

  if (!event) {
    redirect('/dashboard/coach/events');
  }

  const { data: registrations } = await supabase
    .from('event_registrations')
    .select('*, user:users!user_id(id, full_name, email, avatar_url)')
    .eq('event_id', id)
    .order('created_at', { ascending: false });

  return <CoachEventDetail event={event} registrations={registrations || []} />;
}
