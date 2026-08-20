import { requireAdmin } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { Card, CardContent, CardHeader, Avatar, Badge } from '@/components/ui';
import {
  ArrowLeft, Mail, Phone, Linkedin, Instagram, Video,
  Tag, Clock, Briefcase, Shield, Target, Globe, Calendar,
  CheckCircle2, XCircle, Eye, CreditCard, UserCircle,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ImpersonateButton } from './impersonate-button';

const SKILL_LABELS: Record<string, string> = {
  closing: 'Closing',
  setting: 'Setting',
  management: 'Management',
  hos: 'HOS',
  coaching: 'Coaching',
  training: 'Formation',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  junior: 'Junior (0-1 an)',
  intermediaire: 'Intermédiaire (1-3 ans)',
  senior: 'Senior (3-5 ans)',
  expert: 'Expert (5+ ans)',
};

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const adminClient = getSupabaseAdmin();

  const { data: user } = await adminClient
    .from('users')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Utilisateur introuvable</p>
        <Link href="/dashboard/admin/users" className="text-brand-green mt-4 inline-block">
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  const { data: profile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const isCandidate = user.role_type === 'candidate' || user.role_type === 'both' || user.role === 'closer';
  const isRecruiter = user.role_type === 'recruiter' || user.role_type === 'both' || user.role === 'manager';
  const isAdmin = user.role === 'admin' || user.role_type === 'admin';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/admin/users"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-brand-dark">Fiche utilisateur</h1>
      </div>

      {/* Identité */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <Avatar src={user.avatar_url} fallback={user.full_name || user.email} size="lg" />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-brand-dark">{user.full_name || 'Sans nom'}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant={user.role === 'admin' ? 'warning' : user.role === 'closer' ? 'success' : 'info'} className="capitalize">
                  {user.role}
                </Badge>
                {user.role_type && user.role_type !== user.role && (
                  <Badge variant="info" className="capitalize">{user.role_type}</Badge>
                )}
                <Badge variant={user.is_active !== false ? 'success' : 'error'}>
                  {user.is_active !== false ? 'Actif' : 'Inactif'}
                </Badge>
                <span className="text-xs text-gray-400 capitalize">{user.subscription_plan || user.tier || 'free'}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                <Calendar className="h-3.5 w-3.5" />
                Inscrit {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: fr })}
              </div>
            </div>
            {!isAdmin && <ImpersonateButton userId={user.id} />}
          </div>
        </CardContent>
      </Card>

      {/* Coordonnées */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-brand-dark" />
            <h3 className="font-semibold text-brand-dark">Coordonnées</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Téléphone" value={user.phone} />
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email pro" value={profile?.email_pro} />
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email perso" value={profile?.email_perso} />
            <InfoRow icon={<Linkedin className="h-4 w-4" />} label="LinkedIn" value={profile?.linkedin_url} link />
            <InfoRow icon={<Instagram className="h-4 w-4" />} label="Instagram" value={profile?.portfolio_url} link />
            <InfoRow icon={<Video className="h-4 w-4" />} label="Loom" value={profile?.website_url} link />
          </div>
          {profile?.bio && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 mb-1">Bio</p>
              <p className="text-sm text-gray-700">{profile.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profil candidat */}
      {isCandidate && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-amber" />
              <h3 className="font-semibold text-brand-dark">Profil candidat</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Skills */}
            {user.skills && user.skills.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Compétences</p>
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.map((s: string) => (
                    <span key={s} className="px-2.5 py-1 bg-brand-green/10 text-brand-green rounded-full text-xs font-medium">
                      {SKILL_LABELS[s] || s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Niches */}
            {user.niches && user.niches.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> Niches
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {user.niches.map((n: string) => (
                    <span key={n} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{n}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience + disponibilité */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <InfoRow
                icon={<Clock className="h-4 w-4" />}
                label="Expérience"
                value={profile?.experience_level ? EXPERIENCE_LABELS[profile.experience_level] || profile.experience_level : null}
              />
              <InfoRow
                icon={<Clock className="h-4 w-4" />}
                label="Années"
                value={user.years_experience ? `${user.years_experience} ans` : null}
              />
              <div className="flex items-center gap-2">
                {profile?.availability ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-300" />
                )}
                <span className="text-gray-600">
                  {profile?.availability ? 'Disponible' : 'Non disponible'}
                  {profile?.available_hours_per_week ? ` — ${profile.available_hours_per_week}h/sem` : ''}
                </span>
              </div>
              <InfoRow
                icon={<CreditCard className="h-4 w-4" />}
                label="Commission"
                value={profile?.commission_rate ? `${profile.commission_rate}%` : null}
              />
            </div>

            {/* Profil public */}
            <div className="flex items-center gap-2 text-sm">
              {profile?.is_public ? (
                <><Globe className="h-4 w-4 text-green-500" /><span className="text-green-600">Profil public (visible CVthèque)</span></>
              ) : (
                <><Globe className="h-4 w-4 text-gray-300" /><span className="text-gray-400">Profil privé</span></>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profil recruteur */}
      {isRecruiter && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-brand-green" />
              <h3 className="font-semibold text-brand-dark">Profil recruteur</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Agence" value={profile?.company_name} />
              <InfoRow icon={<Tag className="h-4 w-4" />} label="Secteur" value={profile?.industry} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Abonnement */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-dark" />
            <h3 className="font-semibold text-brand-dark">Abonnement & facturation</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <InfoRow icon={<CreditCard className="h-4 w-4" />} label="Plan" value={user.subscription_plan || user.tier || 'free'} />
            <InfoRow icon={<CreditCard className="h-4 w-4" />} label="Stripe Customer" value={user.stripe_customer_id} />
            <InfoRow
              icon={<Calendar className="h-4 w-4" />}
              label="Expiration"
              value={user.tier_expires_at || user.subscription_period_end ? new Date(user.subscription_period_end || user.tier_expires_at).toLocaleDateString('fr-FR') : null}
            />
            <InfoRow icon={<Shield className="h-4 w-4" />} label="Stripe Sub" value={user.stripe_subscription_id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ icon, label, value, link }: { icon: React.ReactNode; label: string; value?: string | null; link?: boolean }) {
  if (!value) {
    return (
      <div className="flex items-center gap-2 text-gray-300">
        {icon}
        <span>{label} : —</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-gray-600">
      {icon}
      <span className="text-gray-400">{label} :</span>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline truncate max-w-[200px]">
          {value.replace(/^https?:\/\//, '')}
        </a>
      ) : (
        <span className="font-medium">{value}</span>
      )}
    </div>
  );
}
