'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import type { User, Profile, Skill, ExperienceLevel, SubscriptionTier } from '@/types/database';
import { TIER_PRICES } from '@/types/database';
import { Card, CardContent, CardHeader, Badge, Switch } from '@/components/ui';
import {
  Save, Loader2, Trash2, Bell, Mail, MessageSquare,
  User as UserIcon, Briefcase, Globe, Linkedin, Phone,
  Crown, ArrowRight, CheckCircle2, Shield, Star, Trophy, Gem,
  CreditCard, Calendar,
} from 'lucide-react';

// ── Config ──

const SKILL_OPTIONS: { value: Skill; label: string }[] = [
  { value: 'closing', label: 'Closing' },
  { value: 'setting', label: 'Setting' },
  { value: 'management', label: 'Management' },
  { value: 'hos', label: 'HOS' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'training', label: 'Formation' },
];

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'junior', label: 'Junior (0-1 an)' },
  { value: 'intermediaire', label: 'Intermédiaire (1-3 ans)' },
  { value: 'senior', label: 'Senior (3-5 ans)' },
  { value: 'expert', label: 'Expert (5+ ans)' },
];

const TIER_LABELS: Record<SubscriptionTier, { label: string; color: string; icon: typeof Shield }> = {
  free: { label: 'Gratuit', color: 'bg-gray-100 text-gray-700', icon: Shield },
  starter: { label: 'Starter', color: 'bg-blue-100 text-blue-700', icon: Star },
  pro: { label: 'Pro', color: 'bg-purple-100 text-purple-700', icon: Trophy },
  elite: { label: 'Elite', color: 'bg-amber-100 text-amber-700', icon: Crown },
  business: { label: 'Business', color: 'bg-green-100 text-green-700', icon: Briefcase },
  agency: { label: 'Agency', color: 'bg-indigo-100 text-indigo-700', icon: Gem },
};

const NICHE_SUGGESTIONS = [
  'Immobilier', 'Formation', 'Coaching', 'SaaS', 'E-commerce',
  'Crypto', 'Trading', 'Santé', 'Bien-être', 'Marketing digital',
  'Développement personnel', 'Finance', 'Assurance', 'High-ticket',
];

interface SettingsContentProps {
  user: User;
  profile: Profile;
}

export function SettingsContent({ user, profile }: SettingsContentProps) {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ── Profile state ──
  const [fullName, setFullName] = useState(user.full_name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url || '');
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolio_url || '');
  const [websiteUrl, setWebsiteUrl] = useState(profile.website_url || '');
  const [skills, setSkills] = useState<Skill[]>(user.skills || []);
  const [niches, setNiches] = useState<string[]>(user.niches || profile.preferred_niches || []);
  const [nicheInput, setNicheInput] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | ''>(profile.experience_level || '');
  const [yearsExperience, setYearsExperience] = useState<string>(user.years_experience?.toString() || '');
  const [availability, setAvailability] = useState(profile.availability || false);
  const [availableHours, setAvailableHours] = useState<string>(profile.available_hours_per_week?.toString() || '');
  const [hourlyRate, setHourlyRate] = useState<string>(profile.hourly_rate?.toString() || '');
  const [commissionRate, setCommissionRate] = useState<string>(profile.commission_rate?.toString() || '');
  const [isPublic, setIsPublic] = useState(profile.is_public || false);

  // Recruteur
  const [companyName, setCompanyName] = useState(profile.company_name || '');
  const [industry, setIndustry] = useState(profile.industry || '');

  // ── Notifications state ──
  const [emailNotif, setEmailNotif] = useState(true);
  const [messageNotif, setMessageNotif] = useState(true);
  const [candidatureNotif, setCandidatureNotif] = useState(true);

  // ── UI state ──
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const isCandidate = user.role_type === 'candidate' || user.role_type === 'both' || user.role_type === 'admin';
  const isRecruiter = user.role_type === 'recruiter' || user.role_type === 'both' || user.role_type === 'admin';

  const tierConfig = TIER_LABELS[user.tier] || TIER_LABELS.free;
  const TierIcon = tierConfig.icon;

  // ── Handlers ──

  const toggleSkill = (skill: Skill) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addNiche = (niche: string) => {
    const trimmed = niche.trim();
    if (trimmed && !niches.includes(trimmed)) {
      setNiches((prev) => [...prev, trimmed]);
    }
    setNicheInput('');
  };

  const removeNiche = (niche: string) => {
    setNiches((prev) => prev.filter((n) => n !== niche));
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileError('');
    try {
      // Update users table
      const { error: userErr } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
          skills,
          niches,
          years_experience: yearsExperience ? parseInt(yearsExperience) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (userErr) {
        setProfileError('Erreur lors de la sauvegarde du profil utilisateur');
        console.error('Save user error:', userErr.message);
        return;
      }

      // Update profiles table
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          bio: (bio.trim() || '').slice(0, 500) || null,
          linkedin_url: linkedinUrl.trim() || null,
          portfolio_url: portfolioUrl.trim() || null,
          website_url: websiteUrl.trim() || null,
          experience_level: experienceLevel || null,
          availability,
          available_hours_per_week: availableHours ? parseInt(availableHours) : null,
          hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
          commission_rate: commissionRate ? parseFloat(commissionRate) : null,
          preferred_niches: niches,
          is_public: isPublic,
          company_name: companyName.trim() || null,
          industry: industry.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (profileErr) {
        setProfileError('Erreur lors de la sauvegarde du profil détaillé');
        console.error('Save profile error:', profileErr.message);
        return;
      }

      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
      router.refresh();
    } catch (err) {
      setProfileError('Erreur inattendue');
      console.error('Save profile error:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const saveNotifications = async () => {
    setSavingNotif(true);
    await supabase.auth.updateUser({
      data: {
        notifications: {
          email: emailNotif,
          messages: messageNotif,
          candidatures: candidatureNotif,
        },
      },
    });
    setSavingNotif(false);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'SUPPRIMER') return;
    setDeleting(true);
    await supabase
      .from('users')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">Paramètres</h1>

      {/* ═══════ ABONNEMENT ═══════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-dark" />
            <h2 className="font-semibold text-brand-dark">Abonnement</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tierConfig.color}`}>
                <TierIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-brand-dark">Plan {tierConfig.label}</p>
                <p className="text-sm text-gray-500">
                  {TIER_PRICES[user.tier as keyof typeof TIER_PRICES] === 0
                    ? 'Gratuit'
                    : `${TIER_PRICES[user.tier as keyof typeof TIER_PRICES]}€/mois`}
                </p>
              </div>
            </div>
            {user.tier !== 'elite' && user.tier !== 'agency' && (
              <a
                href="/dashboard/subscription"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-amber text-white rounded-lg text-sm font-medium hover:bg-brand-amber/90 transition-colors"
              >
                <Crown className="h-4 w-4" /> Upgrader
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          {user.tier_expires_at && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              Renouvellement : {new Date(user.tier_expires_at).toLocaleDateString('fr-FR')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════ PROFIL ═══════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-brand-dark" />
            <h2 className="font-semibold text-brand-dark">Profil</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Nom + Téléphone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Nom complet</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Votre nom"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Téléphone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 6 ..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
            <input
              value={user.email}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Bio <span className="text-gray-400 font-normal">(visible sur votre profil public)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Présentez-vous en quelques lignes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{bio.length}/500 caractères</p>
          </div>

          {/* Liens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1 flex items-center gap-1">
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn
              </label>
              <input
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1 flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" /> Portfolio
              </label>
              <input
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://monportfolio.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1 flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" /> Site web
              </label>
              <input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://monsite.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
              />
            </div>
          </div>

          {/* ── Candidat-specific ── */}
          {isCandidate && (
            <>
              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-brand-amber" /> Profil candidat
                </h3>

                {/* Skills */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 block mb-2">Compétences</label>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => toggleSkill(opt.value)}
                        className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                          skills.includes(opt.value)
                            ? 'bg-brand-green text-white border-brand-green'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-brand-green hover:text-brand-green'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Niches */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 block mb-2">Niches</label>
                  {niches.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {niches.map((n) => (
                        <span key={n} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {n}
                          <button onClick={() => removeNiche(n)} className="hover:text-red-500 transition-colors">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      value={nicheInput}
                      onChange={(e) => setNicheInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNiche(nicheInput); } }}
                      placeholder="Ajouter une niche..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                    />
                    <button
                      onClick={() => addNiche(nicheInput)}
                      disabled={!nicheInput.trim()}
                      className="px-3 py-2 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {NICHE_SUGGESTIONS.filter((s) => !niches.includes(s)).slice(0, 6).map((s) => (
                      <button
                        key={s}
                        onClick={() => addNiche(s)}
                        className="text-xs text-gray-400 hover:text-brand-green border border-dashed border-gray-200 hover:border-brand-green px-2 py-0.5 rounded-full transition-colors"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience + years */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Niveau d&apos;expérience</label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                    >
                      <option value="">Non renseigné</option>
                      {EXPERIENCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Années d&apos;expérience</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      placeholder="ex: 3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                    />
                  </div>
                </div>

                {/* Disponibilité */}
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Disponible pour des missions</p>
                    <p className="text-xs text-gray-500">Visible par les recruteurs dans la CVthèque</p>
                  </div>
                  <Switch checked={availability} onChange={setAvailability} />
                </div>

                {availability && (
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 block mb-1">Heures disponibles / semaine</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={availableHours}
                      onChange={(e) => setAvailableHours(e.target.value)}
                      placeholder="ex: 20"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                    />
                  </div>
                )}

                {/* Tarifs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Taux horaire (€)</label>
                    <input
                      type="number"
                      min={0}
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="ex: 50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Commission souhaitée (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      placeholder="ex: 10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                    />
                  </div>
                </div>

                {/* Profil public */}
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-700">Profil public</p>
                    <p className="text-xs text-green-600">Rendre votre profil visible dans la CVthèque</p>
                  </div>
                  <Switch checked={isPublic} onChange={setIsPublic} />
                </div>
              </div>
            </>
          )}

          {/* ── Recruteur-specific ── */}
          {isRecruiter && (
            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-brand-green" /> Profil recruteur
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Nom de l&apos;entreprise</label>
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Votre entreprise"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Secteur d&apos;activité</label>
                  <input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="ex: Formation en ligne"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="pt-2">
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              {savingProfile ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : profileSaved ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {profileSaved ? 'Profil sauvegardé !' : 'Sauvegarder le profil'}
            </button>
            {profileError && (
              <p className="text-sm text-red-500 mt-2">{profileError}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ═══════ NOTIFICATIONS ═══════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-dark" />
            <h2 className="font-semibold text-brand-dark">Notifications</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-medium text-sm">Notifications par email</p>
                <p className="text-xs text-gray-500">Recevoir des emails pour les mises à jour importantes</p>
              </div>
            </div>
            <Switch checked={emailNotif} onChange={setEmailNotif} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-medium text-sm">Nouveaux messages</p>
                <p className="text-xs text-gray-500">Être notifié à chaque nouveau message reçu</p>
              </div>
            </div>
            <Switch checked={messageNotif} onChange={setMessageNotif} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-medium text-sm">Candidatures</p>
                <p className="text-xs text-gray-500">
                  {isRecruiter ? 'Recevoir les nouvelles candidatures' : 'Suivi de vos candidatures'}
                </p>
              </div>
            </div>
            <Switch checked={candidatureNotif} onChange={setCandidatureNotif} />
          </div>

          <button
            onClick={saveNotifications}
            disabled={savingNotif}
            className="flex items-center gap-2 px-4 py-2 bg-brand-dark text-white rounded-lg text-sm font-medium hover:bg-brand-dark/90 transition-colors disabled:opacity-50"
          >
            {savingNotif ? <Loader2 className="w-4 h-4 animate-spin" /> : notifSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {notifSaved ? 'Sauvegardé !' : 'Sauvegarder'}
          </button>
        </CardContent>
      </Card>

      {/* ═══════ ZONE DANGEREUSE ═══════ */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-red-600 flex items-center gap-2">
            <Trash2 className="w-5 h-5" /> Zone dangereuse
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            La suppression de votre compte est irréversible. Toutes vos données, offres et candidatures seront perdues.
          </p>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Tapez <span className="font-bold text-red-600">SUPPRIMER</span> pour confirmer
            </label>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
            />
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== 'SUPPRIMER' || deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Supprimer définitivement mon compte
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
