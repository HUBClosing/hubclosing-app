import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { canUserDo, TIER_PRICES } from '@/types/database';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { Receipt, Euro, FileText, PieChart, TrendingUp, Download, Calendar, Briefcase, Users } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function AccountingPage() {
  const user = await requireUser();

  // Gate: Élite ou admin uniquement
  if (!canUserDo(user, 'accounting') && user.role_type !== 'admin') {
    redirect('/dashboard/subscription');
  }

  const supabase = await createClient();

  // Déterminer le rôle actif
  const isCandidate =
    user.role_type === 'candidate' ||
    (user.role_type === 'both' && user.active_role === 'candidate') ||
    user.role === 'closer';

  // Fetch données en parallèle
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  // Applications complétées (deals fermés)
  const completedFilter = isCandidate ? 'closer_id' : 'offer.manager_id';

  const [completedAllResult, completedMonthResult, completedLastMonthResult, referralsResult] = await Promise.all([
    // Toutes les applications complétées
    isCandidate
      ? supabase
          .from('applications')
          .select('*, offer:offers(id, title, commission_rate, fixed_salary, product_price_range, niche, manager:users!manager_id(full_name))')
          .eq('closer_id', user.id)
          .eq('status', 'completed')
          .order('updated_at', { ascending: false })
          .limit(100)
      : supabase
          .from('applications')
          .select('*, offer:offers!inner(id, title, commission_rate, fixed_salary, product_price_range, niche, manager_id), closer:users!closer_id(full_name)')
          .eq('offer.manager_id', user.id)
          .eq('status', 'completed')
          .order('updated_at', { ascending: false })
          .limit(100),

    // Complétées ce mois
    isCandidate
      ? supabase
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('closer_id', user.id)
          .eq('status', 'completed')
          .gte('updated_at', startOfMonth)
      : supabase
          .from('applications')
          .select('id, offer:offers!inner(manager_id)', { count: 'exact', head: true })
          .eq('offer.manager_id', user.id)
          .eq('status', 'completed')
          .gte('updated_at', startOfMonth),

    // Complétées mois dernier
    isCandidate
      ? supabase
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('closer_id', user.id)
          .eq('status', 'completed')
          .gte('updated_at', startOfLastMonth)
          .lte('updated_at', endOfLastMonth)
      : supabase
          .from('applications')
          .select('id, offer:offers!inner(manager_id)', { count: 'exact', head: true })
          .eq('offer.manager_id', user.id)
          .eq('status', 'completed')
          .gte('updated_at', startOfLastMonth)
          .lte('updated_at', endOfLastMonth),

    // Commissions parrainage
    supabase
      .from('referrals')
      .select('*, referred:users!referred_id(tier, is_active)')
      .eq('referrer_id', user.id)
      .eq('status', 'active'),
  ]);

  const completedDeals = completedAllResult.data || [];
  const dealsThisMonth = completedMonthResult.count || 0;
  const dealsLastMonth = completedLastMonthResult.count || 0;
  const activeReferrals = (referralsResult.data || []).filter(r => r.referred?.is_active !== false);

  // Calcul commissions parrainage mensuelles
  const monthlyReferralCommission = activeReferrals.reduce((sum, r) => {
    const filleulTier = r.referred?.tier || 'free';
    const price = TIER_PRICES[filleulTier as keyof typeof TIER_PRICES] || 0;
    return sum + (price * 0.20);
  }, 0);

  const totalReferralEarned = (referralsResult.data || []).reduce((sum, r) => sum + (r.total_earned || 0), 0);

  // Estimation CA deals
  const estimatedDealRevenue = completedDeals.reduce((sum, deal) => {
    const offer = deal.offer;
    if (!offer) return sum;
    const commission = offer.commission_rate || 0;
    const fixedSalary = offer.fixed_salary || 0;
    // Estimation basique : salaire fixe + 10% de commission estimée sur 5000€ de panier moyen
    return sum + fixedSalary + (commission / 100 * 5000);
  }, 0);

  // Tendance mois/mois
  const monthTrend = dealsLastMonth > 0
    ? Math.round(((dealsThisMonth - dealsLastMonth) / dealsLastMonth) * 100)
    : dealsThisMonth > 0 ? 100 : 0;

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const currentMonthName = monthNames[now.getMonth()];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Comptabilité</h1>
          <p className="text-gray-500 mt-1">Suivi de vos encaissements, commissions et facturation</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Euro className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{completedDeals.length}</p>
                <p className="text-xs text-gray-500">Deals closés (total)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{dealsThisMonth}</p>
                <p className="text-xs text-gray-500">
                  Deals en {currentMonthName}
                  {monthTrend !== 0 && (
                    <span className={`ml-1 ${monthTrend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      ({monthTrend > 0 ? '+' : ''}{monthTrend}%)
                    </span>
                  )}
                </p>
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
                <p className="text-2xl font-bold text-brand-dark">{estimatedDealRevenue.toLocaleString('fr-FR')}€</p>
                <p className="text-xs text-gray-500">CA estimé (commissions)</p>
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
                <p className="text-2xl font-bold text-brand-dark">{monthlyReferralCommission.toFixed(0)}€</p>
                <p className="text-xs text-gray-500">Parrainage / mois</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parrainage résumé */}
      {activeReferrals.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-amber" />
              Revenus de parrainage
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-600">{monthlyReferralCommission.toFixed(2)}€</p>
                <p className="text-xs text-gray-500">Commission mensuelle</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-600">{activeReferrals.length}</p>
                <p className="text-xs text-gray-500">Filleuls actifs payants</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-amber-600">{totalReferralEarned.toFixed(0)}€</p>
                <p className="text-xs text-gray-500">Total gagné (historique)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historique des deals */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
            <Receipt className="h-5 w-5 text-brand-amber" />
            Historique des deals closés ({completedDeals.length})
          </h2>
        </CardHeader>
        <CardContent>
          {completedDeals.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {completedDeals.map((deal: any) => {
                const offer = deal.offer;
                const commissionRate = offer?.commission_rate || 0;
                const fixedSalary = offer?.fixed_salary || 0;
                const estimatedGain = fixedSalary + (commissionRate / 100 * 5000);
                const dealDate = new Date(deal.updated_at);

                return (
                  <div key={deal.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                        <Briefcase className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-brand-dark truncate">
                          {offer?.title || 'Offre supprimée'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isCandidate
                            ? offer?.manager?.full_name || 'Manager'
                            : deal.closer?.full_name || 'Closer'}
                          {offer?.niche ? ` · ${offer.niche}` : ''}
                          {' · '}
                          {dealDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold text-green-600">
                        ~{estimatedGain.toLocaleString('fr-FR')}€
                      </p>
                      <p className="text-xs text-gray-400">
                        {commissionRate > 0 ? `${commissionRate}% com.` : ''}
                        {fixedSalary > 0 ? `${commissionRate > 0 ? ' + ' : ''}${fixedSalary}€ fixe` : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <Receipt className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucun deal closé pour le moment</p>
              <p className="text-sm text-gray-400 mt-1">
                Vos commissions et encaissements apparaîtront ici dès que vos missions seront marquées comme complétées.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note légale */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Rappel facturation</p>
              <p className="text-xs text-gray-500 mt-1">
                Les montants affichés sont des estimations basées sur les taux de commission des offres.
                Le CA réel dépend des ventes effectuées. En tant qu&apos;indépendant, vous êtes responsable
                de votre facturation et de vos déclarations fiscales. HUBClosing ne retient ni ne verse de commission directement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
