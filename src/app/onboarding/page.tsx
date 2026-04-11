'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';
import { ArrowRight, ArrowLeft, Phone, Mail, User, Briefcase, Target, CheckCircle, PhoneCall, Crown, Clock } from 'lucide-react';

type Step = 'info' | 'role' | 'done';
type SubRole = 'closer' | 'setter' | 'manager' | 'hos';

interface RoleOption {
  subRole: SubRole;
  dbRole: 'closer' | 'manager';
  title: string;
  description: string;
  icon: React.ReactNode;
}

const niches = [
  'Immobilier',
  'Bourse / Trading',
  'Crypto / Blockchain',
  'Coaching / Développement personnel',
  'E-commerce / Dropshipping',
  'Marketing digital',
  'Santé / Bien-être',
  'Finance / Investissement',
  'Formation professionnelle',
  'Autre',
];

const typesInfopreneur = [
  'Formateur en ligne',
  'Coach / Mentor',
  'Consultant',
  'Créateur de contenu',
  'Agence',
  'SaaS / Outil digital',
  'Autre',
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>('info');
  const [selectedRole, setSelectedRole] = useState<'closer' | 'manager' | null>(null);
  const [subRole, setSubRole] = useState<SubRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Infos obligatoires
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [infoType, setInfoType] = useState('');

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
      description: 'Je qualifie les prospects et je book des rendez-vous pour les closers',
      icon: <PhoneCall className="h-6 w-6" />,
    },
    {
      subRole: 'manager',
      dbRole: 'manager',
      title: 'Manager',
      description: 'Je gère une équipe de closers/setters et cherche des profils qualifiés',
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

  const toggleNiche = (niche: string) => {
    setSelectedNiches((prev) => {
      if (prev.includes(niche)) {
        return prev.filter((n) => n !== niche);
      }
      return [...prev, niche];
    });
  };

  const isStep1Valid =
    lastName.trim() &&
    firstName.trim() &&
    personalEmail.trim() &&
    phone.trim() &&
    yearsExperience &&
    selectedNiches.length > 0 &&
    infoType;

  const handleGoToRole = () => {
    if (!isStep1Valid) return;
    setStep('role');
  };

  const handleFinish = async () => {
    if (!selectedRole || !subRole) return;
    setLoading(true);
    setError('');

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Non authentifié');

      // Mettre à jour le profil utilisateur
      const { error: userError } = await supabase
        .from('users')
        .update({
          role: selectedRole,
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          personal_email: personalEmail.trim(),
          phone: phone.trim(),
          years_experience: parseInt(yearsExperience),
          niches: selectedNiches,
          infopreneur_type: infoType,
          sub_role: subRole,
        })
        .eq('id', authUser.id);

      if (userError) throw userError;

      // Créer le profil spécifique au rôle
      if (selectedRole === 'closer') {
        await supabase.from('closer_profiles').upsert({
          user_id: authUser.id,
          experience_level: parseInt(yearsExperience) >= 5 ? 'expert' : parseInt(yearsExperience) >= 2 ? 'senior' : parseInt(yearsExperience) >= 1 ? 'intermediaire' : 'junior',
          specialties: selectedNiches,
        }, { onConflict: 'user_id' });
      } else {
        await supabase.from('manager_profiles').upsert({
          user_id: authUser.id,
          industry: infoType,
        }, { onConflict: 'user_id' });
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

  const getSuccessMessage = () => {
    switch (subRole) {
      case 'closer': return 'Découvrez les offres disponibles sur la marketplace.';
      case 'setter': return 'Trouvez des opportunités de qualification de prospects.';
      case 'manager': return 'Publiez votre première offre et trouvez les meilleurs closers.';
      case 'hos': return 'Constituez votre équipe de vente idéale.';
      default: return 'Bienvenue sur HUBClosing !';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream via-white to-brand-cream/50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step === 'info' || step === 'role' || step === 'done' ? 'bg-brand-amber' : 'bg-gray-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step === 'role' || step === 'done' ? 'bg-brand-amber' : 'bg-gray-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step === 'done' ? 'bg-brand-amber' : 'bg-gray-200'}`} />
        </div>

        {/* Step 1: Informations obligatoires */}
        {step === 'info' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-brand-dark mb-2">
                Bienvenue sur HUBClosing !
              </h1>
              <p className="text-gray-600">
                Complétez votre fiche pour accéder à la plateforme
              </p>
            </div>

            <div className="space-y-4">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Votre nom"
                    required
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber"
                  />
                </div>
              </div>

              {/* Prénom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Votre prénom"
                    required
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber"
                  />
                </div>
              </div>

              {/* Email personnel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber"
                  />
                </div>
              </div>

              {/* Téléphone */}
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
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber"
                  />
                </div>
              </div>

              {/* Années d'expérience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre d&apos;années d&apos;expérience <span className="text-red-500">*</span>
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

              {/* Niche travaillée */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niche(s) travaillée(s) <span className="text-red-500">*</span>
                </label>
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

              {/* Type d'infopreneur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quel genre d&apos;infopreneur ? <span className="text-red-500">*</span>
                </label>
                <select
                  value={infoType}
                  onChange={(e) => setInfoType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber bg-white"
                >
                  <option value="">Sélectionnez...</option>
                  {typesInfopreneur.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button onClick={handleGoToRole} disabled={!isStep1Valid} className="w-full mt-6">
              Continuer <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Choix du rôle */}
        {step === 'role' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <button
              onClick={() => setStep('info')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> Retour
            </button>

            <h2 className="text-xl font-bold text-brand-dark mb-2">
              Quel est votre rôle ?
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Choisissez le profil qui vous correspond
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
                      <p className="text-sm text-gray-500 mt-1">{option.description}</p>
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

            <Button onClick={handleFinish} isLoading={loading} disabled={!selectedRole || !subRole} className="w-full mt-6">
              Finaliser mon inscription <ArrowRight className="h-4 w-4 ml-2" />
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
              {getSuccessMessage()}
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
