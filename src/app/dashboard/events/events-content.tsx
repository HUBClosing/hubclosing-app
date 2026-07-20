'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Badge, EmptyState, Button } from '@/components/ui';
import { Calendar, Clock, MapPin, Users, Video, GraduationCap, CheckCircle, Lock, ArrowRight } from 'lucide-react';
import { canUserDo } from '@/types/database';
import type { User } from '@/types/database';
import Link from 'next/link';

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

/**
 * Mapping event_type → feature requise dans canUserDo
 * - coaching → 'upskill' (Élite uniquement)
 * - webinaire → 'masterclass' (Pro+)
 * - atelier, networking → accessible à tous (free inclus)
 */
const EVENT_REQUIRED_FEATURE: Record<string, string | null> = {
  coaching: 'upskill',
  webinaire: 'masterclass',
  atelier: null,
  networking: null,
};

const FEATURE_TIER_LABEL: Record<string, string> = {
  upskill: 'Élite',
  masterclass: 'Pro',
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

interface EventsContentProps {
  user: User;
}

export function EventsContent({ user }: EventsContentProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const [{ data: eventsData }, { data: regsData }] = await Promise.all([
        supabase
          .from('events')
          .select('*, host:users!host_id(full_name, avatar_url)')
          .in('status', ['upcoming', 'live'])
          .order('start_date', { ascending: true })
          .limit(100),
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
    setRegisteringId(eventId);
    const { error } = await supabase.from('event_registrations').insert({
      event_id: eventId,
      user_id: user.id,
    });
    if (!error) {
      setRegistrations(prev => {
        const next = new Set(Array.from(prev));
        next.add(eventId);
        return next;
      });
    }
    setRegisteringId(null);
  };

  const handleCancel = async (eventId: string) => {
    setRegisteringId(eventId);
    await supabase
      .from('event_registrations')
      .update({ status: 'cancelled' })
      .eq('event_id', eventId)
      .eq('user_id', user.id);
    setRegistrations(prev => {
      const next = new Set(Array.from(prev));
      next.delete(eventId);
      return next;
    });
    setRegisteringId(null);
  };

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(e => e.event_type === filter);

  if (loading) return <div className="text-center py-12 text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-6">
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
            const requiredFeature = EVENT_REQUIRED_FEATURE[event.event_type] || null;
            const isAdmin = user.role_type === 'admin';
            const hasAccess = isAdmin || !requiredFeature || canUserDo(user, requiredFeature);
            const requiredTierLabel = requiredFeature ? FEATURE_TIER_LABEL[requiredFeature] : null;

            return (
              <Card key={event.id} className={!hasAccess ? 'opacity-75' : ''}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${eventTypeColors[event.event_type] || 'bg-gray-100 text-gray-600'}`}>
                        {eventTypeLabels[event.event_type] || event.event_type}
                      </span>
                      {!hasAccess && (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-600 flex items-center gap-1">
                          <Lock className="h-3 w-3" /> {requiredTierLabel}+
                        </span>
                      )}
                    </div>
                    {event.price > 0 ? (
                      <span className="text-sm font-bold text-brand-dark">{event.price}€</span>
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
                      <span>{event.is_online ? 'En ligne' : event.location || 'Présentiel'}</span>
                    </div>
                    {event.host?.full_name && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        <span>Animé par {event.host.full_name}</span>
                      </div>
                    )}
                    {event.max_participants && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{event.max_participants} places max.</span>
                      </div>
                    )}
                  </div>

                  {/* CTA : inscription ou upgrade */}
                  {!hasAccess ? (
                    <Link
                      href="/dashboard/subscription"
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-white bg-brand-amber rounded-lg hover:bg-brand-amber/90 transition-colors"
                    >
                      <Lock className="h-4 w-4" />
                      Passer au plan {requiredTierLabel} pour accéder
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : isRegistered ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                        <CheckCircle className="h-4 w-4" /> Inscrit(e)
                      </span>
                      <button
                        onClick={() => handleCancel(event.id)}
                        disabled={registeringId === event.id}
                        className="ml-auto text-sm text-red-500 hover:underline disabled:opacity-50"
                      >
                        {registeringId === event.id ? 'Annulation...' : 'Annuler'}
                      </button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleRegister(event.id)}
                      disabled={registeringId === event.id}
                      className="w-full"
                    >
                      {registeringId === event.id ? 'Inscription...' : 'S\'inscrire'}
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
          title="Aucun événement disponible"
          description={filter !== 'all'
            ? `Aucun ${eventTypeLabels[filter]?.toLowerCase()} prévu prochainement.`
            : 'Les coaching, webinaires et événements seront affichés ici dès qu\'ils seront programmés.'
          }
        />
      )}
    </div>
  );
}
