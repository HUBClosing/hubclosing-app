import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { TrackingContent } from './tracking-content';

export default async function TrackingPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: stats } = await supabase
    .from('call_stats')
    .select('*')
    .eq('user_id', user.id)
    .order('event_date', { ascending: false });

  const { data: bookings } = await supabase
    .from('coaching_bookings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <TrackingContent
      user={user}
      initialStats={stats || []}
      coachingBookings={bookings || []}
    />
  );
}
