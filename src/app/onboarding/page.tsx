'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';
import type { RoleType, ActiveRole, Skill } from '@/types/database';
import {
  ArrowRight,
  ArrowLeft,
  Phone,
  Mail,
  User,
  Briefcase,
  Target,
  CheckCircle,
  PhoneCall,
  Crown,
  Clock,
  GraduationCap,
  Users,
  Square,
  CheckSquare,
  Building,
} from 'lucide-react';

type Step = 'role' | 'details' | 'contact' | 'done';
type SelectableRole = 'candidate' | 'recruiter';

const skillLabels: Record<Skill, { label: string; icon: React.ReactNode; description: string }> = {
  closing: { label: 'Closing', icon: <Target className="h-4 w-4" />, description: 'Convertir les prospects en clients' },
  setting: { label: 'Setting', icon: <PhoneCall className="h-4 w-4" />, description: 'Qualifier et booker des RDV' },
  management: { label: 'Management', icon: <Briefcase className="h-4 w-4" />, description: 'Gérer une équipe commerciale' },
  hos: { label: 'Head of Sales', icon: <Crown className="h-4 w-4" />, description: 'Piloter la stratégie sales' },
  coaching: { label: 'Coaching', icon: <GraduationCap className="h-4 w-4" />, description: 'Former et accompagner' },
  training: { label: 'Formation', icon: <Users className="h-4 w-4" />, description: 'Créer et dispenser des formations' },
};

const niches = [
  'Immobilier', 'Bourse / Trading', 'Crypto / Blockchain',
  'Coaching / Développement personnel', 'E-commerce / Dropshipping',
  'Marketing digital', 'Santé / Bien-être', 'Finance / Investissement',
  'Formation professionnelle', 'Autre',
];

const industries = [
  'Formateur en ligne', 'Coach / Mentor', 'Consultant',
  'Créateur de contenu', 'Agence', 'SaaS / Outil digital', 'Autre',
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>('role');
  const [selectedRoles, setSelectedRoles] = useState<SelectableRole[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Candidat details
  const [yearsExperience, setYearsExperience] = useState('');
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);

  // Recruteur details
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');

  // Contact (step 3)
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');

  const isCandidate = selectedRoles.includes('candidate');
  const isRecruiter = selectedRoles.includes('recruiter');

  const toggleRole = (role: SelectableRole) => {
    setSelectedRoles((prev) => {
      const next = prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role];
      setSelectedSkills([]);
      return next;
    });
  };

  const toggleNiche = (niche: string) => {
    setSelectedNiches((prev) =>
      prev.includes(niche) ? prev.filter((n) => n !== niche) : [...prev, niche]
    );
  };

  const toggleSkill = (skill: Skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const availableSkills: Skill[] = isCandidate
    ? ['closing', 'setting', 'management', 'hos', 'coaching', 'training']
    : ['management', 'hos', 'coaching', 'training'];

  const isDetailsValid = () => {
    if (isCandidate && selectedSkills.length === 0) return false;
    if (isCandidate && !yearsExperience) return false;
    if (isRecruiter && !industry) return false;
    return true;
  };

  const isContactValid = lastName.trim() && firstName.trim() && phone.trim();

  const computeRoleType = (): RoleType => {
    if (isCandidate && isRecruiter) return 'both';
    if (isCandidate) return 'candidate';
    return 'recruiter';
  };

  const getExperienceLevel = (years: number) => {
    if (years >= 5) return 'expert';
    if (years >= 3) return 'senior';
    if (years >= 1) return 'intermediaire';
    return 'junior';
  };

  const handleFinish = async () => {
    if (!isContactValid) return;
    setLoading(true);
    setError('');

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Non authentifié');

      const years = parseInt(yearsExperience) || 0;
      const roleType = computeRoleType();
      const activeRole: ActiveRole = selectedRoles[0];

      const { error: userError } = await supabase
        .from('users')
        .update({
          role: isCandidate ? 'closer' : 'manager',
          role_type: roleType,
          active_role: activeRole,
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          phone: phone.trim(),
          years_experience: years || null,
          niches: selectedNiches.length > 0 ? selectedNiches : null,
          infopreneur_type: industry || null,
          skills: selectedSkills,
          is_onboarded: true,
        })
        .eq('id', authUser.id);

      if (userError) throw userError;

      // Profil unifié
      const profileData: Record<string, unknown> = { user_id: authUser.id };
      if (isCandidate) {
        profileData.experience_level = getExperienceLevel(years);
        profileData.preferred_niches = selectedNiches;
        profileData.specialties = selectedNiches;
        profileData.availability = true;
      }
      if (isRecruiter) {
        profileData.industry = industry;
        profileData.company_name = companyName || null;
      }

      await supabase.from('profiles').upsert(profileData, { onConflict: 'user_id' });

      // Legacy compat
      if (isCandidate) {
        await supabase.from('closer_profiles').upsert({
          user_id: authUser.id,
          experience_level: getExperienceLevel(years),
          specialties: selectedNiches,
        }, { onConflict: 'user_id' });
      }
      if (isRecruiter) {
        await supabase.from('manager_profiles').upsert({
          user_id: authUser.id,
          industry: industry,
          company_name: companyName || null,
        }, { onConflict: 'user_id' });
      }

      setStep('done');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream via-white to-brand-cream/50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {['role', 'details', 'contact', 'done'].map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= ['role', 'details', 'contact', 'done'].indexOf(step)
                  ? 'bg-brand-amber'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* ========== STEP 1: RÔLE ========== */}
        {step === 'role' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-brand-amber flex items-center justify-center font-bold text-white text-lg">H</div>
                <span className="font-bold text-xl text-brand-dark">HUBClosing</span>
              </div>
              <h1 className="text-2xl font-bold text-brand-dark mb-2">Que recherchez-vous ?</h1>
              <p className="text-gray-500 text-sm">Sélectionnez un ou plusieurs profils</p>
            </div>

            <div className="space-y-3">
              {[
                { value: 'candidate' as SelectableRole, title: 'Candidat', desc: 'Je cherche des missions de closing, setting, management…', icon: <Target className="h-6 w-6" /> },
                { value: 'recruiter' as SelectableRole, title: 'Recruteur', desc: 'Je publie des offres et recrute des talents commerciaux', icon: <Briefcase className="h-6 w-6" /> },
              ].map((opt) => {
                const selected = selectedRoles.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleRole(opt.value)}
                    className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                      selected ? 'border-brand-amber bg-brand-amber/5 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-lg ${selected ? 'bg-brand-amber/10' : 'bg-gray-100'}`}>
                        <div className={selected ? 'text-brand-amber' : 'text-gray-500'}>{opt.icon}</div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-brand-dark">{opt.title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{opt.desc}</p>
                      </div>
                      {selected ? (
                        <CheckSquare className="h-5 w-5 text-brand-amber shrink-0" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-300 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedRoles.length === 2 && (
              <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-700">Vous pourrez basculer entre les deux vues depuis votre tableau de bord.</p>
              </div>
            )}

            <Button onClick={() => setStep('details')} disabled={selectedRoles.length === 0} className="w-full mt-6">
              Continuer <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ========== STEP 2: DÉTAILS ADAPTÉS AU RÔLE ========== */}
        {step === 'details' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <button onClick={() => setStep('role')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
              <ArrowLeft className="h-4 w-4" /> Retour
            </button>

            <h2 className="text-xl font-bold text-brand-dark mb-1">Personnalisez votre profil</h2>
            <p className="text-sm text-gray-500 mb-6">
              {isCandidate && isRecruiter ? 'Dites-nous en plus sur vos deux activités' :
               isCandidate ? 'Dites-nous en plus sur vos compétences' :
               'Dites-nous en plus sur votre activité'}
            </p>

            <div className="space-y-5">
              {/* Candidat: compétences + expérience */}
              {isCandidate && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vos compétences <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {availableSkills.map((skill) => {
                        const info = skillLabels[skill];
                        const isSelected = selectedSkills.includes(skill);
                        return (
                          <button
                            key={skill}
                            onClick={() => toggleSkill(skill)}
                            className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                              isSelected ? 'border-brand-amber bg-brand-amber/5' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-brand-amber/10 text-brand-amber' : 'bg-gray-100 text-gray-500'}`}>
                                {info.icon}
                              </div>
                              <div className="flex-1">
                                <span className="font-medium text-brand-dark text-sm">{info.label}</span>
                                <span className="text-xs text-gray-500 ml-2">{info.description}</span>
                              </div>
                              {isSelected && <CheckCircle className="h-4 w-4 text-brand-amber shrink-0" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expérience <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <select
                        value={yearsExperience}
                        onChange={(e) => setYearsExperience(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber bg-white"
                      >
                        <option value="">Sélectionnez...</option>
                        <option value="0">Moins de 1 an</option>
                        <option value="1">1 à 2 ans</option>
                        <option value="3">3 à 5 ans</option>
                        <option value="5">5 à 10 ans</option>
                        <option value="10">10+ ans</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Niche(s) de prédilection</label>
                    <div className="flex flex-wrap gap-2">
                      {niches.map((niche) => (
                        <button
                          key={niche}
                          type="button"
                          onClick={() => toggleNiche(niche)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            selectedNiches.includes(niche)
                              ? 'bg-brand-amber/10 border-brand-amber text-brand-amber'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {niche}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Séparateur si double rôle */}
              {isCandidate && isRecruiter && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">RECRUTEUR</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              )}

              {/* Recruteur: société + secteur */}
              {isRecruiter && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de société</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Optionnel"
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Secteur d&apos;activité <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber bg-white"
                    >
                      <option value="">Sélectionnez...</option>
                      {industries.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>

                  {!isCandidate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Compétences recherchées <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        {availableSkills.map((skill) => {
                          const info = skillLabels[skill];
                          const isSelected = selectedSkills.includes(skill);
                          return (
                            <button
                              key={skill}
                              onClick={() => toggleSkill(skill)}
                              className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                                isSelected ? 'border-brand-amber bg-brand-amber/5' : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-brand-amber/10 text-brand-amber' : 'bg-gray-100 text-gray-500'}`}>
                                  {info.icon}
                                </div>
                                <span className="font-medium text-brand-dark text-sm flex-1">{info.label}</span>
                                {isSelected && <CheckCircle className="h-4 w-4 text-brand-amber shrink-0" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button onClick={() => setStep('contact')} disabled={!isDetailsValid()} className="w-full mt-6">
              Continuer <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ========== STEP 3: COORDONNÉES ========== */}
        {step === 'contact' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <button onClick={() => setStep('details')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
              <ArrowLeft className="h-4 w-4" /> Retour
            </button>

            <h2 className="text-xl font-bold text-brand-dark mb-1">Vos coordonnées</h2>
            <p className="text-sm text-gray-500 mb-6">Pour finaliser votre inscription</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Votre nom"
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Votre prénom"
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78"
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber" />
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button onClick={handleFinish} isLoading={loading} disabled={!isContactValid} className="w-full mt-6">
              Finaliser mon inscription <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ========== STEP 4: DONE ========== */}
        {step === 'done' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-brand-dark mb-2">Bienvenue sur HUBClosing !</h2>
            <p className="text-gray-600 mb-2">
              {isCandidate && isRecruiter
                ? 'Accédez à vos missions et publiez vos offres.'
                : isCandidate
                ? 'Découvrez les offres disponibles sur la marketplace.'
                : 'Publiez votre première offre et trouvez les meilleurs talents.'}
            </p>
            <p className="text-sm text-gray-400">Redirection vers votre tableau de bord...</p>
          </div>
        )}
      </div>
    </div>
  );
}
