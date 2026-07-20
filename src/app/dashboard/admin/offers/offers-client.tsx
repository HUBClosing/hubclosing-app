'use client';

import { useState } from 'react';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { Search, MoreVertical, PauseCircle, PlayCircle, XCircle, Star, StarOff, Loader2, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Offer {
  id: string;
  title: string;
  status: string;
  commission_rate?: number;
  commission_value?: number;
  niche?: string;
  offer_type?: string;
  is_premium?: boolean;
  is_featured?: boolean;
  applications_count?: number;
  created_at: string;
  manager?: { full_name?: string; email?: string } | null;
}

const statusVariants: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  paused: 'warning',
  closed: 'error',
  draft: 'default',
};
const statusLabels: Record<string, string> = {
  active: 'Active',
  paused: 'En pause',
  closed: 'Fermée',
  draft: 'Brouillon',
};

export function OffersClient({ offers }: { offers: Offer[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const filtered = offers.filter(o => {
    const matchSearch = !search ||
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      o.manager?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.niche?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const updateOfferStatus = async (offerId: string, newStatus: string) => {
    setLoading(offerId);
    setActionError(null);
    const { error } = await supabase
      .from('offers')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', offerId);
    if (error) {
      console.error('Admin offer update error:', error);
      setActionError('Erreur lors de la mise à jour du statut');
    } else {
      router.refresh();
    }
    setLoading(null);
    setMenuOpen(null);
  };

  const toggleFeatured = async (offerId: string, current: boolean) => {
    setLoading(offerId);
    setActionError(null);
    const { error } = await supabase
      .from('offers')
      .update({ is_featured: !current, updated_at: new Date().toISOString() })
      .eq('id', offerId);
    if (error) {
      console.error('Admin offer feature error:', error);
      setActionError('Erreur lors de la mise en avant');
    } else {
      router.refresh();
    }
    setLoading(null);
    setMenuOpen(null);
  };

  const togglePremium = async (offerId: string, current: boolean) => {
    setLoading(offerId);
    setActionError(null);
    const { error } = await supabase
      .from('offers')
      .update({ is_premium: !current, updated_at: new Date().toISOString() })
      .eq('id', offerId);
    if (error) {
      console.error('Admin offer premium error:', error);
      setActionError('Erreur lors du changement premium');
    } else {
      router.refresh();
    }
    setLoading(null);
    setMenuOpen(null);
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une offre, manager, niche..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'paused', 'closed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-brand-green text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'Toutes' : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{actionError}</p>
        </div>
      )}

      {/* Liste */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((offer) => (
            <Card key={offer.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-brand-dark truncate">{offer.title}</h3>
                      {offer.is_featured && (
                        <Star className="h-4 w-4 text-amber-500 shrink-0 fill-amber-500" />
                      )}
                      {offer.is_premium && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium shrink-0">Premium</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {offer.manager?.full_name || offer.manager?.email || 'Manager inconnu'}
                      {offer.niche ? ` · ${offer.niche}` : ''}
                      {offer.offer_type ? ` · ${offer.offer_type}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {offer.commission_value ? `${offer.commission_value}%` : ''}
                      {offer.applications_count !== undefined ? ` · ${offer.applications_count} candidature(s)` : ''}
                      {' · '}
                      {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={statusVariants[offer.status] || 'default'}>
                      {statusLabels[offer.status] || offer.status}
                    </Badge>

                    <div className="relative">
                      {loading === offer.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      ) : (
                        <button
                          onClick={() => setMenuOpen(menuOpen === offer.id ? null : offer.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                      )}

                      {menuOpen === offer.id && (
                        <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-52">
                          <Link
                            href={`/dashboard/marketplace/${offer.id}`}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                            onClick={() => setMenuOpen(null)}
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                            Voir l&apos;offre
                          </Link>

                          <div className="border-t border-gray-100 my-1" />

                          {offer.status === 'active' && (
                            <button
                              onClick={() => updateOfferStatus(offer.id, 'paused')}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                            >
                              <PauseCircle className="w-4 h-4 text-amber-500" />
                              Mettre en pause
                            </button>
                          )}

                          {offer.status === 'paused' && (
                            <button
                              onClick={() => updateOfferStatus(offer.id, 'active')}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                            >
                              <PlayCircle className="w-4 h-4 text-green-500" />
                              Réactiver
                            </button>
                          )}

                          {offer.status !== 'closed' && (
                            <button
                              onClick={() => updateOfferStatus(offer.id, 'closed')}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                            >
                              <XCircle className="w-4 h-4 text-red-500" />
                              Fermer définitivement
                            </button>
                          )}

                          <div className="border-t border-gray-100 my-1" />

                          <button
                            onClick={() => toggleFeatured(offer.id, offer.is_featured === true)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                          >
                            {offer.is_featured ? (
                              <><StarOff className="w-4 h-4 text-gray-400" /> Retirer mise en avant</>
                            ) : (
                              <><Star className="w-4 h-4 text-amber-500" /> Mettre en avant</>
                            )}
                          </button>

                          <button
                            onClick={() => togglePremium(offer.id, offer.is_premium === true)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                          >
                            {offer.is_premium ? (
                              <span className="flex items-center gap-2"><XCircle className="w-4 h-4 text-gray-400" /> Retirer premium</span>
                            ) : (
                              <span className="flex items-center gap-2"><Star className="w-4 h-4 text-purple-500" /> Marquer premium</span>
                            )}
                          </button>

                          <div className="border-t border-gray-100 my-1" />
                          <button onClick={() => setMenuOpen(null)} className="w-full px-4 py-2 text-sm text-gray-400 hover:bg-gray-50">
                            Fermer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 text-sm">
          {search || statusFilter !== 'all' ? 'Aucune offre trouvée avec ces filtres' : 'Aucune offre sur la plateforme'}
        </div>
      )}
    </div>
  );
}
