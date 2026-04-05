import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { OfferCard } from '@/components/offers/OfferCard';
import { EmptyState } from '@/components/ui';
import { ShoppingBag } from 'lucide-react';

export default async function MarketplacePage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: offers } = await supabase
    .from('offers')
    .select('*, manager:users!manager_id(id, full_name, avatar_url)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Marketplace</h1>
        <p className="text-gray-500 mt-1">Découvrez les offres de closing disponibles</p>
      </div>

      {offers && offers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} showActions />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<ShoppingBag className="h-12 w-12" />}
          title="Aucune offre disponible"
          description="Revenez plus tard pour découvrir de nouvelles opportunités."
        />
      )}
    </div>
  );
}
