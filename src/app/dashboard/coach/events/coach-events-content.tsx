'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Plus, Users, Euro, Clock, ExternalLink, Video, MoreVertical } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  upcoming: { label: 'À venir', color: 'bg-green-100 text-green-700' },
  live: { label: 'En cours', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Terminé', color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-700' },
};

const TYPE_LABELS: Record<string, string> = {
  coaching: 'Coaching',
  webinaire: 'Webinaire',
  atelier: 'Atelier',
  networking: 'Networking',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface CoachEventsContentProps {
  events: any[];
}

export default function CoachEventsContent({ events }: CoachEventsContentProps) {
  const [filter, setFilter] = useState<string>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const filtered = filter === 'all'
    ? events
    : events.filter(e => e.status === filter);

  const stats = {
    total: events.length,
    upcoming: events.filter(e => e.status === 'upcoming').length,
    totalRegistrations: events.reduce((s, e) => s + (e.event_registrations?.[0]?.count || 0), 0),
    totalRevenue: events.reduce((s, e) => s + ((e.event_registrations?.[0]?.count || 0) * (e.price || 0)), 0),
  };

  async function handleCancel(eventId: string) {
    if (!confirm('Êtes-vous sûr de vouloir annuler cet événement ?')) return;
    setCancellingId(eventId);
    try {
      const res = await fetch(`/api/coach/events?event_id=${eventId}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.reload();
      }
    } catch {
      alert('Erreur lors de l\'annulation');
    }
    setCancellingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Mes événements</h1>
          <p className="text-gray-500 mt-1">Gérez vos événements de coaching</p>
        </div>
        <Link
          href="/dashboard/coach/events/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-amber text-brand-dark font-semibold rounded-lg hover:bg-brand-amber/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Créer un événement
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <Calendar className="h-5 w-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-brand-dark">{stats.total}</p>
          <p className="text-sm text-gray-500">Total événements</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <Clock className="h-5 w-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-brand-dark">{stats.upcoming}</p>
          <p className="text-sm text-gray-500">À venir</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <Users className="h-5 w-5 text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-brand-dark">{stats.totalRegistrations}</p>
          <p className="text-sm text-gray-500">Inscriptions</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <Euro className="h-5 w-5 text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-brand-dark">{stats.totalRevenue}€</p>
          <p className="text-sm text-gray-500">Revenus estimés</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'Tous' },
          { key: 'upcoming', label: 'À venir' },
          { key: 'live', label: 'En cours' },
          { key: 'completed', label: 'Terminés' },
          { key: 'cancelled', label: 'Annulés' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-brand-dark text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-1">Aucun événement</h3>
          <p className="text-gray-500 text-sm mb-4">Créez votre premier événement de coaching</p>
          <Link
            href="/dashboard/coach/events/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-amber text-brand-dark font-semibold rounded-lg hover:bg-brand-amber/90"
          >
            <Plus className="h-4 w-4" />
            Créer un événement
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(event => {
            const status = STATUS_LABELS[event.status] || STATUS_LABELS.upcoming;
            const regCount = event.event_registrations?.[0]?.count || 0;

            return (
              <div key={event.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Link href={`/dashboard/coach/events/${event.id}`} className="font-semibold text-brand-dark hover:text-brand-green transition-colors">
                        {event.title}
                      </Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {TYPE_LABELS[event.event_type] || event.event_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(event.start_date)} à {formatTime(event.start_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {regCount}{event.max_participants ? `/${event.max_participants}` : ''} inscrits
                      </span>
                      <span className="flex items-center gap-1">
                        <Euro className="h-4 w-4" />
                        {event.price > 0 ? `${event.price}€` : 'Gratuit'}
                      </span>
                      <span className="flex items-center gap-1">
                        {event.link_type === 'jitsi' ? (
                          <><Video className="h-4 w-4" /> Jitsi</>
                        ) : (
                          <><ExternalLink className="h-4 w-4" /> Lien externe</>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/dashboard/coach/events/${event.id}`}
                      className="px-3 py-1.5 text-sm bg-brand-dark text-white rounded-lg hover:bg-brand-dark/90"
                    >
                      Gérer
                    </Link>
                    {event.status === 'upcoming' && (
                      <button
                        onClick={() => handleCancel(event.id)}
                        disabled={cancellingId === event.id}
                        className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
