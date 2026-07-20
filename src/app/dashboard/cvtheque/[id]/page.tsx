import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, Badge, Avatar } from '@/components/ui';
import {
  ArrowLeft, Star, Shield, Trophy, Crown, Gem,
  Briefcase, DollarSign, Phone, Handshake, TrendingUp,
  MapPin, Linkedin, Globe, CheckCircle2, XCircle,
  Video, ExternalLink, MessageSquare, Lock, Mail,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { BadgeLevel, ExperienceLevel, Skill, PortfolioEntry, PortfolioVideo, Review } from '@/types/database';
import { BADGE_THRESHOLDS, getRemainingContacts, TIER_LIMITS } from '@/types/database';

const BADGE_ICONS: Record<BadgeLevel, typeof Shield> = {
  bronze: Shield,
  silver: Star,
  gold: Trophy,
  platinum: Crown,
  diamond: Gem,
};

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  junior: 'Junior',
  intermediaire: 'Intermédiaire',
  senior: 'Senior',
  expert: 'Expert',
};

const SKILL_LABELS: Record<Skill, string> = {
  closing: 'Closing',
  setting: 'Setting',
  management: 'Management',
  hos: 'HOS',
  coaching: 'Coaching',
  training: 'Formation',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function getVideoThumbnail(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `https://cdn.loom.com/sessions/thumbnails/${loomMatch[1]}-with-play.gif`;
  return null;
}

export default async function CandidateProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  // Check recruteur
  const isRecruiter =
    user.role_type === 'recruiter' ||
    (user.role_type === 'both' && user.active_role === 'recruiter') ||
    user.role === 'manager' ||
    user.role_type === 'admin';

  if (!isRecruiter) {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  // Fetch candidat + profil
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      user:users!user_id(
        id, full_name, avatar_url, email, skills, niches,
        years_experience, role_type, active_role, tier, is_active, created_at
      )
    `)
    .eq('user_id', id)
    .eq('is_public', true)
    .maybeSingle();

  if (!profile || !profile.user) notFound();

  const candidate = profile.user;

  // Fetch portfolio entries + videos + reviews
  const [{ data: entries }, { data: videos }, { data: reviews }] = await Promise.all([
    supabase
      .from('portfolio_entries')
      .select('*')
      .eq('user_id', id)
      .order('is_current', { ascending: false })
      .order('start_date', { ascending: false }),
    supabase
      .from('portfolio_videos')
      .select('*')
      .eq('user_id', id)
      .eq('is_public', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('reviews')
      .select('*, reviewer:users!reviewer_id(id, full_name, avatar_url)')
      .eq('reviewed_id', id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const portfolioEntries: PortfolioEntry[] = entries || [];
  const portfolioVideos: PortfolioVideo[] = videos || [];
  const publicReviews: Review[] = reviews || [];

  const badgeConfig = BADGE_THRESHOLDS[profile.badge_level as BadgeLevel] || BADGE_THRESHOLDS.bronze;
  const BadgeIcon = BADGE_ICONS[profile.badge_level as BadgeLevel] || Shield;

  const totalRevenue = portfolioEntries.reduce((sum, e) => sum + (e.revenue_closed || 0), 0);
  const totalDeals = portfolioEntries.reduce((sum, e) => sum + (e.deals_closed || 0), 0);
  const totalCalls = portfolioEntries.reduce((sum, e) => sum + (e.calls_made || 0), 0);
  const avgConversion = portfolioEntries.length > 0
    ? portfolioEntries.reduce((sum, e) => sum + (e.conversion_rate_gross || 0), 0) / portfolioEntries.length
    : 0;

  const allNiches = Array.from(new Set([...(profile.preferred_niches || []), ...(candidate.niches || [])]));

  // Quota contacts
  const remainingContacts = getRemainingContacts(user);
  const canContact = remainingContacts > 0;

  // Check if conversation already exists
  const { data: existingConv } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(participant_1.eq.${user.id},participant_2.eq.${id}),and(participant_1.eq.${id},participant_2.eq.${user.id})`)
    .maybeSingle();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <a href="/dashboard/cvtheque" className="text-sm text-brand-green hover:underline flex items-center gap-1">
        <ArrowLeft className="h-3.5 w-3.5" /> Retour à la CVthèque
      </a>

      {/* Profile header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <Avatar src={candidate.avatar_url} fallback={candidate.full_name || candidate.email} size="lg" className="!h-20 !w-20 !text-2xl" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-brand-dark">{candidate.full_name || 'Anonyme'}</h1>
                {profile.is_featured && (
                  <span className="text-brand-amber" title="Profil mis en avant">
                    <Star className="h-5 w-5 fill-current" />
                  </span>
                )}
                {/* Badge */}
                <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${badgeConfig.bgColor} ${badgeConfig.color}`}>
                  <BadgeIcon className="h-4 w-4" />
                  {badgeConfig.label} — {profile.score}/100
                </span>
              </div>

              {/* Experience + availability */}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {profile.experience_level && (
                  <span className="text-sm text-gray-600 capitalize">
                    {EXPERIENCE_LABELS[profile.experience_level as ExperienceLevel]}
                  </span>
                )}
                {candidate.years_experience && (
                  <span className="text-sm text-gray-500">{candidate.years_experience} ans d&apos;expérience</span>
                )}
                {profile.availability ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Disponible
                    {profile.available_hours_per_week && ` (${profile.available_hours_per_week}h/sem)`}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full font-medium">
                    <XCircle className="h-3 w-3" /> Non disponible
                  </span>
                )}
              </div>

              {/* Links */}
              <div className="flex items-center gap-3 mt-3">
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                    <Linkedin className="h-4 w-4" /> LinkedIn
                  </a>
                )}
                {profile.portfolio_url && (
                  <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-gray-600 hover:underline">
                    <Globe className="h-4 w-4" /> Portfolio
                  </a>
                )}
                {profile.website_url && (
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-gray-600 hover:underline">
                    <ExternalLink className="h-4 w-4" /> Site web
                  </a>
                )}
              </div>
            </div>

            {/* CTA Contact */}
            <div className="shrink-0 sm:text-right">
              {existingConv ? (
                <a
                  href={`/dashboard/messages`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-green text-white rounded-lg font-medium text-sm hover:bg-brand-dark transition-colors"
                >
                  <MessageSquare className="h-4 w-4" /> Voir la conversation
                </a>
              ) : canContact ? (
                <a
                  href={`/api/contacts?candidate_id=${id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-green text-white rounded-lg font-medium text-sm hover:bg-brand-dark transition-colors"
                >
                  <Mail className="h-4 w-4" /> Contacter ce candidat
                </a>
              ) : (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-400 rounded-lg font-medium text-sm cursor-not-allowed">
                    <Lock className="h-4 w-4" /> Quota contacts atteint
                  </div>
                  <a href="/dashboard/subscription" className="block text-xs text-brand-amber hover:underline mt-2 font-medium">
                    Augmenter mon quota →
                  </a>
                </div>
              )}
              {canContact && remainingContacts !== Infinity && (
                <p className="text-xs text-gray-400 mt-2">{remainingContacts} contact{remainingContacts > 1 ? 's' : ''} restant{remainingContacts > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio + Skills + Niches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Bio */}
          {profile.bio && (
            <Card>
              <CardContent className="p-5">
                <h2 className="font-semibold text-brand-dark mb-2">À propos</h2>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Stats summary */}
          {portfolioEntries.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <DollarSign className="h-5 w-5 mx-auto text-green-600 mb-1" />
                <p className="text-xs text-gray-500">Revenu closé</p>
                <p className="text-lg font-bold text-brand-dark">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <Handshake className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                <p className="text-xs text-gray-500">Deals closés</p>
                <p className="text-lg font-bold text-brand-dark">{totalDeals}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <Phone className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                <p className="text-xs text-gray-500">Appels réalisés</p>
                <p className="text-lg font-bold text-brand-dark">{totalCalls}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <TrendingUp className="h-5 w-5 mx-auto text-amber-600 mb-1" />
                <p className="text-xs text-gray-500">Conversion moy.</p>
                <p className="text-lg font-bold text-brand-dark">{avgConversion > 0 ? `${avgConversion.toFixed(1)}%` : '—'}</p>
              </div>
            </div>
          )}

          {/* Portfolio Entries */}
          {portfolioEntries.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="font-semibold text-brand-dark mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-brand-amber" /> Expériences ({portfolioEntries.length})
                </h2>
                <div className="space-y-4">
                  {portfolioEntries.map((entry: PortfolioEntry) => (
                    <div key={entry.id} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-brand-dark">{entry.offer_name}</h3>
                            {entry.is_current && <Badge variant="success">En cours</Badge>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {entry.niche && <span className="text-xs text-gray-500">{entry.niche}</span>}
                            <span className="text-xs text-gray-400">
                              {entry.start_date ? format(new Date(entry.start_date), 'MMM yyyy', { locale: fr }) : '?'}
                              {' — '}
                              {entry.is_current ? "Aujourd'hui" : entry.end_date ? format(new Date(entry.end_date), 'MMM yyyy', { locale: fr }) : '?'}
                            </span>
                          </div>
                        </div>
                        {entry.product_price && (
                          <span className="text-xs text-gray-400">Produit : {formatCurrency(entry.product_price)}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">
                        <div><p className="text-xs text-gray-400">Revenu</p><p className="text-sm font-bold text-brand-dark">{formatCurrency(entry.revenue_closed)}</p></div>
                        <div><p className="text-xs text-gray-400">Deals</p><p className="text-sm font-bold text-brand-dark">{entry.deals_closed}</p></div>
                        <div><p className="text-xs text-gray-400">Appels</p><p className="text-sm font-bold text-brand-dark">{entry.calls_made}</p></div>
                        <div><p className="text-xs text-gray-400">Cash/appel</p><p className="text-sm font-bold text-brand-dark">{formatCurrency(entry.cash_per_call)}</p></div>
                        <div><p className="text-xs text-gray-400">Conv.</p><p className="text-sm font-bold text-brand-dark">{entry.conversion_rate_gross != null ? `${entry.conversion_rate_gross}%` : '—'}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Videos */}
          {portfolioVideos.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="font-semibold text-brand-dark mb-4 flex items-center gap-2">
                  <Video className="h-5 w-5 text-brand-amber" /> Vidéos ({portfolioVideos.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {portfolioVideos.map((video: PortfolioVideo) => {
                    const thumbnail = getVideoThumbnail(video.url);
                    return (
                      <a key={video.id} href={video.url} target="_blank" rel="noopener noreferrer"
                        className="block border border-gray-100 rounded-lg overflow-hidden hover:border-brand-green/30 transition-colors">
                        <div className="relative aspect-video bg-gray-100">
                          {thumbnail ? (
                            <img src={thumbnail} alt={video.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Video className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h4 className="text-sm font-medium text-brand-dark truncate">{video.title}</h4>
                          {video.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{video.description}</p>}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          {publicReviews.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="font-semibold text-brand-dark mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-brand-amber" /> Avis ({profile.total_reviews})
                </h2>
                <div className="space-y-4">
                  {publicReviews.map((review: any) => (
                    <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar src={review.reviewer?.avatar_url} fallback={review.reviewer?.full_name || ''} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-brand-dark">{review.reviewer?.full_name || 'Utilisateur'}</p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(review.created_at), 'd MMM yyyy', { locale: fr })}
                          </p>
                        </div>
                        <div className="ml-auto flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < review.rating ? 'text-amber-400 fill-current' : 'text-gray-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-brand-dark mb-3">Compétences</h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill: string) => (
                    <span key={skill} className="text-xs bg-brand-green/10 text-brand-green px-2.5 py-1 rounded-full capitalize font-medium">
                      {SKILL_LABELS[skill as Skill] || skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Niches */}
          {allNiches.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-brand-dark mb-3">Niches</h3>
                <div className="flex flex-wrap gap-2">
                  {allNiches.map((niche: string) => (
                    <span key={niche} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                      {niche}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Specialties */}
          {profile.specialties && profile.specialties.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-brand-dark mb-3">Spécialités</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map((s: string) => (
                    <span key={s} className="text-xs bg-brand-amber/10 text-brand-amber px-2.5 py-1 rounded-full capitalize">
                      {s}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tarifs */}
          {(profile.hourly_rate || profile.commission_rate) && (
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-brand-dark mb-3">Tarifs</h3>
                <div className="space-y-2">
                  {profile.hourly_rate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Taux horaire</span>
                      <span className="font-medium text-brand-dark">{formatCurrency(profile.hourly_rate)}/h</span>
                    </div>
                  )}
                  {profile.commission_rate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Commission</span>
                      <span className="font-medium text-brand-dark">{profile.commission_rate}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Infos profil */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-brand-dark mb-3">Informations</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Membre depuis</span>
                  <span className="text-brand-dark">{format(new Date(candidate.created_at), 'MMMM yyyy', { locale: fr })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Score réputation</span>
                  <span className="font-medium text-brand-dark">{profile.score}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Avis reçus</span>
                  <span className="text-brand-dark">{profile.total_reviews}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vues profil</span>
                  <span className="text-brand-dark">{profile.profile_views}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
