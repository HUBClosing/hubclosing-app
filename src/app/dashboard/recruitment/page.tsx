'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui';
import {
  BarChart3, Users, DollarSign, TrendingUp, Calendar, Plus,
  Phone, ArrowRight, Briefcase, ChevronDown, ChevronUp,
  Target, Sparkles, Zap, ShoppingBag,
} from 'lucide-react';
import { getNicheColor } from '@/lib/niche-colors';

// --- Types ---

interface ApplicationCloser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  niches: string[];
  skills: string[];
  years_experience: number | null;
}

interface ApplicationInfo {
  id: string;
  status: string;
  created_at: string;
  closer: ApplicationCloser | null;
}

interface EventAssignment {
  id: string;
  closer_name: string;
  status: string;
  event_performances: Array<{
    calls_scheduled: number;
    calls_completed: number;
    revenue_collected: number;
    revenue_invoiced: number;
    no_shows: number;
    cancellations: number;
  }>;
}

interface EventInfo {
  id: string;
  title: string;
  event_type: string;
  status: string;
  start_date: string;
  end_date: string | null;
  offer_id: string | null;
  assignments: EventAssignment[];
}

interface OfferWithData {
  id: string;
  title: string;
  offer_type: string;
  niche: string | null;
  commission_rate: number | null;
  status: string;
  application_count: number;
  views_count: number;
  is_premium: boolean;
  is_boosted: boolean;
  created_at: string;
  applications: ApplicationInfo[];
  applicationsCount: number;
  linkedEvents: EventInfo[];
}

interface FicheInfo {
  id: string;
  title: string;
  niche: string | null;
  status: string;
  results_count: number;
}

interface DashboardData {
  offers: OfferWithData[];
  events: EventInfo[];
  fiches: FicheInfo[];
  stats: {
    totalOffers: number;
    totalApplications: number;
    totalEvents: number;
    totalRevenue: number;
    totalCalls: number;
    conversionRate: number;
  };
}

// --- Helpers ---

const OFFER_TYPE_LABELS: Record<string, string> = {
  challenge: 'Challenge', recurring: 'Récurrent', mission: 'Mission',
  full_time: 'Temps plein', part_time: 'Temps partiel', commission_only: 'Commission',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  challenge: 'Challenge', ve: 'Vente événementielle', webinaire: 'Webinaire',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  paused: { label: 'En pause', color: 'text-amber-700', bg: 'bg-amber-100' },
  closed: { label: 'Fermée', color: 'text-gray-600', bg: 'bg-gray-100' },
  draft: { label: 'Brouillon', color: 'text-gray-500', bg: 'bg-gray-100' },
  completed: { label: 'Terminé', color: 'text-blue-700', bg: 'bg-blue-100' },
  cancelled: { label: 'Annulé', color: 'text-red-600', bg: 'bg-red-100' },
};

const APP_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: 'text-amber-700', bg: 'bg-amber-100' },
  reviewing: { label: 'En revue', color: 'text-blue-700', bg: 'bg-blue-100' },
  accepted: { label: 'Accepté', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  rejected: { label: 'Refusé', color: 'text-red-700', bg: 'bg-red-100' },
  withdrawn: { label: 'Retiré', color: 'text-gray-600', bg: 'bg-gray-100' },
  completed: { label: 'Terminé', color: 'text-emerald-700', bg: 'bg-emerald-100' },
};

const SKILL_LABELS: Record<string, string> = {
  closing: 'Closing', setting: 'Setting', management: 'Management',
  hos: 'HOS', coaching: 'Coaching', training: 'Formation',
};

function aggregateEventStats(event: EventInfo) {
  const active = (event.assignments || []).filter(a => a.status !== 'removed');
  let totalCalls = 0, totalCompleted = 0, totalRevenue = 0, totalNS = 0, totalCancel = 0;
  for (const a of active) {
    for (const p of a.event_performances || []) {
      totalCalls += p.calls_scheduled;
      totalCompleted += p.calls_completed;
      totalRevenue += Number(p.revenue_collected);
      totalNS += p.no_shows;
      totalCancel += p.cancellations;
    }
  }
  const effective = Math.max(0, totalCompleted - totalNS - totalCancel);
  return {
    closersCount: active.length,
    totalCalls, totalCompleted, totalRevenue,
    effectiveCalls: effective,
    cashPerCall: effective > 0 ? totalRevenue / effective : 0,
  };
}

export default function RecruitmentDashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);
  const [offerTab, setOfferTab] = useState<Record<string, 'candidatures' | 'events'>>({});

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const res = await fetch('/api/recruitment/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <div className="text-center py-12 text-gray-400">Chargement du dashboard...</div>;
  if (!data) return <div className="text-center py-12 text-gray-400">Erreur de chargement</div>;

  const { offers, events, fiches, stats } = data;

  // Revenue par type d'événement
  const revenueByType: Record<string, number> = {};
  for (const event of events) {
    const s = aggregateEventStats(event);
    revenueByType[event.event_type] = (revenueByType[event.event_type] || 0) + s.totalRevenue;
  }
  const maxRevType = Math.max(...Object.values(revenueByType), 1);

  // Top closers (depuis les events)
  const closerMap = new Map<string, { name: string; revenue: number; calls: number; effective: number }>();
  for (const event of events) {
    for (const a of (event.assignments || []).filter(a => a.status !== 'removed')) {
      const key = a.closer_name;
      const existing = closerMap.get(key) || { name: a.closer_name, revenue: 0, calls: 0, effective: 0 };
      for (const p of a.event_performances || []) {
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

  function getOfferTab(offerId: string) {
    return offerTab[offerId] || 'candidatures';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Dashboard Recrutement</h1>
          <p className="text-gray-500 mt-1">Vue d&apos;ensemble de vos offres, candidatures et performances</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/dashboard/crm/new"
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Calendar className="h-4 w-4" />
            Nouvel événement
          </a>
          <a
            href="/dashboard/offers/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-amber text-white rounded-lg hover:bg-brand-amber/90 transition-colors font-medium text-sm"
          >
            <Plus className="h-4 w-4" />
            Nouvelle offre
          </a>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{stats.totalOffers}</p>
                <p className="text-xs text-gray-500">Offres actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{stats.totalApplications}</p>
                <p className="text-xs text-gray-500">Candidatures</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{stats.totalEvents}</p>
                <p className="text-xs text-gray-500">Événements</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{stats.totalRevenue.toLocaleString('fr-FR')}€</p>
                <p className="text-xs text-gray-500">CA total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-rose-100 flex items-center justify-center">
                <Phone className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{stats.totalCalls}</p>
                <p className="text-xs text-gray-500">Calls réalisés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{stats.conversionRate}%</p>
                <p className="text-xs text-gray-500">Taux acceptation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offres avec détails expandables */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-brand-amber" />
              Mes offres
            </h2>
            <span className="text-sm text-gray-400">{offers.length} offre{offers.length > 1 ? 's' : ''}</span>
          </div>

          {offers.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Aucune offre publiée</p>
              <a
                href="/dashboard/offers/new"
                className="inline-flex items-center gap-2 mt-3 text-sm text-brand-amber hover:underline"
              >
                <Plus className="h-4 w-4" />
                Publier votre première offre
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map(offer => {
                const isExpanded = expandedOfferId === offer.id;
                const status = STATUS_CONFIG[offer.status] || STATUS_CONFIG.active;
                const eventCount = offer.linkedEvents?.length || 0;
                const eventRevenue = (offer.linkedEvents || []).reduce((sum, e) => sum + aggregateEventStats(e).totalRevenue, 0);
                const tab = getOfferTab(offer.id);

                return (
                  <div key={offer.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Offer row */}
                    <button
                      onClick={() => setExpandedOfferId(isExpanded ? null : offer.id)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-gray-50/60 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-brand-dark truncate">{offer.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color} ${status.bg}`}>
                            {status.label}
                          </span>
                          {offer.is_boosted && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-amber/10 text-brand-amber font-medium flex items-center gap-1">
                              <Zap className="h-3 w-3" /> Boost
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                          {offer.niche && (() => {
                            const nc = getNicheColor(offer.niche);
                            return (
                              <span className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full border ${nc.bg} ${nc.text} ${nc.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${nc.dot}`} />
                                {offer.niche}
                              </span>
                            );
                          })()}
                          <span>{OFFER_TYPE_LABELS[offer.offer_type] || offer.offer_type}</span>
                          {offer.commission_rate && <span>{offer.commission_rate}% commission</span>}
                          <span>{new Date(offer.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-bold text-brand-dark">{offer.applicationsCount}</p>
                          <p className="text-xs text-gray-400">Candidatures</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-brand-dark">{offer.views_count || 0}</p>
                          <p className="text-xs text-gray-400">Vues</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-brand-dark">{eventCount}</p>
                          <p className="text-xs text-gray-400">Événements</p>
                        </div>
                        {eventRevenue > 0 && (
                          <div className="text-center">
                            <p className="font-bold text-green-600">{eventRevenue.toLocaleString('fr-FR')}€</p>
                            <p className="text-xs text-gray-400">CA</p>
                          </div>
                        )}
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50/30">
                        {/* Tabs */}
                        <div className="flex items-center gap-1 px-4 pt-3">
                          <button
                            onClick={() => setOfferTab(prev => ({ ...prev, [offer.id]: 'candidatures' }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              tab === 'candidatures' ? 'bg-brand-amber text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <Users className="h-3.5 w-3.5 inline mr-1" />
                            Candidatures ({offer.applicationsCount})
                          </button>
                          <button
                            onClick={() => setOfferTab(prev => ({ ...prev, [offer.id]: 'events' }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              tab === 'events' ? 'bg-brand-amber text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <Calendar className="h-3.5 w-3.5 inline mr-1" />
                            Événements ({eventCount})
                          </button>
                        </div>

                        <div className="p-4">
                          {/* Candidatures tab */}
                          {tab === 'candidatures' && (
                            offer.applications.length === 0 ? (
                              <p className="text-sm text-gray-400 text-center py-4">Aucune candidature reçue</p>
                            ) : (
                              <div className="space-y-2">
                                {offer.applications.slice(0, 10).map(app => {
                                  const appStatus = APP_STATUS_LABELS[app.status] || APP_STATUS_LABELS.pending;
                                  return (
                                    <div key={app.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                                      {/* Avatar */}
                                      {app.closer?.avatar_url ? (
                                        <img src={app.closer.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-100" />
                                      ) : (
                                        <div className="w-9 h-9 rounded-full bg-brand-amber/10 flex items-center justify-center text-brand-amber font-bold text-sm">
                                          {(app.closer?.full_name || '?').charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-brand-dark truncate">
                                          {app.closer?.full_name || 'Candidat'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          {(app.closer?.skills || []).slice(0, 3).map(s => (
                                            <span key={s} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                              {SKILL_LABELS[s] || s}
                                            </span>
                                          ))}
                                          {app.closer?.years_experience != null && app.closer.years_experience > 0 && (
                                            <span className="text-[10px] text-gray-400">
                                              {app.closer.years_experience} ans
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${appStatus.color} ${appStatus.bg}`}>
                                        {appStatus.label}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        {new Date(app.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                      </span>
                                    </div>
                                  );
                                })}
                                {offer.applications.length > 10 && (
                                  <p className="text-xs text-gray-400 text-center pt-2">
                                    + {offer.applications.length - 10} autres candidatures
                                  </p>
                                )}
                              </div>
                            )
                          )}

                          {/* Événements tab */}
                          {tab === 'events' && (
                            offer.linkedEvents.length === 0 ? (
                              <div className="text-center py-4">
                                <p className="text-sm text-gray-400">Aucun événement lié</p>
                                <a
                                  href="/dashboard/crm/new"
                                  className="inline-flex items-center gap-1 mt-2 text-xs text-brand-amber hover:underline"
                                >
                                  <Plus className="h-3 w-3" /> Créer un événement
                                </a>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {offer.linkedEvents.map(event => {
                                  const es = aggregateEventStats(event);
                                  const evStatus = STATUS_CONFIG[event.status] || STATUS_CONFIG.active;
                                  return (
                                    <div key={event.id} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-100">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-brand-dark truncate">{event.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                          {EVENT_TYPE_LABELS[event.event_type] || event.event_type} — {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                        </p>
                                      </div>
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${evStatus.color} ${evStatus.bg}`}>
                                        {evStatus.label}
                                      </span>
                                      <div className="flex items-center gap-4 text-xs">
                                        <span className="text-gray-500">{es.closersCount} closers</span>
                                        <span className="text-gray-500">{es.totalCompleted} calls</span>
                                        <span className="font-semibold text-green-600">{es.totalRevenue.toLocaleString('fr-FR')}€</span>
                                      </div>
                                      <a
                                        href={`/dashboard/crm/${event.id}`}
                                        className="text-brand-amber hover:text-brand-amber/80"
                                      >
                                        <ArrowRight className="h-4 w-4" />
                                      </a>
                                    </div>
                                  );
                                })}
                              </div>
                            )
                          )}
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

      {/* Bottom row: Performance + Matching */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue par type d'événement */}
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
                            {EVENT_TYPE_LABELS[type] || type}
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
                      <span className="text-lg font-bold text-gray-300 w-6 text-center">{idx + 1}</span>
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

        {/* Fiches Matching IA */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-brand-amber" />
              Matching IA
            </h2>
            {fiches.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucune fiche de poste</p>
                <a
                  href="/dashboard/matching/new"
                  className="inline-flex items-center gap-1 mt-2 text-sm text-brand-amber hover:underline"
                >
                  <Plus className="h-4 w-4" /> Créer une fiche
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {fiches.map(fiche => (
                  <a
                    key={fiche.id}
                    href={`/dashboard/matching/${fiche.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/60 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand-dark truncate">{fiche.title}</p>
                      {fiche.niche && (
                        <span className="text-xs text-gray-400">{fiche.niche}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">
                        {fiche.results_count} résultat{fiche.results_count > 1 ? 's' : ''}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </a>
                ))}
                <a
                  href="/dashboard/matching/new"
                  className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-gray-200 text-sm text-gray-400 hover:text-brand-amber hover:border-brand-amber transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle fiche
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tous les événements */}
      {events.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2">
                <Calendar className="h-5 w-5 text-brand-amber" />
                Tous les événements
              </h2>
              <a
                href="/dashboard/crm/new"
                className="flex items-center gap-1 text-sm text-brand-amber hover:text-brand-amber/80 font-medium"
              >
                <Plus className="h-4 w-4" />
                Nouvel événement
              </a>
            </div>

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
                  {events.map(event => {
                    const es = aggregateEventStats(event);
                    const evStatus = STATUS_CONFIG[event.status] || STATUS_CONFIG.active;
                    return (
                      <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <p className="font-medium text-brand-dark">{event.title}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                            {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${evStatus.color} ${evStatus.bg}`}>
                            {evStatus.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-gray-700">{es.closersCount}</td>
                        <td className="px-4 py-3 text-center font-medium text-gray-700">{es.totalCompleted}</td>
                        <td className="px-4 py-3 text-center font-semibold text-green-600">{es.totalRevenue.toLocaleString('fr-FR')}€</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-medium ${es.cashPerCall >= 1000 ? 'text-green-600' : es.cashPerCall >= 500 ? 'text-amber-600' : 'text-gray-500'}`}>
                            {Math.round(es.cashPerCall).toLocaleString('fr-FR')}€
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <a
                            href={`/dashboard/crm/${event.id}`}
                            className="inline-flex items-center gap-1 text-brand-amber hover:text-brand-amber/80 text-sm font-medium"
                          >
                            Détails <ArrowRight className="h-4 w-4" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
