import { requireUser } from '@/lib/auth';
import { EventsContent } from './events-content';

export default async function EventsPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Coaching &amp; Événements</h1>
        <p className="text-gray-500 mt-1">Participez aux sessions de coaching, webinaires et networking</p>
      </div>

      <EventsContent user={user} />
    </div>
  );
}
