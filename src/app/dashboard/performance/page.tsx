import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { StatsCard, Card, CardContent, Badge, EmptyState } from '@/components/ui';
import { DollarSign, Phone, Handshake, TrendingUp, Briefcase, Video, Plus, Share2 } from 'lucide-react';
import Link from 'next/link';
import type { PortfolioEntry, PortfolioVideo } from '@/types/database';

const videoTypeLabels: Record<string, string> = {
  presentation: 'Presentation',
  call_recording: "Enregistrement d'appel",
  testimonial: 'Temoignage',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}

function getVideoThumbnail(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  // Loom
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `https://cdn.loom.com/sessions/thumbnails/${loomMatch[1]}-with-play.gif`;
  return null;
}

export default async function PerformancePage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: entries }, { data: videos }] = await Promise.all([
    supabase
      .from('portfolio_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('is_current', { ascending: false })
      .order('start_date', { ascending: false }),
    supabase
      .from('portfolio_videos')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true }),
  ]);

  const portfolioEntries: PortfolioEntry[] = entries || [];
  const portfolioVideos: PortfolioVideo[] = videos || [];

  // Calculate summary stats
  const totalRevenue = portfolioEntries.reduce((sum, e) => sum + (e.revenue_closed || 0), 0);
  const totalDeals = portfolioEntries.reduce((sum, e) => sum + (e.deals_closed || 0), 0);
  const totalCalls = portfolioEntries.reduce((sum, e) => sum + (e.calls_made || 0), 0);
  const avgCashPerCall = totalCalls > 0 ? totalRevenue / totalCalls : 0;
  const avgConversion = portfolioEntries.length > 0
    ? portfolioEntries.reduce((sum, e) => sum + (e.conversion_rate_gross || 0), 0) / portfolioEntries.length
    : 0;

  const hasEntries = portfolioEntries.length > 0;
  const hasVideos = portfolioVideos.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Mon portfolio de performance</h1>
          <p className="text-gray-500 mt-1">
            Votre CV de closer : performances par offre, statistiques et videos.
          </p>
        </div>
        <Link
          href="/dashboard/performance/share"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-green border border-brand-green rounded-lg hover:bg-brand-green/5 transition-colors"
        >
          <Share2 className="h-4 w-4" />
          Partager mon CV
        </Link>
      </div>

      {/* Summary Stats */}
      {hasEntries && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Revenu total close"
            value={formatCurrency(totalRevenue)}
            icon={<DollarSign className="h-6 w-6" />}
          />
          <StatsCard
            title="Deals closes"
            value={totalDeals}
            icon={<Handshake className="h-6 w-6" />}
          />
          <StatsCard
            title="Cash / appel moyen"
            value={formatCurrency(avgCashPerCall)}
            icon={<Phone className="h-6 w-6" />}
          />
          <StatsCard
            title="Conversion moyenne"
            value={`${avgConversion.toFixed(1)}%`}
            icon={<TrendingUp className="h-6 w-6" />}
          />
        </div>
      )}

      {/* Portfolio Entries Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-brand-amber" />
            Mes offres
          </h2>
          <Link
            href="/dashboard/performance/add-entry"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-brand-green rounded-lg hover:bg-brand-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter une offre
          </Link>
        </div>

        {hasEntries ? (
          <div className="space-y-4">
            {portfolioEntries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-brand-dark">{entry.offer_name}</h3>
                        {entry.is_current && <Badge variant="success">En cours</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {entry.niche && <Badge variant="info">{entry.niche}</Badge>}
                        <span className="text-sm text-gray-500">
                          {formatDate(entry.start_date)} — {entry.is_current ? "Aujourd'hui" : formatDate(entry.end_date)}
                        </span>
                      </div>
                    </div>
                    {entry.product_price && (
                      <span className="text-sm text-gray-500">
                        Produit : {formatCurrency(entry.product_price)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Revenu close</p>
                      <p className="text-lg font-bold text-brand-dark">{formatCurrency(entry.revenue_closed)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Appels</p>
                      <p className="text-lg font-bold text-brand-dark">{entry.calls_made}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Deals closes</p>
                      <p className="text-lg font-bold text-brand-dark">{entry.deals_closed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cash / appel</p>
                      <p className="text-lg font-bold text-brand-dark">{formatCurrency(entry.cash_per_call)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Conversion brute</p>
                      <p className="text-lg font-bold text-brand-dark">
                        {entry.conversion_rate_gross != null ? `${entry.conversion_rate_gross}%` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Conversion nette</p>
                      <p className="text-lg font-bold text-brand-dark">
                        {entry.conversion_rate_net != null ? `${entry.conversion_rate_net}%` : '—'}
                      </p>
                    </div>
                  </div>

                  {entry.notes && (
                    <p className="mt-4 text-sm text-gray-600 border-t border-gray-100 pt-3">{entry.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent>
              <EmptyState
                icon={<Briefcase className="h-12 w-12" />}
                title="Aucune offre enregistree"
                description="Ajoutez vos performances par offre pour construire votre CV de closer. Chaque offre montre vos stats de closing aux recruteurs."
                action={
                  <Link
                    href="/dashboard/performance/add-entry"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-green rounded-lg hover:bg-brand-dark transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter ma premiere offre
                  </Link>
                }
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Videos Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
            <Video className="h-5 w-5 text-brand-amber" />
            Mes videos
          </h2>
          <Link
            href="/dashboard/performance/add-video"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-brand-green rounded-lg hover:bg-brand-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter une video
          </Link>
        </div>

        {hasVideos ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolioVideos.map((video) => {
              const thumbnail = getVideoThumbnail(video.url);
              return (
                <Card key={video.id} hover>
                  <a href={video.url} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="relative aspect-video bg-gray-100 rounded-t-xl overflow-hidden">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Video className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="default">
                          {videoTypeLabels[video.video_type] || video.video_type}
                        </Badge>
                        {video.is_public && <Badge variant="success">Public</Badge>}
                      </div>
                      <h3 className="font-medium text-brand-dark mt-2">{video.title}</h3>
                      {video.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{video.description}</p>
                      )}
                      {video.offer_name && (
                        <p className="text-xs text-gray-400 mt-2">Offre : {video.offer_name}</p>
                      )}
                    </CardContent>
                  </a>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent>
              <EmptyState
                icon={<Video className="h-12 w-12" />}
                title="Aucune video ajoutee"
                description="Ajoutez des videos de presentation, enregistrements d'appels ou temoignages pour renforcer votre profil."
                action={
                  <Link
                    href="/dashboard/performance/add-video"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-green rounded-lg hover:bg-brand-dark transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter ma premiere video
                  </Link>
                }
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
