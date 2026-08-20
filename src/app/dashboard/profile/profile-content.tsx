'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import type { User, Profile, Skill, ExperienceLevel } from '@/types/database';
import { Card, CardContent, CardHeader, Avatar, Badge, Switch } from '@/components/ui';
import {
  Save, Loader2, CheckCircle2,
  User as UserIcon, Briefcase, Linkedin, Phone,
  Camera, Tag, Clock, Target, Instagram, Video, Mail,
} from 'lucide-react';

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

const NICHE_SUGGESTIONS = [
  'Immobilier', 'Formation', 'Coaching', 'SaaS', 'E-commerce',
  'Crypto', 'Trading', 'Santé', 'Bien-être', 'Marketing digital',
  'Développement personnel', 'Finance', 'Assurance', 'High-ticket',
];

interface ProfileContentProps {
  user: User;
  profile: Profile;
}

export function ProfileContent({ user, profile }: ProfileContentProps) {
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
  const [instagramUrl, setInstagramUrl] = useState(profile.portfolio_url || '');
  const [loomUrl, setLoomUrl] = useState(profile.website_url || '');
  const [emailPro, setEmailPro] = useState((profile as any).email_pro || '');
  const [emailPerso, setEmailPerso] = useState((profile as any).email_perso || '');
  const [skills, setSkills] = useState<Skill[]>(user.skills || []);
  const [niches, setNiches] = useState<string[]>(user.niches || profile.preferred_niches || []);
  const [nicheInput, setNicheInput] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | ''>(profile.experience_level || '');
  const [yearsExperience, setYearsExperience] = useState<string>(user.years_experience?.toString() || '');
  const [availability, setAvailability] = useState(profile.availability || false);
  const [availableHours, setAvailableHours] = useState<string>(profile.available_hours_per_week?.toString() || '');
  const [commissionRate, setCommissionRate] = useState<string>(profile.commission_rate?.toString() || '');
  const [isPublic, setIsPublic] = useState(profile.is_public || false);

  // Recruteur
  const [companyName, setCompanyName] = useState(profile.company_name || '');
  const [industry, setIndustry] = useState(profile.industry || '');

  // Avatar
  const [avatarUploading, setAvatarUploading] = useState(false);

  // ── UI state ──
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const isCandidate = user.role_type === 'candidate' || user.role_type === 'both' || user.role_type === 'admin';
  const isRecruiter = user.role_type === 'recruiter' || user.role_type === 'both' || user.role_type === 'admin';

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadErr) {
        console.error('Upload error:', uploadErr);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', user.id);
      router.refresh();
    } catch (err) {
      console.error('Avatar upload error:', err);
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setError('');
    try {
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
        setError('Erreur lors de la sauvegarde du profil utilisateur');
        console.error('Save user error:', userErr.message);
        return;
      }

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          bio: (bio.trim() || '').slice(0, 500) || null,
          linkedin_url: linkedinUrl.trim() || null,
          portfolio_url: instagramUrl.trim() || null,
          website_url: loomUrl.trim() || null,
          email_pro: emailPro.trim() || null,
          email_perso: emailPerso.trim() || null,
          experience_level: experienceLevel || null,
          availability,
          available_hours_per_week: availableHours ? parseInt(availableHours) : null,
          commission_rate: commissionRate ? parseFloat(commissionRate) : null,
          preferred_niches: niches,
          is_public: isPublic,
          company_name: companyName.trim() || null,
          industry: industry.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (profileErr) {
        setError('Erreur lors de la sauvegarde du profil détaillé');
        console.error('Save profile error:', profileErr.message);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } catch (err) {
      setError('Erreur inattendue');
      console.error('Save profile error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">Mon profil</h1>

      {/* ═══════ AVATAR + IDENTITÉ ═══════ */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-5 mb-6">
            <div className="relative group">
              <Avatar src={user.avatar_url} fallback={user.full_name || user.email} size="lg" />
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                {avatarUploading ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={avatarUploading}
                />
              </label>
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-dark">{user.full_name || 'Sans nom'}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.role === 'closer' ? 'success' : user.role === 'manager' ? 'info' : 'warning'} className="capitalize">{user.role}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════ INFORMATIONS PERSONNELLES ═══════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-brand-dark" />
            <h2 className="font-semibold text-brand-dark">Informations personnelles</h2>
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
              <label className="text-sm font-medium text-gray-700 block mb-1">
                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> Téléphone</span>
              </label>
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

          {/* Emails */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1 flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> Email pro
              </label>
              <input
                type="email"
                value={emailPro}
                onChange={(e) => setEmailPro(e.target.value)}
                placeholder="pro@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1 flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> Email perso
              </label>
              <input
                type="email"
                value={emailPerso}
                onChange={(e) => setEmailPerso(e.target.value)}
                placeholder="perso@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
              />
            </div>
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
                <Instagram className="h-3.5 w-3.5" /> Profil Instagram
              </label>
              <input
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/votreprofil"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1 flex items-center gap-1">
                <Video className="h-3.5 w-3.5" /> Loom de présentation
              </label>
              <input
                value={loomUrl}
                onChange={(e) => setLoomUrl(e.target.value)}
                placeholder="https://loom.com/share/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════ PROFIL CANDIDAT ═══════ */}
      {isCandidate && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-amber" />
              <h2 className="font-semibold text-brand-dark">Profil candidat</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Skills */}
            <div>
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
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> Niches</span>
              </label>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Niveau d&apos;expérience</span>
                </label>
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
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Disponible pour des missions</p>
                <p className="text-xs text-gray-500">Visible par les recruteurs dans la CVthèque</p>
              </div>
              <Switch checked={availability} onChange={setAvailability} />
            </div>

            {availability && (
              <div>
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

            {/* Commission */}
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

            {/* Profil public */}
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-700">Profil public</p>
                <p className="text-xs text-green-600">Rendre votre profil visible dans la CVthèque</p>
              </div>
              <Switch checked={isPublic} onChange={setIsPublic} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════ PROFIL RECRUTEUR ═══════ */}
      {isRecruiter && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-brand-green" />
              <h2 className="font-semibold text-brand-dark">Profil recruteur</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nom de l&apos;agence</label>
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
          </CardContent>
        </Card>
      )}

      {/* ═══════ BOUTON SAUVEGARDER ═══════ */}
      <div className="flex items-center gap-3">
        <button
          onClick={saveProfile}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? 'Profil sauvegardé !' : 'Sauvegarder le profil'}
        </button>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}
