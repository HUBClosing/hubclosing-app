import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import type { Offer } from '@/types/database';
import { MapPin, Users, Clock, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OfferCardProps {
  offer: Offer;
  showActions?: boolean;
  onApply?: () => void;
}

export function OfferCard({ offer, showActions, onApply }: OfferCardProps) {
  const statusVariant = {
    active: 'success' as const,
    paused: 'warning' as const,
    closed: 'error' as const,
  };

  return (
    <Card hover className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-brand-dark text-lg">{offer.title}</h3>
          {offer.manager && (
            <p className="text-sm text-gray-500">{offer.manager.full_name}</p>
          )}
        </div>
        <Badge variant={statusVariant[offer.status]}>{offer.status}</Badge>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{offer.description}</p>

      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <DollarSign className="h-4 w-4" />
          <span>{offer.commission_value}% commission</span>
        </div>
        {offer.product_type && (
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{offer.product_type}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>{offer.applications_count} candidature(s)</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{formatDistanceToNow(new Date(offer.created_at), { addSuffix: true, locale: fr })}</span>
        </div>
      </div>

      {showActions && offer.status === 'active' && (
        <div className="flex gap-2">
          <a
            href={`/dashboard/marketplace/${offer.id}`}
            className="text-sm font-medium text-brand-green hover:underline"
          >
            Voir les détails
          </a>
          {onApply && (
            <button
              onClick={onApply}
              className="ml-auto text-sm font-medium bg-brand-green text-white px-4 py-1.5 rounded-lg hover:bg-brand-dark transition-colors"
            >
              Postuler
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
