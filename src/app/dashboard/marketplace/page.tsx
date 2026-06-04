import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { MarketplaceContent } from './marketplace-content';
import { ShoppingBag } from 'lucide-react';

export default async function MarketplacePage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: offers } = await supabase
    .from('offers')
    .select('*, manager:users!manager_id(id, full_name, avatar_url)')
    .eq('status', 'active')
    .order('is_boosted', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Marketplace</h1>
        <p className="text-gray-500 mt-1">
          {(offers?.length || 0)} offre{(offers?.length || 0) > 1 ? 's' : ''} disponible{(offers?.length || 0) > 1 ? 's' : ''}
        </p>
      </div>

      <MarketplaceContent offers={offers || []} user={user} />
    </div>
  );
}
