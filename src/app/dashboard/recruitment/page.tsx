'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui';
import {
  BarChart3, Users, Eye, TrendingUp, Briefcase,
  CheckCircle, Clock, XCircle, Pause, ArrowUp, ArrowDown,
} from 'lucide-react';

interface OfferStats {
  id: string;
  title: string;
  status: string;
  views_count: number;
  app_count: number;
  created_at: string;
}

interface StatusCount {
  status: string;
  count: number;
}

interface TimelinePoint {
  date: string;
  applications: number;
  views: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  reviewing: '#3b82f6',
  accepted: '#22c55e',
  rejected: '#ef4444',
  withdrawn: '#6b7280',
  completed: '#8b5cf6',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  reviewing: 'À étudier',
  accepted: 'Validé',
  rejected: 'Non retenu',
  withdrawn: 'Retiré',
  completed: 'Terminé',
};

export default function RecruitmentDashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<OfferStats[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [totalApps, setTotalApps] = useState(0);
  const [totalValidated, setTotalValidated] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Offres avec count candidatures
      const { data: offersData } = await supabase
        .from('offers')
        .select('id, title, status, views_count, created_at, applications(count)')
        .eq('manager_id', user.id)
        .order('created_at', { ascending: false });

      const offersList: OfferStats[] = (offersData || []).map((o: any) => ({
        id: o.id,
        title: o.title,
        status: o.status,
        views_count: o.views_count || 0,
        app_count: o.applications?.[0]?.count ?? 0,
        created_at: o.created_at,
      }));
      setOffers(offersList);

      const views = offersList.reduce((s, o) => s + o.views_count, 0);
      const apps = offersList.reduce((s, o) => s + o.app_count, 0);
      setTotalViews(views);
      setTotalApps(apps);
      setConversionRate(views > 0 ? Math.round((apps / views) * 100) : 0);

      // 2. Répartition par statut
      const offerIds = offersList.map(o => o.id);
      if (offerIds.length > 0) {
        const { data: appsData } = await supabase
          .from('applications')
          .select('status, validated_at')
          .in('offer_id', offerIds);

        const counts: Record<string, number> = {};
        let validated = 0;
        (appsData || []).forEach((a: any) => {
          counts[a.status] = (counts[a.status] || 0) + 1;
          if (a.validated_at) validated++;
        });
        setTotalValidated(validated);

        setStatusCounts(
          Object.entries(counts).map(([status, count]) => ({ status, count }))
            .sort((a, b) => b.count - a.count)
        );

        // 3. Timeline — candidatures par semaine (30 derniers jours)
        const { data: timelineData } = await supabase
          .from('applications')
          .select('created_at')
          .in('offer_id', offerIds)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: true });

        const dailyMap: Record<string, number> = {};
        (timelineData || []).forEach((a: any) => {
          const day = a.created_at.slice(0, 10);
          dailyMap[day] = (dailyMap[day] || 0) + 1;
        });

        // Fill gaps
        const days: TimelinePoint[] = [];
        for (let i = 29; i >= 0; i--) {
          const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          const key = d.toISOString().slice(0, 10);
          days.push({ date: key, applications: dailyMap[key] || 0, views: 0 });
        }
        setTimeline(days);
      }

      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <div className="text-center py-12 text-gray-400">Chargement du dashboard...</div>;

  const maxAppsDay = Math.max(...timeline.map(t => t.applications), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Dashboard Recrutement</h1>
        <p className="text-gray-500 mt-1">Vue globale de vos performances de recrutement</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{totalViews}</p>
                <p className="text-xs text-gray-500">Vues totales</p>
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
                <p className="text-2xl font-bold text-brand-dark">{totalApps}</p>
                <p className="text-xs text-gray-500">Candidatures</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{totalValidated}</p>
                <p className="text-xs text-gray-500">Profils validés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{conversionRate}%</p>
                <p className="text-xs text-gray-500">Taux conversion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline candidatures — 30 derniers jours */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-brand-amber" />
              Candidatures — 30 derniers jours
            </h2>
            <div className="flex items-end gap-[3px] h-40">
              {timeline.map((day, idx) => {
                const height = maxAppsDay > 0 ? (day.applications / maxAppsDay) * 100 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end group relative">
                    <div
                      className="w-full bg-brand-amber/80 rounded-t transition-all hover:bg-brand-amber min-h-[2px]"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {new Date(day.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — {day.applications} candidature{day.applications !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>{new Date(timeline[0]?.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
              <span>Aujourd&apos;hui</span>
            </div>
          </CardContent>
        </Card>

        {/* Répartition par statut */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-brand-amber" />
              Répartition par statut
            </h2>
            {statusCounts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune candidature</p>
            ) : (
              <div className="space-y-3">
                {/* Bar chart horizontal */}
                {statusCounts.map(s => {
                  const pct = totalApps > 0 ? (s.count / totalApps) * 100 : 0;
                  return (
                    <div key={s.status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">{STATUS_LABELS[s.status] || s.status}</span>
                        <span className="text-gray-500 font-medium">{s.count} <span className="text-gray-400 text-xs">({Math.round(pct)}%)</span></span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: STATUS_COLORS[s.status] || '#9ca3af',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top offres */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5 text-brand-amber" />
            Performances par offre
          </h2>
          {offers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucune offre</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <th className="text-left font-medium text-gray-500 px-4 py-2.5">Offre</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2.5">Statut</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2.5">Vues</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2.5">Candidatures</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2.5">Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((o) => {
                    const conv = o.views_count > 0 ? Math.round((o.app_count / o.views_count) * 100) : 0;
                    const statusColors: Record<string, string> = {
                      active: 'bg-green-100 text-green-700',
                      paused: 'bg-amber-100 text-amber-700',
                      closed: 'bg-gray-100 text-gray-600',
                    };
                    return (
                      <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <a href={`/dashboard/offers/${o.id}/candidates`} className="font-medium text-brand-dark hover:text-brand-green transition-colors">
                            {o.title}
                          </a>
                          <p className="text-xs text-gray-400">
                            {new Date(o.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[o.status] || 'bg-gray-100 text-gray-600'}`}>
                            {o.status === 'active' ? 'Active' : o.status === 'paused' ? 'Pause' : 'Fermée'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-gray-700">{o.views_count}</td>
                        <td className="px-4 py-3 text-center font-medium text-gray-700">{o.app_count}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-medium ${conv >= 10 ? 'text-green-600' : conv >= 5 ? 'text-amber-600' : 'text-gray-500'}`}>
                            {conv}%
                          </span>
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
