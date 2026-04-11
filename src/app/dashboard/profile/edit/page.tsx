'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Button, Input, Textarea, Select } from '@/components/ui';

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
  { value: 'Formateur en ligne', label: 'Formateur en ligne' },
  { value: 'Coach / Mentor', label: 'Coach / Mentor' },
  { value: 'Consultant', label: 'Consultant' },
  { value: 'Créateur de contenu', label: 'Créateur de contenu' },
  { value: 'Agence', label: 'Agence' },
  { value: 'SaaS / Outil digital', label: 'SaaS / Outil digital' },
  { value: 'Autre', label: 'Autre' },
];

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data: userData } = await supabase.from('users').select('*').eq('id', authUser.id).single();
      setUser(userData);
      if (userData?.niches) setSelectedNiches(userData.niches);

      if (userData?.role === 'closer') {
        const { data } = await supabase.from('closer_profiles').select('*').eq('user_id', authUser.id).maybeSingle();
        setProfile(data);
      } else if (userData?.role === 'manager') {
        const { data } = await supabase.from('manager_profiles').select('*').eq('user_id', authUser.id).maybeSingle();
        setProfile(data);
      }
    }
    load();
  }, []);

  const toggleNiche = (niche: string) => {
    setSelectedNiches((prev) =>
      prev.includes(niche) ? prev.filter((n) => n !== niche) : [...prev, niche]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);

    try {
      // Mise à jour infos utilisateur
      const { error: userError } = await supabase.from('users').update({
        full_name: `${(formData.get('first_name') as string || '').trim()} ${(formData.get('last_name') as string || '').trim()}`.trim(),
        personal_email: formData.get('personal_email') as string || null,
        phone: formData.get('phone') as string || null,
        years_experience: formData.get('years_experience') ? parseInt(formData.get('years_experience') as string) : null,
        niches: selectedNiches,
        infopreneur_type: formData.get('infopreneur_type') as string || null,
      }).eq('id', user.id);

      if (userError) throw userError;

      // Mise à jour profil spécifique
      if (user.role === 'closer' && profile) {
        await supabase.from('closer_profiles').update({
          bio: formData.get('bio') as string || null,
          experience_level: formData.get('experience_level') as string,
          linkedin_url: formData.get('linkedin_url') as string || null,
          portfolio_url: formData.get('portfolio_url') as string || null,
          hourly_rate: formData.get('hourly_rate') ? parseFloat(formData.get('hourly_rate') as string) : null,
          commission_rate: formData.get('commission_rate') ? parseFloat(formData.get('commission_rate') as string) : null,
        }).eq('user_id', user.id);
      } else if (user.role === 'manager' && profile) {
        await supabase.from('manager_profiles').update({
          company_name: formData.get('company_name') as string || null,
          bio: formData.get('bio') as string || null,
          website_url: formData.get('website_url') as string || null,
          linkedin_url: formData.get('linkedin_url') as string || null,
          industry: formData.get('industry') as string || null,
        }).eq('user_id', user.id);
      }

      router.push('/dashboard/profile');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="text-center py-12 text-gray-500">Chargement...</div>;

  // Séparer prénom/nom depuis full_name
  const nameParts = (user.full_name || '').split(' ');
  const defaultFirstName = nameParts[0] || '';
  const defaultLastName = nameParts.slice(1).join(' ') || '';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <a href="/dashboard/profile" className="text-sm text-brand-green hover:underline">&larr; Retour au profil</a>
        <h1 className="text-2xl font-bold text-brand-dark mt-2">Modifier mon profil</h1>
      </div>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="font-semibold text-brand-dark border-b pb-2">Informations personnelles</h3>

            <div className="grid grid-cols-2 gap-4">
              <Input name="first_name" label="Prénom" defaultValue={defaultFirstName} required />
              <Input name="last_name" label="Nom" defaultValue={defaultLastName} required />
            </div>

            <Input name="personal_email" label="Email personnel" type="email" defaultValue={user.personal_email || ''} required />
            <Input name="phone" label="Téléphone" defaultValue={user.phone || ''} required />

            <Select
              name="years_experience"
              label="Années d'expérience"
              defaultValue={user.years_experience?.toString() || ''}
              options={[
                { value: '0', label: 'Moins de 1 an' },
                { value: '1', label: '1 à 2 ans' },
                { value: '3', label: '3 à 5 ans' },
                { value: '5', label: '5 à 10 ans' },
                { value: '10', label: '10+ ans' },
              ]}
            />

            {/* Niches */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Niche(s) travaillée(s)</label>
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

            <Select
              name="infopreneur_type"
              label="Type d'infopreneur"
              defaultValue={user.infopreneur_type || ''}
              options={typesInfopreneur}
            />

            {/* Profil Closer */}
            {user.role === 'closer' && profile && (
              <>
                <h3 className="font-semibold text-brand-dark border-b pb-2 pt-2">Profil Closer</h3>
                <Textarea name="bio" label="Bio" defaultValue={profile.bio || ''} rows={3} />
                <Select name="experience_level" label="Niveau d'expérience closing" defaultValue={profile.experience_level}
                  options={[{ value: 'junior', label: 'Junior' }, { value: 'intermediaire', label: 'Intermédiaire' }, { value: 'senior', label: 'Senior' }, { value: 'expert', label: 'Expert' }]} />
                <div className="grid grid-cols-2 gap-4">
                  <Input name="hourly_rate" label="Taux horaire (€)" type="number" step="0.01" defaultValue={profile.hourly_rate || ''} />
                  <Input name="commission_rate" label="Taux commission (%)" type="number" step="0.01" defaultValue={profile.commission_rate || ''} />
                </div>
                <Input name="linkedin_url" label="LinkedIn" type="url" defaultValue={profile.linkedin_url || ''} />
                <Input name="portfolio_url" label="Portfolio" type="url" defaultValue={profile.portfolio_url || ''} />
              </>
            )}

            {/* Profil Manager */}
            {user.role === 'manager' && profile && (
              <>
                <h3 className="font-semibold text-brand-dark border-b pb-2 pt-2">Profil Manager</h3>
                <Input name="company_name" label="Nom de l'entreprise" defaultValue={profile.company_name || ''} />
                <Textarea name="bio" label="Bio" defaultValue={profile.bio || ''} rows={3} />
                <Input name="industry" label="Secteur d'activité" defaultValue={profile.industry || ''} />
                <Input name="website_url" label="Site web" type="url" defaultValue={profile.website_url || ''} />
                <Input name="linkedin_url" label="LinkedIn" type="url" defaultValue={profile.linkedin_url || ''} />
              </>
            )}

            {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200"><p className="text-sm text-red-600">{error}</p></div>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" isLoading={loading} className="flex-1">Enregistrer</Button>
              <Button type="button" variant="secondary" onClick={() => router.back()}>Annuler</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
