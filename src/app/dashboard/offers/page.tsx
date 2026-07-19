import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui';
import {
  Briefcase, Plus, Eye, Users, Clock, Pause, CheckCircle, XCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Offer, SubscriptionTier } from '@/types/database';

function getMaxActiveOffers(tier: SubscriptionTier): number {
  if (tier === 'agency') return Infinity;
  if (tier === 'business') return 5;
  return 1;
}

const statusConfig: Record<string, { label: string; color: string; Icon: typeof CheckCircle }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', Icon: CheckCircle },
  paused: { label: 'En pause', color: 'bg-amber-100 text-amber-700', Icon: Pause },
  closed: { label: 'Fermée', color: 'bg-gray-100 text-gray-600', Icon: XCircle },
};

export default async function OffersPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: offers } = await supabase
    .from('offers')
    .select('*')
    .eq('manager_id', user.id)
    .order('created_at', { ascending: false });

  const allOffers = (offers || []) as Offer[];
  const activeOffers = allOffers.filter(o => o.status === 'active');
  const maxOffers = getMaxActiveOffers(user.tier);
  const canPost = activeOffers.length < maxOffers;
  const totalViews = allOffers.reduce((sum, o) => sum + (o.views_count || 0), 0);
  const totalApplications = allOffers.reduce((sum, o) => sum + (o.application_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Mes offres</h1>
          <p className="text-gray-500 mt-1">
            {activeOffers.length}/{maxOffers === Infinity ? '∞' : maxOffers} offre{activeOffers.length !== 1 ? 's' : ''} active{activeOffers.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canPost ? (
          <a
            href="/dashboard/offers/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-amber text-white rounded-lg hover:bg-brand-amber/90 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Publier une offre
          </a>
        ) : (
          <div className="text-right">
            <span className="text-sm text-gray-500 block">Limite atteinte</span>
            <a href="/dashboard/subscription" className="text-xs text-brand-amber hover:underline">
              Passer au plan supérieur
            </a>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-dark">{allOffers.length}</p>
                <p className="text-xs text-gray-500">Total offres</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Eye className="h-5 w-5 text-green-600" />
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
                <p className="text-2xl font-bold text-brand-dark">{totalApplications}</p>
                <p className="text-xs text-gray-500">Candidatures reçues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des offres */}
      {allOffers.length > 0 ? (
        <div className="space-y-3">
          {allOffers.map((offer) => {
            const config = statusConfig[offer.status] || statusConfig.closed;
            const StatusIcon = config.Icon;
            return (
              <Card key={offer.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-brand-dark text-base truncate">{offer.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>
                          {config.label}
                        </span>
                        {offer.is_boosted && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-amber/10 text-brand-amber font-medium">
                            Boostée
                          </span>
                        )}
                        {offer.is_premium && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                            Premium
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1">{offer.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true, locale: fr })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {offer.views_count || 0} vues
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {offer.application_count || 0} candidature{(offer.application_count || 0) !== 1 ? 's' : ''}
                        </span>
                        {offer.niche && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{offer.niche}</span>
                        )}
                      </div>
                    </div>
                    <a
                      href={`/dashboard/offers/${offer.id}`}
                      className="shrink-0 text-sm font-medium text-brand-dark bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Gérer
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucune offre publiée</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Publiez votre première offre pour recevoir des candidatures.</p>
            {canPost && (
              <a
                href="/dashboard/offers/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-amber text-white rounded-lg hover:bg-brand-amber/90 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4" /> Publier une offre
              </a>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
