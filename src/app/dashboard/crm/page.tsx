'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui';
import {
  BarChart3, Users, DollarSign, TrendingUp, Calendar, Plus,
  Phone, ArrowRight, Filter, Zap,
} from 'lucide-react';
import type { CrmEventType, CrmEventStatus } from '@/types/database';
import {
  CRM_EVENT_TYPE_LABELS,
  CRM_EVENT_STATUS_LABELS,
} from '@/types/database';

interface EventWithStats {
  id: string;
  title: string;
  event_type: CrmEventType;
  status: CrmEventStatus;
  start_date: string;
  end_date: string | null;
  offer: { id: string; title: string } | null;
  assignments: Array<{
    id: string;
    closer_name: string;
    status: string;
    performances: Array<{
      calls_scheduled: number;
      calls_completed: number;
      revenue_collected: number;
      revenue_invoiced: number;
      no_shows: number;
      cancellations: number;
    }>;
  }>;
}

function aggregateEventStats(event: EventWithStats) {
  const activeAssignments = event.assignments.filter(a => a.status !== 'removed');
  let totalCalls = 0, totalCompleted = 0, totalRevenue = 0, totalInvoiced = 0, totalNS = 0, totalCancel = 0;

  for (const a of activeAssignments) {
    for (const p of a.performances) {
      totalCalls += p.calls_scheduled;
      totalCompleted += p.calls_completed;
      totalRevenue += Number(p.revenue_collected);
      totalInvoiced += Number(p.revenue_invoiced);
      totalNS += p.no_shows;
      totalCancel += p.cancellations;
    }
  }

  const effectiveCalls = totalCompleted - totalNS - totalCancel;
  const cashPerCall = effectiveCalls > 0 ? totalRevenue / effectiveCalls : 0;

  return {
    closersCount: activeAssignments.length,
    totalCalls,
    totalCompleted,
    totalRevenue,
    totalInvoiced,
    totalNS,
    totalCancel,
    effectiveCalls: Math.max(0, effectiveCalls),
    cashPerCall,
  };
}

export default function CrmDashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(`/api/crm/events${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
      setLoading(false);
    }
    load();
  }, [supabase, statusFilter]);

  // Agrégation globale
  const globalStats = events.reduce(
    (acc, event) => {
      const s = aggregateEventStats(event);
      acc.totalEvents++;
      acc.totalClosers += s.closersCount;
      acc.totalRevenue += s.totalRevenue;
      acc.totalCalls += s.totalCompleted;
      acc.totalEffective += s.effectiveCalls;
      return acc;
    },
    { totalEvents: 0, totalClosers: 0, totalRevenue: 0, totalCalls: 0, totalEffective: 0 }
  );

  const globalCashPerCall = globalStats.totalEffective > 0
    ? globalStats.totalRevenue / globalStats.totalEffective
    : 0;

  if (loading) return <div className="text-center py-12 text-gray-400">Chargement du CRM...</div>;

  // Top closers
  const closerMap = new Map<string, { name: string; revenue: number; calls: number; effective: number }>();
  for (const event of events) {
    for (const a of event.assignments.filter(a => a.status !== 'removed')) {
      const key = a.closer_name;
      const existing = closerMap.get(key) || { name: a.closer_name, revenue: 0, calls: 0, effective: 0 };
      for (const p of a.performances) {
        existing.revenue += Number(p.revenue_collected);
        existing.calls += p.calls_completed;
        existing.effective += Math.max(0, p.calls_completed - p.no_shows - p.cancellations);
      }
      closerMap.set(key, existing);
    }
  }
  const topClosers = Array.from(closerMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Revenue par type d'event
  const revenueByType: Record<string, number> = {};
  for (const event of events) {
    const s = aggregateEventStats(event);
    revenueByType[event.event_type] = (revenueByType[event.event_type] || 0) + s.totalRevenue;
  }
  const maxRevType = Math.max(...Object.values(revenueByType), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">CRM Événements</h1>
          <p className="text-gray-500 mt-1">Analyse data de vos événements et closers</p>
        </div>
        <a
          href="/dashboard/crm/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-amber text-white rounded-lg hover:bg-brand-amber/90 transition-colors font-medium text-sm"
        >
          <Plus className="h-4 w-4" />
          Nouvel événement
        </a>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{globalStats.totalEvents}</p>
                <p className="text-xs text-gray-500">Événements</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{globalStats.totalClosers}</p>
                <p className="text-xs text-gray-500">Closers actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{globalStats.totalRevenue.toLocaleString('fr-FR')}€</p>
                <p className="text-xs text-gray-500">CA total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Phone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{globalStats.totalCalls}</p>
                <p className="text-xs text-gray-500">Calls réalisés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-rose-100 flex items-center justify-center">
                <Zap className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{Math.round(globalCashPerCall).toLocaleString('fr-FR')}€</p>
                <p className="text-xs text-gray-500">Cash/call moy.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue par type */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-brand-amber" />
              CA par type d&apos;événement
            </h2>
            {Object.keys(revenueByType).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(revenueByType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, revenue]) => {
                    const pct = (revenue / maxRevType) * 100;
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700">
                            {CRM_EVENT_TYPE_LABELS[type as CrmEventType] || type}
                          </span>
                          <span className="text-gray-500 font-medium">
                            {revenue.toLocaleString('fr-FR')}€
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
            )}
          </CardContent>
        </Card>

        {/* Top closers */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-brand-amber" />
              Top closers
            </h2>
            {topClosers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucun closer</p>
            ) : (
              <div className="space-y-3">
                {topClosers.map((closer, idx) => {
                  const cpc = closer.effective > 0 ? closer.revenue / closer.effective : 0;
                  return (
                    <div key={closer.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <span className="text-lg font-bold text-gray-300 w-6 text-center">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-brand-dark truncate">{closer.name}</p>
                        <p className="text-xs text-gray-400">{closer.calls} calls — {Math.round(cpc)}€/call</p>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        {closer.revenue.toLocaleString('fr-FR')}€
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Liste des événements */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-amber" />
              Tous les événements
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">En cours</option>
                <option value="completed">Terminés</option>
                <option value="draft">Brouillons</option>
                <option value="cancelled">Annulés</option>
              </select>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Aucun événement</p>
              <a
                href="/dashboard/crm/new"
                className="inline-flex items-center gap-2 mt-3 text-sm text-brand-amber hover:underline"
              >
                <Plus className="h-4 w-4" />
                Créer votre premier événement
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <th className="text-left font-medium text-gray-500 px-4 py-2.5">Événement</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2.5">Type</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2.5">Statut</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2.5">Closers</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2.5">Calls</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2.5">CA</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2.5">€/call</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => {
                    const stats = aggregateEventStats(event);
                    const statusConf = CRM_EVENT_STATUS_LABELS[event.status];
                    return (
                      <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <p className="font-medium text-brand-dark">{event.title}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {event.end_date && ` — ${new Date(event.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                          </p>
                          {event.offer && (
                            <p className="text-xs text-gray-400 mt-0.5">Offre : {event.offer.title}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                            {CRM_EVENT_TYPE_LABELS[event.event_type]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConf.bgColor} ${statusConf.color}`}>
                            {statusConf.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-gray-700">{stats.closersCount}</td>
                        <td className="px-4 py-3 text-center font-medium text-gray-700">{stats.totalCompleted}</td>
                        <td className="px-4 py-3 text-center font-semibold text-green-600">
                          {stats.totalRevenue.toLocaleString('fr-FR')}€
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-medium ${stats.cashPerCall >= 1000 ? 'text-green-600' : stats.cashPerCall >= 500 ? 'text-amber-600' : 'text-gray-500'}`}>
                            {Math.round(stats.cashPerCall).toLocaleString('fr-FR')}€
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <a
                            href={`/dashboard/crm/${event.id}`}
                            className="inline-flex items-center gap-1 text-brand-amber hover:text-brand-amber/80 text-sm font-medium"
                          >
                            Détails
                            <ArrowRight className="h-4 w-4" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
