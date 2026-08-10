import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui';
import {
  BarChart3, Users, TrendingUp, CheckCircle, Briefcase,
  Calendar, Award, ArrowLeft,
} from 'lucide-react';

interface NicheStat {
  niche: string;
  total_applications: number;
  validated: number;
  conversion: number;
}

interface RecruiterStat {
  id: string;
  full_name: string;
  email: string;
  validated_count: number;
  total_offers: number;
}

interface MonthlyStat {
  month: string;
  count: number;
}

export default async function AdminCRMPage() {
  await requireAdmin();
  const supabase = await createClient();

  // 1. Total des profils validés (recrutés)
  const { count: totalValidated } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .not('validated_at', 'is', null);

  // 2. Total candidatures
  const { count: totalApplications } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true });

  // 3. Total offres actives
  const { count: totalActiveOffers } = await supabase
    .from('offers')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  // 4. Recrutements avec détails (offre + niche)
  const { data: validatedApps } = await supabase
    .from('applications')
    .select('id, validated_at, closer_id, offer_id, offers(title, niche, manager_id, users!manager_id(id, full_name, email))')
    .not('validated_at', 'is', null)
    .order('validated_at', { ascending: false });

  // 5. Répartition par niche
  const nicheMap: Record<string, { total: number; validated: number }> = {};
  const recruiterMap: Record<string, { full_name: string; email: string; validated_count: number; offer_ids: Set<string> }> = {};
  const monthlyMap: Record<string, number> = {};

  // Toutes les candidatures pour compter total par niche
  const { data: allApps } = await supabase
    .from('applications')
    .select('offer_id, offers(niche)')
    .limit(10000);

  (allApps || []).forEach((a: any) => {
    const niche = a.offers?.niche || 'Non spécifié';
    if (!nicheMap[niche]) nicheMap[niche] = { total: 0, validated: 0 };
    nicheMap[niche].total++;
  });

  (validatedApps || []).forEach((a: any) => {
    const niche = a.offers?.niche || 'Non spécifié';
    if (!nicheMap[niche]) nicheMap[niche] = { total: 0, validated: 0 };
    nicheMap[niche].validated++;

    // Stats par recruteur
    const manager = a.offers?.users;
    if (manager) {
      if (!recruiterMap[manager.id]) {
        recruiterMap[manager.id] = {
          full_name: manager.full_name || manager.email,
          email: manager.email,
          validated_count: 0,
          offer_ids: new Set(),
        };
      }
      recruiterMap[manager.id].validated_count++;
      recruiterMap[manager.id].offer_ids.add(a.offer_id);
    }

    // Stats mensuelles
    if (a.validated_at) {
      const month = a.validated_at.slice(0, 7); // YYYY-MM
      monthlyMap[month] = (monthlyMap[month] || 0) + 1;
    }
  });

  const nicheStats: NicheStat[] = Object.entries(nicheMap)
    .map(([niche, stats]) => ({
      niche,
      total_applications: stats.total,
      validated: stats.validated,
      conversion: stats.total > 0 ? Math.round((stats.validated / stats.total) * 100) : 0,
    }))
    .sort((a, b) => b.validated - a.validated);

  const recruiterStats: RecruiterStat[] = Object.entries(recruiterMap)
    .map(([id, stats]) => ({
      id,
      full_name: stats.full_name,
      email: stats.email,
      validated_count: stats.validated_count,
      total_offers: stats.offer_ids.size,
    }))
    .sort((a, b) => b.validated_count - a.validated_count);

  // Timeline mensuelle (12 derniers mois)
  const monthlyStats: MonthlyStat[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyStats.push({ month: key, count: monthlyMap[key] || 0 });
  }
  const maxMonthly = Math.max(...monthlyStats.map(m => m.count), 1);

  const globalConversion = (totalApplications || 0) > 0
    ? Math.round(((totalValidated || 0) / (totalApplications || 1)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <a href="/dashboard/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-dark transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour admin
        </a>
        <h1 className="text-2xl font-bold text-brand-dark mt-2">CRM Recrutement</h1>
        <p className="text-gray-500 mt-1">Vue globale des recrutements sur la plateforme</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{totalValidated || 0}</p>
                <p className="text-xs text-gray-500">Profils recrutés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{totalApplications || 0}</p>
                <p className="text-xs text-gray-500">Candidatures totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{totalActiveOffers || 0}</p>
                <p className="text-xs text-gray-500">Offres actives</p>
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
                <p className="text-2xl font-bold text-brand-dark">{globalConversion}%</p>
                <p className="text-xs text-gray-500">Taux recrutement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline mensuelle */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-brand-amber" />
              Recrutements — 12 derniers mois
            </h2>
            <div className="flex items-end gap-[6px] h-40">
              {monthlyStats.map((m, idx) => {
                const height = maxMonthly > 0 ? (m.count / maxMonthly) * 100 : 0;
                const [year, month] = m.month.split('-');
                const monthLabel = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('fr-FR', { month: 'short' });
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end group relative">
                    <div
                      className="w-full bg-green-500/80 rounded-t transition-all hover:bg-green-500 min-h-[2px]"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {monthLabel} {year} — {m.count} recrutement{m.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1 truncate w-full text-center">{monthLabel}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Répartition par niche */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-brand-amber" />
              Recrutements par thématique
            </h2>
            {nicheStats.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {nicheStats.map(s => {
                  const maxVal = Math.max(...nicheStats.map(n => n.validated), 1);
                  const pct = (s.validated / maxVal) * 100;
                  return (
                    <div key={s.niche} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700 truncate">{s.niche}</span>
                        <span className="text-gray-500 font-medium shrink-0 ml-2">
                          {s.validated} recruté{s.validated !== 1 ? 's' : ''}
                          <span className="text-gray-400 text-xs ml-1">/ {s.total_applications} cand.</span>
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
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
      </div>

      {/* Top recruteurs */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-brand-amber" />
            Top recruteurs
          </h2>
          {recruiterStats.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucun recrutement</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <th className="text-left font-medium text-gray-500 px-4 py-2.5">#</th>
                    <th className="text-left font-medium text-gray-500 px-4 py-2.5">Recruteur</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2.5">Offres</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-2.5">Recrutements</th>
                  </tr>
                </thead>
                <tbody>
                  {recruiterStats.slice(0, 20).map((r, idx) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50/60">
                      <td className="px-4 py-3 text-gray-400 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-brand-dark">{r.full_name}</p>
                        <p className="text-xs text-gray-400">{r.email}</p>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-gray-700">{r.total_offers}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          <CheckCircle className="h-3 w-3" />
                          {r.validated_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Derniers recrutements */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Derniers recrutements
          </h2>
          {(validatedApps || []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucun recrutement</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <th className="text-left font-medium text-gray-500 px-4 py-2.5">Date</th>
                    <th className="text-left font-medium text-gray-500 px-4 py-2.5">Offre</th>
                    <th className="text-left font-medium text-gray-500 px-4 py-2.5">Niche</th>
                    <th className="text-left font-medium text-gray-500 px-4 py-2.5">Recruteur</th>
                  </tr>
                </thead>
                <tbody>
                  {(validatedApps || []).slice(0, 30).map((a: any) => (
                    <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50/60">
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(a.validated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 font-medium text-brand-dark">{a.offers?.title || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {a.offers?.niche || 'Non spécifié'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {a.offers?.users?.full_name || a.offers?.users?.email || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
