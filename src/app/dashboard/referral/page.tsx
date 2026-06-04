import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { Gift, Users, Coins, TrendingUp, AlertTriangle, Copy, Share2, Euro, UserMinus } from 'lucide-react';
import { TIER_PRICES } from '@/types/database';
import { CopyReferralCode } from './copy-code';

export default async function ReferralPage() {
  const user = await requireUser();
  const supabase = await createClient();

  // Récupérer les filleuls
  const { data: referrals } = await supabase
    .from('referrals')
    .select('*, referred:users!referred_id(id, email, full_name, tier, is_active, created_at)')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false });

  const activeReferrals = referrals?.filter(r => r.status === 'active' && r.referred?.is_active !== false) || [];
  const pendingReferrals = referrals?.filter(r => r.status === 'pending') || [];
  const lostReferrals = referrals?.filter(r => r.status === 'expired' || r.referred?.is_active === false) || [];

  // Calcul des commissions mensuelles
  const monthlyCommission = activeReferrals.reduce((sum, r) => {
    const filleulTier = r.referred?.tier || 'free';
    const price = TIER_PRICES[filleulTier as keyof typeof TIER_PRICES] || 0;
    return sum + (price * 0.20); // 20% récurrent
  }, 0);

  const totalEarned = referrals?.reduce((sum, r) => sum + (r.total_earned || 0), 0) || 0;
  const referralCode = user.referral_code || 'HUB-XXXXXX';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Programme de parrainage</h1>
        <p className="text-gray-500 mt-1">Parrainez, gagnez 20% de commission récurrente à vie</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Euro className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{monthlyCommission.toFixed(0)}€</p>
                <p className="text-xs text-gray-500">Commission / mois</p>
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
                <p className="text-2xl font-bold text-brand-dark">{activeReferrals.length}</p>
                <p className="text-xs text-gray-500">Filleuls actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Coins className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{totalEarned.toFixed(0)}€</p>
                <p className="text-xs text-gray-500">Total gagné</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${lostReferrals.length > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <UserMinus className={`h-5 w-5 ${lostReferrals.length > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{lostReferrals.length}</p>
                <p className="text-xs text-gray-500">Filleuls perdus</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Code de parrainage */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
            <Share2 className="h-5 w-5 text-brand-amber" />
            Votre code de parrainage
          </h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <CopyReferralCode code={referralCode} />
            <div className="text-sm text-gray-500">
              <p>Partagez ce code ou le lien ci-dessous :</p>
              <p className="text-brand-dark font-medium mt-1">hubclosing.fr/auth/register?ref={referralCode}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comment ça marche */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
            <Gift className="h-5 w-5 text-brand-amber" />
            Comment ça marche
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Partagez', desc: 'Envoyez votre code à un closer ou recruteur de votre réseau' },
              { step: '2', title: 'Il s\'inscrit', desc: 'Votre filleul crée son compte avec votre code' },
              { step: '3', title: 'Il s\'abonne', desc: 'Quand il passe en plan payant, votre commission démarre' },
              { step: '4', title: 'Vous gagnez', desc: '20% de son abonnement, chaque mois, tant qu\'il reste actif' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="h-10 w-10 rounded-full bg-brand-amber/10 text-brand-amber font-bold text-lg flex items-center justify-center mx-auto mb-2">
                  {item.step}
                </div>
                <h3 className="font-medium text-brand-dark text-sm">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Alerte : si un filleul quitte */}
          <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">Si un filleul annule son abonnement</p>
                <p className="text-xs text-red-600 mt-1">
                  Sa commission s'arrête immédiatement. Votre revenu mensuel baisse.
                  Pour maintenir vos gains, invitez un nouveau membre pour le remplacer.
                  Vous êtes le garant de votre réseau !
                </p>
              </div>
            </div>
          </div>

          {/* Tableau des commissions */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Commissions par plan</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-sm">
              {[
                { plan: 'Starter', price: 9, com: 1.80 },
                { plan: 'Pro', price: 19, com: 3.80 },
                { plan: 'Élite', price: 39, com: 7.80 },
                { plan: 'Business', price: 49, com: 9.80 },
              ].map((item) => (
                <div key={item.plan} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{item.plan} ({item.price}€/mois)</p>
                  <p className="text-lg font-bold text-green-600">{item.com}€</p>
                  <p className="text-xs text-gray-400">/mois par filleul</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des filleuls */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-amber" />
            Vos filleuls ({(referrals?.length || 0)})
          </h2>
        </CardHeader>
        <CardContent>
          {referrals && referrals.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {referrals.map((ref) => {
                const filleul = ref.referred;
                const isActive = ref.status === 'active' && filleul?.is_active !== false;
                const tierPrice = TIER_PRICES[(filleul?.tier || 'free') as keyof typeof TIER_PRICES] || 0;
                const commission = tierPrice * 0.20;

                return (
                  <div key={ref.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {filleul?.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-brand-dark">
                          {filleul?.full_name || filleul?.email || 'En attente'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {filleul?.tier === 'free' ? 'Gratuit (pas encore converti)' :
                           `Plan ${filleul?.tier} — ${tierPrice}€/mois`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {isActive && commission > 0 ? (
                        <span className="text-sm font-semibold text-green-600">+{commission.toFixed(2)}€/mois</span>
                      ) : isActive && commission === 0 ? (
                        <span className="text-xs text-gray-400">En attente d'upgrade</span>
                      ) : (
                        <span className="text-xs text-red-500 flex items-center gap-1">
                          <UserMinus className="h-3 w-3" /> Perdu
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucun filleul pour le moment</p>
              <p className="text-sm text-gray-400 mt-1">
                Partagez votre code pour commencer à gagner des commissions.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
