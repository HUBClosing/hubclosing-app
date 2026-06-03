import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, Badge } from '@/components/ui';
import {
  DollarSign, Phone, Handshake, TrendingUp, Award,
  Video, Briefcase, User, Star
} from 'lucide-react';
import type { PortfolioEntry, PortfolioVideo, Profile } from '@/types/database';
import { CopyLinkButton } from './copy-link-button';

const badgeLevelLabels: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  diamond: 'Diamond',
};

const badgeLevelColors: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  bronze: 'default',
  silver: 'info',
  gold: 'warning',
  platinum: 'success',
  diamond: 'success',
};

const videoTypeLabels: Record<string, string> = {
  presentation: 'Presentation',
  call_recording: "Enregistrement d'appel",
  testimonial: 'Temoignage',
};

const experienceLevelLabels: Record<string, string> = {
  junior: 'Junior',
  intermediaire: 'Intermediaire',
  senior: 'Senior',
  expert: 'Expert',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}

function getVideoThumbnail(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `https://cdn.loom.com/sessions/thumbnails/${loomMatch[1]}-with-play.gif`;
  return null;
}

export default async function SharePortfolioPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: entries }, { data: videos }, { data: profile }] = await Promise.all([
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
      .eq('is_public', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const portfolioEntries: PortfolioEntry[] = entries || [];
  const portfolioVideos: PortfolioVideo[] = videos || [];
  const userProfile: Profile | null = profile;

  // Summary stats
  const totalRevenue = portfolioEntries.reduce((sum, e) => sum + (e.revenue_closed || 0), 0);
  const totalDeals = portfolioEntries.reduce((sum, e) => sum + (e.deals_closed || 0), 0);
  const totalCalls = portfolioEntries.reduce((sum, e) => sum + (e.calls_made || 0), 0);
  const avgCashPerCall = totalCalls > 0 ? totalRevenue / totalCalls : 0;
  const avgConversion = portfolioEntries.length > 0
    ? portfolioEntries.reduce((sum, e) => sum + (e.conversion_rate_gross || 0), 0) / portfolioEntries.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <a href="/dashboard/performance" className="text-sm text-brand-green hover:underline">
            &larr; Retour au portfolio
          </a>
          <h1 className="text-2xl font-bold text-brand-dark mt-2">Mon CV de performance</h1>
          <p className="text-gray-500 mt-1">
            Apercu de votre profil tel que le verront les recruteurs.
          </p>
        </div>
        <CopyLinkButton userId={user.id} />
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="h-16 w-16 bg-brand-light rounded-full flex items-center justify-center flex-shrink-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name || ''} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-brand-green" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-brand-dark">{user.full_name || 'Closer'}</h2>
                {userProfile?.badge_level && (
                  <Badge variant={badgeLevelColors[userProfile.badge_level] || 'default'}>
                    <Award className="h-3 w-3 mr-1" />
                    {badgeLevelLabels[userProfile.badge_level] || userProfile.badge_level}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {userProfile?.score != null && userProfile.score > 0 && (
                  <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                    <Star className="h-4 w-4 text-brand-amber" />
                    Score : {userProfile.score}/100
                  </span>
                )}
                {userProfile?.experience_level && (
                  <Badge variant="info">
                    {experienceLevelLabels[userProfile.experience_level] || userProfile.experience_level}
                  </Badge>
                )}
              </div>

              {user.niches && user.niches.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {user.niches.map((niche) => (
                    <Badge key={niche} variant="default">{niche}</Badge>
                  ))}
                </div>
              )}

              {userProfile?.bio && (
                <p className="text-sm text-gray-600 mt-3">{userProfile.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {portfolioEntries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <DollarSign className="h-6 w-6 text-brand-green mx-auto mb-1" />
            <p className="text-lg font-bold text-brand-dark">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-gray-500">Revenu total close</p>
          </Card>
          <Card className="p-4 text-center">
            <Handshake className="h-6 w-6 text-brand-green mx-auto mb-1" />
            <p className="text-lg font-bold text-brand-dark">{totalDeals}</p>
            <p className="text-xs text-gray-500">Deals closes</p>
          </Card>
          <Card className="p-4 text-center">
            <Phone className="h-6 w-6 text-brand-green mx-auto mb-1" />
            <p className="text-lg font-bold text-brand-dark">{formatCurrency(avgCashPerCall)}</p>
            <p className="text-xs text-gray-500">Cash / appel</p>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-brand-green mx-auto mb-1" />
            <p className="text-lg font-bold text-brand-dark">{avgConversion.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">Conversion moy.</p>
          </Card>
        </div>
      )}

      {/* Performance Table */}
      {portfolioEntries.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-brand-amber" />
              Historique des performances
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Offre</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Niche</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Periode</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Revenu</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Appels</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Deals</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Cash/appel</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Conv. %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {portfolioEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-brand-dark">
                        <div className="flex items-center gap-2">
                          {entry.offer_name}
                          {entry.is_current && <Badge variant="success">En cours</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{entry.niche || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(entry.start_date)} — {entry.is_current ? "Auj." : formatDate(entry.end_date)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-brand-dark">{formatCurrency(entry.revenue_closed)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{entry.calls_made}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{entry.deals_closed}</td>
                      <td className="px-4 py-3 text-right font-medium text-brand-dark">{formatCurrency(entry.cash_per_call)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {entry.conversion_rate_gross != null ? `${entry.conversion_rate_gross}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Videos */}
      {portfolioVideos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2 mb-4">
            <Video className="h-5 w-5 text-brand-amber" />
            Videos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolioVideos.map((video) => {
              const thumbnail = getVideoThumbnail(video.url);
              return (
                <Card key={video.id} hover>
                  <a href={video.url} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="relative aspect-video bg-gray-100 rounded-t-xl overflow-hidden">
                      {thumbnail ? (
                        <img src={thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Video className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <Badge variant="default">
                        {videoTypeLabels[video.video_type] || video.video_type}
                      </Badge>
                      <h3 className="font-medium text-brand-dark mt-2">{video.title}</h3>
                      {video.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{video.description}</p>
                      )}
                    </CardContent>
                  </a>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {portfolioEntries.length === 0 && portfolioVideos.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Portfolio vide</h3>
            <p className="mt-1 text-sm text-gray-500">
              Ajoutez des offres et des videos pour creer votre CV de performance.
            </p>
            <div className="mt-4">
              <a
                href="/dashboard/performance"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-green rounded-lg hover:bg-brand-dark transition-colors"
              >
                Completer mon portfolio
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
