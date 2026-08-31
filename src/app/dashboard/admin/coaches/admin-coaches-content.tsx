'use client';

import { useState, useEffect } from 'react';
import {
  UserPlus, Mail, Clock, CheckCircle, XCircle, Copy, GraduationCap,
  Eye, Ban, RefreshCw, Trash2, Calendar, DollarSign, Users,
  TrendingUp, ChevronLeft, BarChart3, AlertTriangle, ExternalLink
} from 'lucide-react';

interface CoachStats {
  totalEvents: number;
  activeEvents: number;
  totalRegistrations: number;
  totalRevenue: number;
}

interface CoachWithStats {
  id: string;
  full_name: string | null;
  email: string;
  role_type: string;
  created_at: string;
  is_suspended: boolean;
  avatar_url: string | null;
  stats: CoachStats;
}

interface EventRegistration {
  id: string;
  user_id: string;
  paid_at: string | null;
  amount_paid: number;
  created_at: string;
  users: { full_name: string | null; email: string } | null;
}

interface CoachEvent {
  id: string;
  title: string;
  event_type: string;
  start_date: string;
  end_date: string | null;
  status: string;
  price: number;
  stripe_price_cents: number;
  max_participants: number | null;
  meeting_url: string | null;
  link_type: string;
  jitsi_room_id: string | null;
  description: string | null;
  event_registrations: EventRegistration[];
}

interface AdminCoachesContentProps {
  coaches: any[];
  invitations: any[];
}

type Tab = 'overview' | 'invitations';

export default function AdminCoachesContent({ coaches: initialCoaches, invitations }: AdminCoachesContentProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [coachesWithStats, setCoachesWithStats] = useState<CoachWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoach, setSelectedCoach] = useState<string | null>(null);
  const [coachDetail, setCoachDetail] = useState<{ coach: any; events: CoachEvent[]; stats: CoachStats } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Invitation form
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastUrl, setLastUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ coachId: string; action: string; name: string } | null>(null);

  useEffect(() => {
    loadCoaches();
  }, []);

  async function loadCoaches() {
    try {
      const res = await fetch('/api/admin/coaches');
      if (res.ok) {
        const data = await res.json();
        setCoachesWithStats(data.coaches || []);
      }
    } catch {
      // Fallback aux données initiales
      setCoachesWithStats(initialCoaches.map(c => ({
        ...c,
        is_suspended: c.is_suspended || false,
        stats: { totalEvents: 0, activeEvents: 0, totalRegistrations: 0, totalRevenue: 0 }
      })));
    }
    setLoading(false);
  }

  async function loadCoachDetail(coachId: string) {
    setDetailLoading(true);
    setSelectedCoach(coachId);
    try {
      const res = await fetch(`/api/admin/coaches?coach_id=${coachId}`);
      if (res.ok) {
        const data = await res.json();
        setCoachDetail(data);
      }
    } catch {
      setCoachDetail(null);
    }
    setDetailLoading(false);
  }

  async function handleAction(coachId: string, action: string) {
    setActionLoading(coachId);
    try {
      const res = await fetch('/api/admin/coaches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coach_id: coachId, action }),
      });
      if (res.ok) {
        await loadCoaches();
        if (selectedCoach === coachId) {
          await loadCoachDetail(coachId);
        }
      }
    } catch {}
    setActionLoading(null);
    setConfirmAction(null);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLastUrl('');

    if (!email.trim() || !email.includes('@')) {
      setError('Email invalide');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/invite-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur');
        setSending(false);
        return;
      }

      setSuccess(`Invitation envoyée à ${email}`);
      setLastUrl(data.invitation.register_url);
      setEmail('');
      setName('');
      setTimeout(() => window.location.reload(), 2000);
    } catch {
      setError('Erreur réseau');
    }
    setSending(false);
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatPrice(cents: number) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatDateTime(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    upcoming: { label: 'À venir', color: 'bg-blue-100 text-blue-700' },
    ongoing: { label: 'En cours', color: 'bg-green-100 text-green-700' },
    completed: { label: 'Terminé', color: 'bg-gray-100 text-gray-700' },
    cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-700' },
  };

  // Total stats
  const globalStats = {
    totalCoaches: coachesWithStats.length,
    activeCoaches: coachesWithStats.filter(c => !c.is_suspended).length,
    totalEvents: coachesWithStats.reduce((s, c) => s + c.stats.totalEvents, 0),
    totalRevenue: coachesWithStats.reduce((s, c) => s + c.stats.totalRevenue, 0),
    totalRegistrations: coachesWithStats.reduce((s, c) => s + c.stats.totalRegistrations, 0),
  };

  // === COACH DETAIL VIEW ===
  if (selectedCoach && coachDetail) {
    const { coach, events, stats } = coachDetail;
    return (
      <div className="space-y-6">
        {/* Back button + header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setSelectedCoach(null); setCoachDetail(null); }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-dark transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Retour
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-brand-amber/20 flex items-center justify-center text-brand-dark text-xl font-bold">
              {coach.avatar_url ? (
                <img src={coach.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                (coach.full_name || coach.email)[0].toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brand-dark">{coach.full_name || 'Sans nom'}</h1>
              <p className="text-gray-500">{coach.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${coach.is_suspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {coach.is_suspended ? 'Suspendu' : 'Actif'}
                </span>
                <span className="text-xs text-gray-400">Inscrit le {formatDate(coach.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {coach.is_suspended ? (
              <button
                onClick={() => handleAction(coach.id, 'reactivate')}
                disabled={actionLoading === coach.id}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" /> Réactiver
              </button>
            ) : (
              <button
                onClick={() => setConfirmAction({ coachId: coach.id, action: 'suspend', name: coach.full_name || coach.email })}
                disabled={actionLoading === coach.id}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
              >
                <Ban className="h-4 w-4" /> Suspendre
              </button>
            )}
            <button
              onClick={() => setConfirmAction({ coachId: coach.id, action: 'remove', name: coach.full_name || coach.email })}
              disabled={actionLoading === coach.id}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> Retirer le rôle
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Calendar className="h-4 w-4" /> Événements
            </div>
            <p className="text-2xl font-bold text-brand-dark">{stats.totalEvents}</p>
            <p className="text-xs text-gray-400">{stats.activeEvents} à venir</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Users className="h-4 w-4" /> Inscriptions
            </div>
            <p className="text-2xl font-bold text-brand-dark">{stats.totalRegistrations}</p>
            <p className="text-xs text-gray-400">participants payants</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <DollarSign className="h-4 w-4" /> Revenus
            </div>
            <p className="text-2xl font-bold text-green-600">{formatPrice(stats.totalRevenue)}</p>
            <p className="text-xs text-gray-400">total généré</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <TrendingUp className="h-4 w-4" /> Panier moyen
            </div>
            <p className="text-2xl font-bold text-brand-dark">
              {stats.totalRegistrations > 0 ? formatPrice(stats.totalRevenue / stats.totalRegistrations) : '—'}
            </p>
            <p className="text-xs text-gray-400">par inscription</p>
          </div>
        </div>

        {/* Events list */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand-amber" />
            Événements ({events.length})
          </h2>

          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-6">Aucun événement créé.</p>
          ) : (
            <div className="space-y-3">
              {events.map(event => {
                const st = statusLabels[event.status] || { label: event.status, color: 'bg-gray-100 text-gray-700' };
                const regCount = event.event_registrations?.length || 0;
                const revenue = (event.event_registrations || []).reduce((s, r) => s + (r.amount_paid || 0), 0);

                return (
                  <div key={event.id} className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-brand-dark">{event.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                          {event.link_type === 'jitsi' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Jitsi</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDateTime(event.start_date)}
                          {event.event_type && ` • ${event.event_type}`}
                          {event.max_participants && ` • Max ${event.max_participants} places`}
                        </p>
                        {event.description && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-1">{event.description}</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-brand-dark">
                          {event.stripe_price_cents > 0 ? formatPrice(event.stripe_price_cents) : 'Gratuit'}
                        </p>
                        <p className="text-sm text-gray-500">{regCount} inscrit{regCount !== 1 ? 's' : ''}</p>
                        {revenue > 0 && (
                          <p className="text-sm text-green-600 font-medium">{formatPrice(revenue)}</p>
                        )}
                      </div>
                    </div>

                    {/* Inscrits */}
                    {regCount > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-400 mb-2">INSCRITS</p>
                        <div className="grid grid-cols-2 gap-2">
                          {event.event_registrations.slice(0, 6).map(reg => (
                            <div key={reg.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-1.5">
                              <span className="text-gray-700 truncate">
                                {reg.users?.full_name || reg.users?.email || 'Utilisateur'}
                              </span>
                              {reg.paid_at && (
                                <span className="text-xs text-green-600 font-medium ml-2">
                                  {formatPrice(reg.amount_paid)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        {regCount > 6 && (
                          <p className="text-xs text-gray-400 mt-2">+{regCount - 6} autres inscrits</p>
                        )}
                      </div>
                    )}

                    {/* Lien visio */}
                    {event.meeting_url && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <a
                          href={event.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-3 w-3" /> {event.meeting_url}
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirm action modal */}
        {confirmAction && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="font-semibold text-brand-dark text-lg">
                  {confirmAction.action === 'suspend' ? 'Suspendre ce coach ?' : 'Retirer le rôle coach ?'}
                </h3>
              </div>
              <p className="text-gray-600 mb-1">
                <strong>{confirmAction.name}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                {confirmAction.action === 'suspend'
                  ? 'Le coach ne pourra plus accéder à son dashboard ni créer d\'événements. Ses événements à venir seront annulés.'
                  : 'Le coach perdra définitivement son rôle et redeviendra un simple candidat. Ses événements à venir seront annulés.'
                }
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleAction(confirmAction.coachId, confirmAction.action)}
                  disabled={actionLoading === confirmAction.coachId}
                  className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading === confirmAction.coachId ? 'En cours...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // === MAIN VIEW ===
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Manager Coachs</h1>
          <p className="text-gray-500 mt-1">Gérez les accès coachs, suivez leurs stats et revenus</p>
        </div>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <GraduationCap className="h-4 w-4" /> Coachs
          </div>
          <p className="text-2xl font-bold text-brand-dark">{globalStats.totalCoaches}</p>
          <p className="text-xs text-gray-400">{globalStats.activeCoaches} actifs</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Calendar className="h-4 w-4" /> Événements
          </div>
          <p className="text-2xl font-bold text-brand-dark">{globalStats.totalEvents}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="h-4 w-4" /> Inscriptions
          </div>
          <p className="text-2xl font-bold text-brand-dark">{globalStats.totalRegistrations}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <DollarSign className="h-4 w-4" /> Revenus
          </div>
          <p className="text-2xl font-bold text-green-600">{formatPrice(globalStats.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Mail className="h-4 w-4" /> Invitations
          </div>
          <p className="text-2xl font-bold text-brand-dark">{invitations.length}</p>
          <p className="text-xs text-gray-400">{invitations.filter(i => !i.used_at && new Date(i.expires_at) > new Date()).length} en attente</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('overview')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'overview' ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" /> Coachs ({coachesWithStats.length})</span>
        </button>
        <button
          onClick={() => setTab('invitations')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'invitations' ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> Invitations ({invitations.length})</span>
        </button>
      </div>

      {/* TAB: OVERVIEW */}
      {tab === 'overview' && (
        <>
          {/* Invite form (always visible) */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-brand-dark mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-brand-amber" />
              Créer un accès coach
            </h2>

            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nom du coach"
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
              />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email du coach"
                required
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
              />
              <button
                type="submit"
                disabled={sending}
                className="px-6 py-2.5 bg-brand-amber text-brand-dark font-bold rounded-lg hover:bg-brand-amber/90 disabled:opacity-50 whitespace-nowrap"
              >
                {sending ? 'Envoi...' : 'Envoyer l\'invitation'}
              </button>
            </form>

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            {success && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                <p>{success}</p>
                {lastUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 text-xs bg-white px-2 py-1 rounded border break-all">{lastUrl}</code>
                    <button
                      onClick={() => copyUrl(lastUrl)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-800"
                    >
                      {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? 'Copié' : 'Copier'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Coaches list */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-brand-dark mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-green-600" />
              Coachs ({coachesWithStats.length})
            </h2>

            {loading ? (
              <div className="text-center py-8 text-gray-400">Chargement...</div>
            ) : coachesWithStats.length === 0 ? (
              <p className="text-gray-500 text-center py-6">Aucun coach inscrit. Envoyez une invitation ci-dessus.</p>
            ) : (
              <div className="space-y-2">
                {coachesWithStats.map(coach => (
                  <div
                    key={coach.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => loadCoachDetail(coach.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-brand-amber/20 flex items-center justify-center text-brand-dark font-bold shrink-0">
                        {coach.avatar_url ? (
                          <img src={coach.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" />
                        ) : (
                          (coach.full_name || coach.email)[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-brand-dark">{coach.full_name || 'Sans nom'}</p>
                        <p className="text-sm text-gray-500">{coach.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Mini stats */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1" title="Événements">
                          <Calendar className="h-3.5 w-3.5" /> {coach.stats.totalEvents}
                        </span>
                        <span className="flex items-center gap-1" title="Inscrits">
                          <Users className="h-3.5 w-3.5" /> {coach.stats.totalRegistrations}
                        </span>
                        <span className="flex items-center gap-1 text-green-600 font-medium" title="Revenus">
                          <DollarSign className="h-3.5 w-3.5" /> {formatPrice(coach.stats.totalRevenue)}
                        </span>
                      </div>

                      {/* Status badge */}
                      <span className={`text-xs px-2.5 py-1 rounded-full ${coach.is_suspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {coach.is_suspended ? 'Suspendu' : 'Actif'}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => loadCoachDetail(coach.id)}
                          className="p-2 text-gray-400 hover:text-brand-dark rounded-lg hover:bg-gray-100"
                          title="Voir le détail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {coach.is_suspended ? (
                          <button
                            onClick={() => handleAction(coach.id, 'reactivate')}
                            disabled={actionLoading === coach.id}
                            className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50"
                            title="Réactiver"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmAction({ coachId: coach.id, action: 'suspend', name: coach.full_name || coach.email })}
                            disabled={actionLoading === coach.id}
                            className="p-2 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50"
                            title="Suspendre"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB: INVITATIONS */}
      {tab === 'invitations' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Historique des invitations ({invitations.length})
          </h2>

          {invitations.length === 0 ? (
            <p className="text-gray-500 text-center py-6">Aucune invitation envoyée.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {invitations.map(inv => {
                const isUsed = !!inv.used_at;
                const isExpired = !isUsed && new Date(inv.expires_at) < new Date();
                const isPending = !isUsed && !isExpired;
                const registerUrl = `${window.location.origin}/auth/coach-register/${inv.token}`;

                return (
                  <div key={inv.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-brand-dark">{inv.email}</p>
                      <p className="text-xs text-gray-400">
                        Envoyée le {formatDate(inv.created_at)}
                        {inv.expires_at && ` • Expire le ${formatDate(inv.expires_at)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <button
                          onClick={() => copyUrl(registerUrl)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-brand-dark bg-gray-100 hover:bg-gray-200 rounded"
                          title="Copier le lien d'inscription"
                        >
                          <Copy className="h-3 w-3" /> Copier lien
                        </button>
                      )}
                      {isUsed && (
                        <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3" /> Utilisée
                        </span>
                      )}
                      {isExpired && (
                        <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                          <XCircle className="h-3 w-3" /> Expirée
                        </span>
                      )}
                      {isPending && (
                        <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                          <Clock className="h-3 w-3" /> En attente
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirm action modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-brand-dark text-lg">
                {confirmAction.action === 'suspend' ? 'Suspendre ce coach ?' : 'Retirer le rôle coach ?'}
              </h3>
            </div>
            <p className="text-gray-600 mb-1"><strong>{confirmAction.name}</strong></p>
            <p className="text-sm text-gray-500 mb-6">
              {confirmAction.action === 'suspend'
                ? 'Le coach ne pourra plus accéder à son dashboard. Ses événements à venir seront annulés.'
                : 'Le coach perdra définitivement son rôle. Ses événements à venir seront annulés.'
              }
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Annuler
              </button>
              <button
                onClick={() => handleAction(confirmAction.coachId, confirmAction.action)}
                disabled={actionLoading === confirmAction.coachId}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === confirmAction.coachId ? 'En cours...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
