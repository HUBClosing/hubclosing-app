import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { OfferCard } from '@/components/offers/OfferCard';
import { EmptyState, Button } from '@/components/ui';
import { Briefcase, Plus } from 'lucide-react';

export default async function OffersPage() {
  const user = await requireRole('manager');
  const supabase = await createClient();

  const { data: offers } = await supabase
    .from('offers')
    .select('*')
    .eq('manager_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Mes offres</h1>
          <p className="text-gray-500 mt-1">Gérez vos offres de closing</p>
        </div>
        <a href="/dashboard/offers/new">
          <Button><Plus className="h-4 w-4 mr-2" /> Nouvelle offre</Button>
        </a>
      </div>

      {offers && offers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Briefcase className="h-12 w-12" />}
          title="Aucune offre créée"
          description="Créez votre première offre pour attirer des closers."
          action={<a href="/dashboard/offers/new"><Button>Créer une offre</Button></a>}
        />
      )}
    </div>
  );
}
