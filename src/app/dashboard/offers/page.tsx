import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { SubscriptionTier } from '@/types/database';
import OffersContent from './offers-content';

function getMaxActiveOffers(tier: SubscriptionTier): number {
  if (tier === 'agency') return Infinity;
  if (tier === 'solo' || tier === 'equipe' || tier === 'campagne') return 1;
  return 1;
}

export default async function OffersPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: offers } = await supabase
    .from('offers')
    .select('*, applications(count)')
    .eq('manager_id', user.id)
    .order('created_at', { ascending: false });

  const allOffers = (offers || []).map((o: any) => ({
    ...o,
    _appCount: o.applications?.[0]?.count ?? 0,
  }));
  const activeOffers = allOffers.filter((o: any) => o.status === 'active');
  const maxOffers = getMaxActiveOffers(user.tier);
  const canPost = activeOffers.length < maxOffers;
  const totalViews = allOffers.reduce((sum: number, o: any) => sum + (o.views_count || 0), 0);
  const totalApplications = allOffers.reduce((sum: number, o: any) => sum + o._appCount, 0);

  return (
    <OffersContent
      offers={allOffers}
      canPost={canPost}
      activeCount={activeOffers.length}
      maxOffers={maxOffers === Infinity ? -1 : maxOffers}
      totalViews={totalViews}
      totalApplications={totalApplications}
    />
  );
}
