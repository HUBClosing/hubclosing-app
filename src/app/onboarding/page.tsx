'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';
import { ArrowRight, ArrowLeft, Phone, Briefcase, Users, Target, CheckCircle, PhoneCall, Crown, Mail } from 'lucide-react';

type Step = 'role' | 'details' | 'done';
type SubRole = 'closer' | 'setter' | 'manager' | 'hos';

interface RoleOption {
  subRole: SubRole;
  dbRole: 'closer' | 'manager';
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>('role');
  const [selectedRole, setSelectedRole] = useState<'closer' | 'manager' | null>(null);
  const [subRole, setSubRole] = useState<SubRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Closer details
  const [personalEmail, setPersonalEmail] = useState('');
  const [experience, setExperience] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [phone, setPhone] = useState('');

  // Manager details
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [website, setWebsite] = useState('');

  const closerSpecialties = [
    'Coaching', 'E-commerce', 'Immobilier', 'Assurance',
    'B2B', 'Crypto/Finance', 'Santé/Bien-être',
  ];

  const roleOptions: RoleOption[] = [
    {
      subRole: 'closer',
      dbRole: 'closer',
      title: 'Closer',
      description: 'Je veux closer des deals et convertir des prospects en clients',
      icon: <Target className="h-6 w-6" />,
    },
    {
      subRole: 'setter',
      dbRole: 'closer',
      title: 'Setter',
      description: 'Je veux qualifier les prospects et booker des rendez-vous pour les closers',
      icon: <PhoneCall className="h-6 w-6" />,
    },
    {
      subRole: 'manager',
      dbRole: 'manager',
      title: 'Manager',
      description: 'Je gère une équipe de closers/setters et je cherche des profils qualifiés',
      icon: <Briefcase className="h-6 w-6" />,
    },
    {
      subRole: 'hos',
      dbRole: 'manager',
      title: 'HOS (Head of Sales)',
      description: 'Je pilote la stratégie commerciale et recrute pour mon équipe sales',
      icon: <Crown className="h-6 w-6" />,
    },
  ];

  const getSubRoleLabel = () => {
    if (!subRole) return '';
    const labels = {
      closer: 'Closer',
      setter: 'Setter',
      manager: 'Manager',
      hos: 'HOS',
    };
    return labels[subRole];
  };

  const getSuccessMessage = () => {
    switch (subRole) {
      case 'closer':
        return 'Découvrez les offres disponibles sur la marketplace.';
      case 'setter':
        return 'Trouvez des opportunités de qualification de prospects.';
      case 'manager':
        return 'Publiez votre première offre et trouvez les meilleurs closers.';
      case 'hos':
        return 'Constituez votre équipe de vente idéale.';
      default:
        return 'Bienvenue sur HUBClosing !';
    }
  };

  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) => {
      const arr = Array.from(prev);
      const idx = arr.indexOf(s);
      if (idx >= 0) {
        arr.splice(idx, 1);
      } else {
        arr.push(s);
      }
      return arr;
    });
  };

  const handleSubmitRole = async () => {
    if (!selectedRole || !subRole) return;
    setStep('details');
  };

  const handleFinish = async () => {
    if (!selectedRole) return;
    setLoading(true);
    setError('');

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Non authentifié');

      // Update user role + email personnel si closer/setter
      const updateData: Record<string, any> = { role: selectedRole, phone: phone || null };
      if (selectedRole === 'closer' && personalEmail.trim()) {
        updateData.personal_email = personalEmail.trim();
      }
      const { error: userError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', authUser.id);

      if (userError) throw userError;

      // Create role-specific profile
      if (selectedRole === 'closer') {
        const { error: profileError } = await supabase
          .from('closer_profiles')
          .upsert({
            user_id: authUser.id,
            experience_level: experience || 'junior',
            specialties: specialties,
          }, { onConflict: 'user_id' });

        if (profileError) throw profileError;
      } else {
        const { error: profileError } = await supabase
          .from('manager_profiles')
          .upsert({
            user_id: authUser.id,
            company_name: companyName || null,
            industry: industry || null,
            team_size: teamSize ? parseInt(teamSize) : null,
            website_url: website || null,
          }, { onConflict: 'user_id' });

        if (profileError) throw profileError;
      }

      setStep('done');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream via-white to-brand-cream/50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step === 'role' || step === 'details' || step === 'done' ? 'bg-brand-amber' : 'bg-gray-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step === 'details' || step === 'done' ? 'bg-brand-amber' : 'bg-gray-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step === 'done' ? 'bg-brand-amber' : 'bg-gray-200'}`} />
        </div>

        {/* Step 1: Role selection */}
        {step === 'role' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-brand-dark mb-2">
                Bienvenue sur HUBClosing !
              </h1>
              <p className="text-gray-600">
                Aidez-nous à personnaliser votre expérience
              </p>
            </div>

            <p className="text-sm font-medium text-gray-700 mb-4">
              Quel est votre profil ?
            </p>

            <div className="space-y-3">
              {roleOptions.map((option) => (
                <button
                  key={option.subRole}
                  onClick={() => {
                    setSelectedRole(option.dbRole);
                    setSubRole(option.subRole);
                  }}
                  className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                    subRole === option.subRole
                      ? 'border-brand-amber bg-brand-amber/5 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg ${subRole === option.subRole ? 'bg-brand-amber/10' : 'bg-gray-100'}`}>
                      <div className={subRole === option.subRole ? 'text-brand-amber' : 'text-gray-500'}>
                        {option.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-brand-dark">{option.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              onClick={handleSubmitRole}
              disabled={!selectedRole || !subRole}
              className="w-full mt-6"
            >
              Continuer <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Details - Closer/Setter */}
        {step === 'details' && (selectedRole === 'closer' || subRole === 'setter') && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <button
              onClick={() => setStep('role')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> Retour
            </button>

            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold text-brand-dark">
                Votre profil {getSubRoleLabel()}
              </h2>
              <span className="inline-block px-2.5 py-1 bg-brand-amber/10 text-brand-amber text-xs font-medium rounded-full">
                {getSubRoleLabel()}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Ces informations aideront les managers à vous trouver
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email personnel <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niveau d&apos;expérience en closing
                </label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green bg-white"
                >
                  <option value="">Sélectionnez...</option>
                  <option value="junior">Débutant (0-6 mois)</option>
                  <option value="intermediaire">Intermédiaire (6 mois - 2 ans)</option>
                  <option value="senior">Confirmé (2-5 ans)</option>
                  <option value="expert">Expert (5+ ans)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spécialités (choisissez-en une ou plusieurs)
                </label>
                <div className="flex flex-wrap gap-2">
                  {closerSpecialties.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSpecialty(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        specialties.includes(s)
                          ? 'bg-brand-amber/10 border-brand-amber text-brand-amber'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    required
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                  />
                </div>
              </div>

              <p className="text-red-500 text-sm font-medium mt-2">
                Plus votre profil sera complété, plus il sera mis en avant et aura des chances d&apos;être sélectionné.
              </p>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button onClick={handleFinish} isLoading={loading} disabled={!phone.trim() || !personalEmail.trim()} className="w-full mt-6">
              Finaliser mon profil <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Details - Manager/HOS */}
        {step === 'details' && selectedRole === 'manager' && (subRole === 'manager' || subRole === 'hos') && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <button
              onClick={() => setStep('role')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> Retour
            </button>

            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold text-brand-dark">
                Votre profil {getSubRoleLabel()}
              </h2>
              <span className="inline-block px-2.5 py-1 bg-brand-amber/10 text-brand-amber text-xs font-medium rounded-full">
                {getSubRoleLabel()}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Présentez votre activité pour attirer les meilleurs closers
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de votre entreprise / marque
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Votre entreprise"
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secteur d&apos;activité
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green bg-white"
                >
                  <option value="">Sélectionnez...</option>
                  <option value="infoproduit">Infoproduit / Formation en ligne</option>
                  <option value="coaching">Coaching / Accompagnement</option>
                  <option value="saas">SaaS / Tech</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="immobilier">Immobilier</option>
                  <option value="finance">Finance / Investissement</option>
                  <option value="sante">Santé / Bien-être</option>
                  <option value="marketing">Marketing / Agence</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taille de votre équipe sales
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green bg-white"
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="0">Pas encore d&apos;équipe (je démarre)</option>
                    <option value="2">1-3 personnes</option>
                    <option value="5">4-10 personnes</option>
                    <option value="15">11-25 personnes</option>
                    <option value="50">25+ personnes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site web (optionnel)
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://votre-site.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    required
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                  />
                </div>
              </div>

              <p className="text-red-500 text-sm font-medium mt-2">
                Plus votre profil sera complété, plus il sera mis en avant et aura des chances d&apos;être sélectionné.
              </p>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button onClick={handleFinish} isLoading={loading} disabled={!phone.trim()} className="w-full mt-6">
              Finaliser mon profil <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 'done' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-brand-dark mb-2">
              Profil créé avec succès !
            </h2>
            <p className="text-gray-600 mb-2">
              Bienvenue ! {getSuccessMessage()}
            </p>
            <p className="text-sm text-gray-400">
              Redirection vers votre tableau de bord...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
