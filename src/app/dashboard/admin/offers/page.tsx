import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, Badge, StatsCard, EmptyState } from '@/components/ui';
import { Briefcase, CheckCircle, PauseCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default async function AdminOffersPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: offers } = await supabase
    .from('offers')
    .select('*, manager:users!manager_id(full_name, email)')
    .order('created_at', { ascending: false });

  const allOffers = offers || [];
  const active = allOffers.filter(o => o.status === 'active').length;
  const paused = allOffers.filter(o => o.status === 'paused').length;
  const closed = allOffers.filter(o => o.status === 'closed').length;

  const statusVariants: Record<string, 'success' | 'warning' | 'error'> = { active: 'success', paused: 'warning', closed: 'error' };
  const statusLabels: Record<string, string> = { active: 'Active', paused: 'En pause', closed: 'Fermée' };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">Gestion des offres</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total" value={allOffers.length} icon={<Briefcase className="h-6 w-6" />} />
        <StatsCard title="Actives" value={active} icon={<CheckCircle className="h-6 w-6" />} />
        <StatsCard title="En pause" value={paused} icon={<PauseCircle className="h-6 w-6" />} />
        <StatsCard title="Fermées" value={closed} icon={<XCircle className="h-6 w-6" />} />
      </div>

      {allOffers.length > 0 ? (
        <div className="space-y-3">
          {allOffers.map((offer: any) => (
            <Card key={offer.id} hover>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-brand-dark">{offer.title}</h3>
                  <p className="text-sm text-gray-500">{offer.manager?.full_name || offer.manager?.email} &middot; {offer.commission_value}% &middot; {offer.applications_count} candidature(s)</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(offer.created_at), { addSuffix: true, locale: fr })}</p>
                </div>
                <Badge variant={statusVariants[offer.status]}>{statusLabels[offer.status]}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Briefcase className="h-12 w-12" />} title="Aucune offre" description="Aucune offre n'a été créée sur la plateforme." />
      )}
    </div>
  );
}
