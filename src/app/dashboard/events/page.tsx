'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Badge, EmptyState, Button } from '@/components/ui';
import { Calendar, Clock, MapPin, Users, Video, GraduationCap, CheckCircle } from 'lucide-react';

const eventTypeLabels: Record<string, string> = {
  coaching: 'Coaching',
  webinaire: 'Webinaire',
  atelier: 'Atelier',
  networking: 'Networking',
};

const eventTypeColors: Record<string, string> = {
  coaching: 'bg-blue-100 text-blue-700',
  webinaire: 'bg-purple-100 text-purple-700',
  atelier: 'bg-green-100 text-green-700',
  networking: 'bg-amber-100 text-amber-700',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  });
}

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: eventsData }, { data: regsData }] = await Promise.all([
        supabase
          .from('events')
          .select('*, host:users!host_id(full_name, avatar_url)')
          .in('status', ['upcoming', 'live'])
          .order('start_date', { ascending: true }),
        supabase
          .from('event_registrations')
          .select('event_id')
          .eq('user_id', user.id)
          .eq('status', 'registered'),
      ]);

      setEvents(eventsData || []);
      setRegistrations(new Set((regsData || []).map((r: any) => r.event_id)));
      setLoading(false);
    }
    load();
  }, []);

  const handleRegister = async (eventId: string) => {
    const { error } = await supabase.from('event_registrations').insert({
      event_id: eventId,
      user_id: userId,
    });
    if (!error) {
      setRegistrations(prev => { const n = new Set(Array.from(prev)); n.add(eventId); return n; });
    }
  };

  const handleCancel = async (eventId: string) => {
    await supabase
      .from('event_registrations')
      .update({ status: 'cancelled' })
      .eq('event_id', eventId)
      .eq('user_id', userId);
    setRegistrations(prev => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
  };

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(e => e.event_type === filter);

  if (loading) return <div className="text-center py-12 text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Coaching &amp; \u00c9v\u00e9nements</h1>
        <p className="text-gray-500 mt-1">Participez aux sessions de coaching, webinaires et networking</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'coaching', 'webinaire', 'atelier', 'networking'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-brand-green text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Tous' : eventTypeLabels[f]}
          </button>
        ))}
      </div>

      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map(event => {
            const isRegistered = registrations.has(event.id);
            return (
              <Card key={event.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${eventTypeColors[event.event_type] || 'bg-gray-100 text-gray-600'}`}>
                      {eventTypeLabels[event.event_type] || event.event_type}
                    </span>
                    {event.price > 0 ? (
                      <span className="text-sm font-bold text-brand-dark">{event.price}\u20ac</span>
                    ) : (
                      <span className="text-sm font-medium text-green-600">Gratuit</span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-brand-dark mb-2">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                  )}

                  <div className="space-y-2 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(event.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(event.start_date)}{event.end_date ? ` - ${formatTime(event.end_date)}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.is_online ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                      <span>{event.is_online ? 'En ligne' : event.location || 'Pr\u00e9sentiel'}</span>
                    </div>
                    {event.host?.full_name && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        <span>Anim\u00e9 par {event.host.full_name}</span>
                      </div>
                    )}
                    {event.max_participants && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{event.max_participants} places max.</span>
                      </div>
                    )}
                  </div>

                  {isRegistered ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                        <CheckCircle className="h-4 w-4" /> Inscrit(e)
                      </span>
                      <button
                        onClick={() => handleCancel(event.id)}
                        className="ml-auto text-sm text-red-500 hover:underline"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <Button onClick={() => handleRegister(event.id)} className="w-full">
                      S&apos;inscrire
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="Aucun \u00e9v\u00e9nement disponible"
          description={filter !== 'all'
            ? `Aucun ${eventTypeLabels[filter]?.toLowerCase()} pr\u00e9vu prochainement.`
            : 'Les coaching, webinaires et \u00e9v\u00e9nements seront affich\u00e9s ici d\u00e8s qu\'ils seront programm\u00e9s.'
          }
        />
      )}
    </div>
  );
}
