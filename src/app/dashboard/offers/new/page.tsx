'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Button, Input, Textarea, Select } from '@/components/ui';

export default function NewOfferPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) { setError('Non connecté'); setLoading(false); return; }

    const { error: insertError } = await supabase.from('offers').insert({
      manager_id: user.id,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      requirements: formData.get('requirements') as string || null,
      commission_type: formData.get('commission_type') as string,
      commission_value: parseFloat(formData.get('commission_value') as string),
      product_type: formData.get('product_type') as string || null,
      product_url: formData.get('product_url') as string || null,
      max_closers: formData.get('max_closers') ? parseInt(formData.get('max_closers') as string) : null,
    });

    if (insertError) { setError(insertError.message); setLoading(false); return; }

    router.push('/dashboard/offers');
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <a href="/dashboard/offers" className="text-sm text-brand-green hover:underline">&larr; Retour aux offres</a>
        <h1 className="text-2xl font-bold text-brand-dark mt-2">Nouvelle offre</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="title" label="Titre de l'offre" placeholder="Ex: Closer pour formation coaching" required />
            <Textarea name="description" label="Description" placeholder="Décrivez l'offre en détail..." rows={5} required />
            <Textarea name="requirements" label="Prérequis (optionnel)" placeholder="Expérience requise, compétences..." rows={3} />

            <div className="grid grid-cols-2 gap-4">
              <Select
                name="commission_type"
                label="Type de commission"
                options={[
                  { value: 'percentage', label: 'Pourcentage' },
                  { value: 'fixed', label: 'Montant fixe' },
                ]}
              />
              <Input name="commission_value" label="Valeur" type="number" step="0.01" placeholder="Ex: 10" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                name="product_type"
                label="Type de produit"
                placeholder="Sélectionner..."
                options={[
                  { value: 'formation', label: 'Formation' },
                  { value: 'coaching', label: 'Coaching' },
                  { value: 'service', label: 'Service' },
                  { value: 'saas', label: 'SaaS' },
                  { value: 'autre', label: 'Autre' },
                ]}
              />
              <Input name="max_closers" label="Nb max de closers" type="number" placeholder="Illimité" />
            </div>

            <Input name="product_url" label="URL du produit (optionnel)" type="url" placeholder="https://..." />

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" isLoading={loading} className="flex-1">Publier l&apos;offre</Button>
              <Button type="button" variant="secondary" onClick={() => router.back()}>Annuler</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
