import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { Card, CardContent, Badge, Button, Avatar } from '@/components/ui';
import { notFound } from 'next/navigation';
import { DollarSign, Users, Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default async function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: offer } = await supabase
    .from('offers')
    .select('*, manager:users!manager_id(*)')
    .eq('id', id)
    .single();

  if (!offer) notFound();

  const { data: existingApp } = await supabase
    .from('applications')
    .select('id, status')
    .eq('offer_id', id)
    .eq('closer_id', user.id)
    .maybeSingle();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <a href="/dashboard/marketplace" className="text-sm text-brand-green hover:underline">&larr; Retour à la marketplace</a>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-brand-dark">{offer.title}</h1>
              <div className="flex items-center gap-3 mt-2">
                <Avatar src={offer.manager?.avatar_url} fallback={offer.manager?.full_name || ''} size="sm" />
                <span className="text-gray-600">{offer.manager?.full_name}</span>
              </div>
            </div>
            <Badge variant={offer.status === 'active' ? 'success' : 'warning'}>{offer.status}</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <DollarSign className="h-5 w-5 mx-auto text-brand-green mb-1" />
              <p className="text-xs text-gray-500">Commission</p>
              <p className="font-semibold">{offer.commission_value}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Users className="h-5 w-5 mx-auto text-brand-green mb-1" />
              <p className="text-xs text-gray-500">Candidatures</p>
              <p className="font-semibold">{offer.applications_count}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Clock className="h-5 w-5 mx-auto text-brand-green mb-1" />
              <p className="text-xs text-gray-500">Publié</p>
              <p className="font-semibold text-sm">{formatDistanceToNow(new Date(offer.created_at), { locale: fr })}</p>
            </div>
            {offer.product_url && (
              <a href={offer.product_url} target="_blank" rel="noopener noreferrer" className="bg-gray-50 rounded-lg p-3 text-center hover:bg-gray-100 transition-colors">
                <ExternalLink className="h-5 w-5 mx-auto text-brand-green mb-1" />
                <p className="text-xs text-gray-500">Produit</p>
                <p className="font-semibold text-sm text-brand-green">Voir</p>
              </a>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-brand-dark mb-2">Description</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{offer.description}</p>
          </div>

          {offer.requirements && (
            <div>
              <h3 className="font-semibold text-brand-dark mb-2">Prérequis</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{offer.requirements}</p>
            </div>
          )}

          {user.role === 'closer' && offer.status === 'active' && (
            <div className="pt-4 border-t">
              {existingApp ? (
                <div className="text-center">
                  <Badge variant={existingApp.status === 'accepted' ? 'success' : existingApp.status === 'rejected' ? 'error' : 'warning'}>
                    Candidature {existingApp.status === 'pending' ? 'en attente' : existingApp.status === 'accepted' ? 'acceptée' : 'refusée'}
                  </Badge>
                </div>
              ) : (
                <a href={`/dashboard/marketplace/${offer.id}/apply`} className="block">
                  <Button className="w-full">Postuler à cette offre</Button>
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
