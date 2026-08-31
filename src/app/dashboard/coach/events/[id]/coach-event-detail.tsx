'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, Users, Euro, Video, ExternalLink,
  Clock, Copy, CheckCircle, XCircle
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  upcoming: 'bg-green-100 text-green-700',
  live: 'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  upcoming: 'À venir',
  live: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

interface CoachEventDetailProps {
  event: any;
  registrations: any[];
}

export default function CoachEventDetail({ event, registrations }: CoachEventDetailProps) {
  const [copied, setCopied] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const activeRegistrations = registrations.filter(r => r.status !== 'cancelled');
  const revenue = activeRegistrations.length * (event.price || 0);

  async function copyMeetingUrl() {
    if (event.meeting_url) {
      await navigator.clipboard.writeText(event.meeting_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function updateStatus(newStatus: string) {
    setUpdatingStatus(true);
    try {
      const res = await fetch('/api/coach/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, status: newStatus }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch {
      alert('Erreur lors de la mise à jour');
    }
    setUpdatingStatus(false);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/coach/events" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-brand-dark">{event.title}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_COLORS[event.status]}`}>
              {STATUS_LABELS[event.status]}
            </span>
          </div>
          <p className="text-gray-500 mt-1">{formatDate(event.start_date)} à {formatTime(event.start_date)}</p>
        </div>
        {event.status === 'upcoming' && (
          <div className="flex gap-2">
            <button
              onClick={() => updateStatus('live')}
              disabled={updatingStatus}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              Démarrer
            </button>
            <button
              onClick={() => updateStatus('cancelled')}
              disabled={updatingStatus}
              className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 text-sm font-medium disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        )}
        {event.status === 'live' && (
          <button
            onClick={() => updateStatus('completed')}
            disabled={updatingStatus}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium disabled:opacity-50"
          >
            Terminer
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <Users className="h-5 w-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-brand-dark">{activeRegistrations.length}</p>
          <p className="text-sm text-gray-500">
            Inscrits{event.max_participants ? ` / ${event.max_participants}` : ''}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <Euro className="h-5 w-5 text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-brand-dark">{revenue}€</p>
          <p className="text-sm text-gray-500">Revenus</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <Calendar className="h-5 w-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-brand-dark">{event.price || 0}€</p>
          <p className="text-sm text-gray-500">Prix / personne</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          {event.link_type === 'jitsi' ? (
            <Video className="h-5 w-5 text-purple-500 mb-2" />
          ) : (
            <ExternalLink className="h-5 w-5 text-purple-500 mb-2" />
          )}
          <p className="text-sm font-bold text-brand-dark mt-1">{event.link_type === 'jitsi' ? 'Jitsi Meet' : 'Lien externe'}</p>
          <p className="text-sm text-gray-500">Visioconférence</p>
        </div>
      </div>

      {/* Meeting URL */}
      {event.meeting_url && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-brand-dark mb-3 flex items-center gap-2">
            <Video className="h-5 w-5" /> Lien de la visio
          </h3>
          <div className="flex items-center gap-3">
            <code className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 break-all">
              {event.meeting_url}
            </code>
            <button
              onClick={copyMeetingUrl}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-brand-dark text-white rounded-lg hover:bg-brand-dark/90"
            >
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
            <a
              href={event.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Rejoindre
            </a>
          </div>
        </div>
      )}

      {/* Description */}
      {event.description && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-brand-dark mb-2">Description</h3>
          <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
        </div>
      )}

      {/* Registrations */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-brand-dark mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" /> Participants ({activeRegistrations.length})
        </h3>

        {activeRegistrations.length === 0 ? (
          <p className="text-gray-500 text-center py-6">Aucun participant inscrit pour le moment.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {registrations.map(reg => (
              <div key={reg.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand-amber/20 flex items-center justify-center text-brand-dark font-bold">
                    {(reg.user?.full_name || reg.user?.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-brand-dark">{reg.user?.full_name || 'Anonyme'}</p>
                    <p className="text-sm text-gray-500">{reg.user?.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    reg.status === 'registered' ? 'bg-green-100 text-green-700' :
                    reg.status === 'attended' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {reg.status === 'registered' ? 'Inscrit' : reg.status === 'attended' ? 'Présent' : 'Annulé'}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(reg.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
