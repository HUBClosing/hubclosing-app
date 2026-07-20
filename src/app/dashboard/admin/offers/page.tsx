import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { StatsCard } from '@/components/ui';
import { Briefcase, CheckCircle, PauseCircle, XCircle, Star } from 'lucide-react';
import { OffersClient } from './offers-client';

export default async function AdminOffersPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: offers } = await supabase
    .from('offers')
    .select('*, manager:users!manager_id(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(500);

  const allOffers = offers || [];
  const active = allOffers.filter(o => o.status === 'active').length;
  const paused = allOffers.filter(o => o.status === 'paused').length;
  const closed = allOffers.filter(o => o.status === 'closed').length;
  const featured = allOffers.filter(o => o.is_featured).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">Gestion des offres</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatsCard title="Total" value={allOffers.length} icon={<Briefcase className="h-6 w-6" />} />
        <StatsCard title="Actives" value={active} icon={<CheckCircle className="h-6 w-6" />} />
        <StatsCard title="En pause" value={paused} icon={<PauseCircle className="h-6 w-6" />} />
        <StatsCard title="Fermées" value={closed} icon={<XCircle className="h-6 w-6" />} />
        <StatsCard title="Mises en avant" value={featured} icon={<Star className="h-6 w-6" />} />
      </div>

      <OffersClient offers={allOffers} />
    </div>
  );
}
