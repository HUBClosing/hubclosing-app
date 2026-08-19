'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui';
import {
  ArrowLeft, Calendar, Users, DollarSign, Phone, Plus,
  TrendingUp, Zap, Search, Mail, X, Trash2,
  BarChart3, UserPlus, Save, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { CrmEventType, CrmEventStatus, EventAssignmentStatus } from '@/types/database';
import {
  CRM_EVENT_TYPE_LABELS,
  CRM_EVENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_LABELS,
} from '@/types/database';

interface EventDetail {
  id: string;
  title: string;
  event_type: CrmEventType;
  status: CrmEventStatus;
  start_date: string;
  end_date: string | null;
  description: string | null;
  notes: string | null;
  offer: { id: string; title: string; niche: string | null; offer_type: string | null } | null;
  assignments: AssignmentWithPerf[];
}

interface AssignmentWithPerf {
  id: string;
  closer_id: string | null;
  closer_name: string;
  closer_email: string | null;
  status: EventAssignmentStatus;
  closer: { id: string; full_name: string; email: string; avatar_url: string | null } | null;
  performances: PerfEntry[];
}

interface PerfEntry {
  id: string;
  performance_date: string;
  calls_scheduled: number;
  calls_completed: number;
  revenue_collected: number;
  revenue_invoiced: number;
  no_shows: number;
  cancellations: number;
  notes: string | null;
}

interface SearchResult {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  niches: string[] | null;
}

function computeCloserStats(perfs: PerfEntry[]) {
  let totalScheduled = 0, totalCompleted = 0, totalRevenue = 0;
  let totalInvoiced = 0, totalNS = 0, totalCancel = 0;

  for (const p of perfs) {
    totalScheduled += p.calls_scheduled;
    totalCompleted += p.calls_completed;
    totalRevenue += Number(p.revenue_collected);
    totalInvoiced += Number(p.revenue_invoiced);
    totalNS += p.no_shows;
    totalCancel += p.cancellations;
  }

  const effective = Math.max(0, totalCompleted - totalNS - totalCancel);
  const cashPerCall = effective > 0 ? totalRevenue / effective : 0;

  return { totalScheduled, totalCompleted, totalRevenue, totalInvoiced, totalNS, totalCancel, effective, cashPerCall };
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventDetail | null>(null);

  // Formulaire ajout performance
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [perfDate, setPerfDate] = useState(new Date().toISOString().slice(0, 10));
  const [perfCalls, setPerfCalls] = useState(0);
  const [perfCompleted, setPerfCompleted] = useState(0);
  const [perfRevenue, setPerfRevenue] = useState(0);
  const [perfInvoiced, setPerfInvoiced] = useState(0);
  const [perfNS, setPerfNS] = useState(0);
  const [perfCancel, setPerfCancel] = useState(0);
  const [perfNotes, setPerfNotes] = useState('');
  const [savingPerf, setSavingPerf] = useState(false);

  // Ajout closer
  const [showAddCloser, setShowAddCloser] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showExternalForm, setShowExternalForm] = useState(false);
  const [externalName, setExternalName] = useState('');
  const [externalEmail, setExternalEmail] = useState('');

  // Toggle détails par closer
  const [expandedCloser, setExpandedCloser] = useState<string | null>(null);

  // Edition statut
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<CrmEventStatus>('active');

  const loadEvent = useCallback(async () => {
    const res = await fetch(`/api/crm/events/${eventId}`);
    if (res.ok) {
      const data = await res.json();
      setEvent(data);
      setNewStatus(data.status);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { loadEvent(); }, [loadEvent]);

  // Recherche closers
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/crm/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        const existingIds = new Set(
          (event?.assignments || [])
            .filter(a => a.status !== 'removed')
            .map(a => a.closer_id)
            .filter(Boolean)
        );
        setSearchResults(data.filter((u: SearchResult) => !existingIds.has(u.id)));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, event]);

  const assignCloser = async (closerId: string, name: string, email: string) => {
    const res = await fetch(`/api/crm/events/${eventId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ closer_id: closerId, closer_name: name, closer_email: email }),
    });
    if (res.ok) {
      setSearchQuery('');
      setSearchResults([]);
      loadEvent();
    } else {
      const err = await res.json();
      alert(err.error || 'Erreur');
    }
  };

  const inviteExternal = async () => {
    if (!externalName.trim() || !externalEmail.trim()) return;
    const res = await fetch('/api/crm/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId,
        closer_name: externalName.trim(),
        closer_email: externalEmail.trim(),
      }),
    });
    if (res.ok) {
      setExternalName('');
      setExternalEmail('');
      setShowExternalForm(false);
      loadEvent();
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    if (!confirm('Retirer ce closer de l\'événement ?')) return;
    await fetch(`/api/crm/events/${eventId}/assign?assignment_id=${assignmentId}`, { method: 'DELETE' });
    loadEvent();
  };

  const addPerformance = async () => {
    if (!selectedAssignment || !perfDate) return;
    setSavingPerf(true);

    const res = await fetch(`/api/crm/events/${eventId}/performance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignment_id: selectedAssignment,
        performance_date: perfDate,
        calls_scheduled: perfCalls,
        calls_completed: perfCompleted,
        revenue_collected: perfRevenue,
        revenue_invoiced: perfInvoiced,
        no_shows: perfNS,
        cancellations: perfCancel,
        notes: perfNotes || null,
      }),
    });

    if (res.ok) {
      // Reset form
      setPerfCalls(0);
      setPerfCompleted(0);
      setPerfRevenue(0);
      setPerfInvoiced(0);
      setPerfNS(0);
      setPerfCancel(0);
      setPerfNotes('');
      loadEvent();
    }
    setSavingPerf(false);
  };

  const deletePerformance = async (perfId: string) => {
    if (!confirm('Supprimer cette entrée ?')) return;
    await fetch(`/api/crm/events/${eventId}/performance?performance_id=${perfId}`, { method: 'DELETE' });
    loadEvent();
  };

  const updateEventStatus = async () => {
    await fetch(`/api/crm/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setEditingStatus(false);
    loadEvent();
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Chargement...</div>;
  if (!event) return <div className="text-center py-12 text-gray-400">Événement non trouvé</div>;

  const activeAssignments = event.assignments.filter(a => a.status !== 'removed');

  // Stats globales de l'événement
  const allPerfs = activeAssignments.flatMap(a => a.performances);
  const globalStats = computeCloserStats(allPerfs);

  // Données pour le graphique comparatif closers
  const closerComparison = activeAssignments.map(a => ({
    name: a.closer_name,
    ...computeCloserStats(a.performances),
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);

  const maxRev = Math.max(...closerComparison.map(c => c.totalRevenue), 1);

  const statusConf = CRM_EVENT_STATUS_LABELS[event.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <a href="/dashboard/crm" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">{event.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                {CRM_EVENT_TYPE_LABELS[event.event_type]}
              </span>
              {editingStatus ? (
                <div className="flex items-center gap-1">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as CrmEventStatus)}
                    className="text-xs border rounded px-2 py-0.5"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="active">En cours</option>
                    <option value="completed">Terminé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                  <button onClick={updateEventStatus} className="text-green-600 hover:text-green-700">
                    <Save className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setEditingStatus(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingStatus(true)}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConf.bgColor} ${statusConf.color} hover:opacity-80`}
                >
                  {statusConf.label}
                </button>
              )}
              <span className="text-xs text-gray-400">
                {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {event.end_date && ` — ${new Date(event.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}
              </span>
            </div>
            {event.offer && (
              <p className="text-xs text-gray-400 mt-1">Offre liée : {event.offer.title}</p>
            )}
          </div>
        </div>
      </div>

      {/* KPIs événement */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xl font-bold text-brand-dark">{activeAssignments.length}</p>
              <p className="text-xs text-gray-500">Closers</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xl font-bold text-brand-dark">{globalStats.totalCompleted}</p>
              <p className="text-xs text-gray-500">Calls réalisés</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-xl font-bold text-brand-dark">{globalStats.totalRevenue.toLocaleString('fr-FR')}€</p>
              <p className="text-xs text-gray-500">CA encaissé</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-rose-500" />
            <div>
              <p className="text-xl font-bold text-brand-dark">{Math.round(globalStats.cashPerCall).toLocaleString('fr-FR')}€</p>
              <p className="text-xs text-gray-500">Cash/call</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-xl font-bold text-brand-dark">{globalStats.totalNS + globalStats.totalCancel}</p>
              <p className="text-xs text-gray-500">NS + Annul.</p>
            </div>
          </div>
        </CardContent></Card>
      </div>

      {/* Graphique comparatif closers */}
      {closerComparison.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-brand-amber" />
              CA par closer
            </h2>
            <div className="space-y-3">
              {closerComparison.map((c, idx) => {
                const pct = (c.totalRevenue / maxRev) * 100;
                return (
                  <div key={c.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700 flex items-center gap-2">
                        <span className="text-gray-300 font-bold w-4">{idx + 1}</span>
                        {c.name}
                      </span>
                      <span className="text-gray-500">
                        <span className="font-semibold text-green-600">{c.totalRevenue.toLocaleString('fr-FR')}€</span>
                        <span className="text-gray-400 text-xs ml-2">{c.totalCompleted} calls — {Math.round(c.cashPerCall)}€/call</span>
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-amber/80 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste closers avec détails */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-amber" />
              Closers assignés ({activeAssignments.length})
            </h2>
            <button
              onClick={() => setShowAddCloser(!showAddCloser)}
              className="flex items-center gap-1 text-sm text-brand-amber hover:text-brand-amber/80 font-medium"
            >
              <UserPlus className="h-4 w-4" />
              Ajouter
            </button>
          </div>

          {/* Panel ajout closer */}
          {showAddCloser && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {searchResults.map(u => (
                      <button
                        key={u.id}
                        onClick={() => assignCloser(u.id, u.full_name, u.email)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 text-left text-sm"
                      >
                        <span className="font-medium">{u.full_name}</span>
                        <span className="text-gray-400 text-xs">{u.email}</span>
                        <Plus className="h-4 w-4 text-brand-amber ml-auto" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!showExternalForm ? (
                <button
                  onClick={() => setShowExternalForm(true)}
                  className="flex items-center gap-1 text-xs text-brand-amber"
                >
                  <Mail className="h-3.5 w-3.5" /> Inviter par email
                </button>
              ) : (
                <div className="flex gap-2 items-center">
                  <input
                    value={externalName}
                    onChange={(e) => setExternalName(e.target.value)}
                    placeholder="Nom"
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-sm"
                  />
                  <input
                    value={externalEmail}
                    onChange={(e) => setExternalEmail(e.target.value)}
                    placeholder="Email"
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-sm"
                  />
                  <button
                    onClick={inviteExternal}
                    className="px-3 py-1.5 bg-brand-amber text-white rounded text-sm font-medium"
                  >
                    Inviter
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Liste */}
          {activeAssignments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucun closer assigné</p>
          ) : (
            <div className="space-y-2">
              {activeAssignments.map(a => {
                const stats = computeCloserStats(a.performances);
                const isExpanded = expandedCloser === a.id;
                const assignConf = ASSIGNMENT_STATUS_LABELS[a.status];

                return (
                  <div key={a.id} className="border border-gray-100 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedCloser(isExpanded ? null : a.id)}
                      className="flex items-center gap-3 w-full p-4 hover:bg-gray-50/60 text-left"
                    >
                      <div className="h-9 w-9 rounded-full bg-brand-amber/10 flex items-center justify-center text-brand-amber font-bold text-sm shrink-0">
                        {a.closer_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-brand-dark truncate">{a.closer_name}</p>
                        <p className="text-xs text-gray-400 truncate">{a.closer_email}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${assignConf.bgColor} ${assignConf.color}`}>
                        {assignConf.label}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">{stats.totalRevenue.toLocaleString('fr-FR')}€</p>
                        <p className="text-xs text-gray-400">{stats.totalCompleted} calls — {Math.round(stats.cashPerCall)}€/call</p>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-100 p-4 bg-gray-50/40 space-y-3">
                        {/* Stats résumées */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
                          <div>
                            <p className="text-lg font-bold text-brand-dark">{stats.totalScheduled}</p>
                            <p className="text-xs text-gray-500">Programmés</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-brand-dark">{stats.totalCompleted}</p>
                            <p className="text-xs text-gray-500">Réalisés</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-green-600">{stats.totalRevenue.toLocaleString('fr-FR')}€</p>
                            <p className="text-xs text-gray-500">CA encaissé</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-blue-600">{stats.totalInvoiced.toLocaleString('fr-FR')}€</p>
                            <p className="text-xs text-gray-500">CA facturé</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-red-500">{stats.totalNS}</p>
                            <p className="text-xs text-gray-500">No-shows</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-amber-500">{stats.totalCancel}</p>
                            <p className="text-xs text-gray-500">Annulations</p>
                          </div>
                        </div>

                        {/* Entrées de performance */}
                        {a.performances.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-white border-b">
                                  <th className="text-left px-2 py-1.5 font-medium text-gray-500">Date</th>
                                  <th className="text-center px-2 py-1.5 font-medium text-gray-500">Prog.</th>
                                  <th className="text-center px-2 py-1.5 font-medium text-gray-500">Réal.</th>
                                  <th className="text-center px-2 py-1.5 font-medium text-gray-500">CA</th>
                                  <th className="text-center px-2 py-1.5 font-medium text-gray-500">Fact.</th>
                                  <th className="text-center px-2 py-1.5 font-medium text-gray-500">NS</th>
                                  <th className="text-center px-2 py-1.5 font-medium text-gray-500">Ann.</th>
                                  <th className="text-center px-2 py-1.5 font-medium text-gray-500"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {a.performances
                                  .sort((a, b) => b.performance_date.localeCompare(a.performance_date))
                                  .map(p => (
                                  <tr key={p.id} className="border-b border-gray-50 hover:bg-white">
                                    <td className="px-2 py-1.5">
                                      {new Date(p.performance_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                    </td>
                                    <td className="px-2 py-1.5 text-center">{p.calls_scheduled}</td>
                                    <td className="px-2 py-1.5 text-center">{p.calls_completed}</td>
                                    <td className="px-2 py-1.5 text-center font-medium text-green-600">
                                      {Number(p.revenue_collected).toLocaleString('fr-FR')}€
                                    </td>
                                    <td className="px-2 py-1.5 text-center text-blue-600">
                                      {Number(p.revenue_invoiced).toLocaleString('fr-FR')}€
                                    </td>
                                    <td className="px-2 py-1.5 text-center text-red-500">{p.no_shows}</td>
                                    <td className="px-2 py-1.5 text-center text-amber-500">{p.cancellations}</td>
                                    <td className="px-2 py-1.5 text-center">
                                      <button
                                        onClick={() => deletePerformance(p.id)}
                                        className="text-gray-300 hover:text-red-500"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Bouton retirer */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => removeAssignment(a.id)}
                            className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
                          >
                            <X className="h-3 w-3" />
                            Retirer de l&apos;événement
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulaire saisie performance */}
      {activeAssignments.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2 mb-4">
              <Plus className="h-5 w-5 text-brand-amber" />
              Saisir une performance
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Closer</label>
                <select
                  value={selectedAssignment}
                  onChange={(e) => setSelectedAssignment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="">Sélectionner un closer</option>
                  {activeAssignments.map(a => (
                    <option key={a.id} value={a.id}>{a.closer_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                <input
                  type="date"
                  value={perfDate}
                  onChange={(e) => setPerfDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Calls programmés</label>
                <input
                  type="number"
                  value={perfCalls}
                  onChange={(e) => setPerfCalls(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Calls réalisés</label>
                <input
                  type="number"
                  value={perfCompleted}
                  onChange={(e) => setPerfCompleted(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">CA encaissé (€)</label>
                <input
                  type="number"
                  value={perfRevenue}
                  onChange={(e) => setPerfRevenue(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  min={0}
                  step={0.01}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">CA facturé (€)</label>
                <input
                  type="number"
                  value={perfInvoiced}
                  onChange={(e) => setPerfInvoiced(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  min={0}
                  step={0.01}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">No-shows</label>
                <input
                  type="number"
                  value={perfNS}
                  onChange={(e) => setPerfNS(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Annulations</label>
                <input
                  type="number"
                  value={perfCancel}
                  onChange={(e) => setPerfCancel(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  min={0}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                <input
                  type="text"
                  value={perfNotes}
                  onChange={(e) => setPerfNotes(e.target.value)}
                  placeholder="Notes optionnelles..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={addPerformance}
                disabled={savingPerf || !selectedAssignment}
                className="flex items-center gap-2 px-4 py-2 bg-brand-amber text-white rounded-lg text-sm font-medium hover:bg-brand-amber/90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {savingPerf ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
