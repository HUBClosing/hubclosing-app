'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Button, Input, Textarea, Select } from '@/components/ui';

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data: userData } = await supabase.from('users').select('*').eq('id', authUser.id).single();
      setUser(userData);

      if (userData?.role === 'closer') {
        const { data } = await supabase.from('closer_profiles').select('*').eq('user_id', authUser.id).single();
        setProfile(data);
      } else if (userData?.role === 'manager') {
        const { data } = await supabase.from('manager_profiles').select('*').eq('user_id', authUser.id).single();
        setProfile(data);
      }
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);

    await supabase.from('users').update({
      full_name: formData.get('full_name') as string,
      phone: formData.get('phone') as string || null,
    }).eq('id', user.id);

    if (user.role === 'closer') {
      await supabase.from('closer_profiles').update({
        bio: formData.get('bio') as string || null,
        experience_level: formData.get('experience_level') as string,
        linkedin_url: formData.get('linkedin_url') as string || null,
        portfolio_url: formData.get('portfolio_url') as string || null,
        hourly_rate: formData.get('hourly_rate') ? parseFloat(formData.get('hourly_rate') as string) : null,
        commission_rate: formData.get('commission_rate') ? parseFloat(formData.get('commission_rate') as string) : null,
      }).eq('user_id', user.id);
    } else if (user.role === 'manager') {
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
  };

  if (!user) return <div className="text-center py-12 text-gray-500">Chargement...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <a href="/dashboard/profile" className="text-sm text-brand-green hover:underline">&larr; Retour au profil</a>
        <h1 className="text-2xl font-bold text-brand-dark mt-2">Modifier mon profil</h1>
      </div>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="full_name" label="Nom complet" defaultValue={user.full_name || ''} required />
            <Input name="phone" label="Téléphone" defaultValue={user.phone || ''} />

            {user.role === 'closer' && profile && (
              <>
                <Textarea name="bio" label="Bio" defaultValue={profile.bio || ''} rows={3} />
                <Select name="experience_level" label="Niveau d'expérience" defaultValue={profile.experience_level}
                  options={[{ value: 'junior', label: 'Junior' }, { value: 'intermediaire', label: 'Intermédiaire' }, { value: 'senior', label: 'Senior' }, { value: 'expert', label: 'Expert' }]} />
                <div className="grid grid-cols-2 gap-4">
                  <Input name="hourly_rate" label="Taux horaire (€)" type="number" step="0.01" defaultValue={profile.hourly_rate || ''} />
                  <Input name="commission_rate" label="Taux commission (%)" type="number" step="0.01" defaultValue={profile.commission_rate || ''} />
                </div>
                <Input name="linkedin_url" label="LinkedIn" type="url" defaultValue={profile.linkedin_url || ''} />
                <Input name="portfolio_url" label="Portfolio" type="url" defaultValue={profile.portfolio_url || ''} />
              </>
            )}

            {user.role === 'manager' && profile && (
              <>
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
