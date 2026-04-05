'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Button, Input, Textarea, Select } from '@/components/ui';
import type { Offer } from '@/types/database';

export default function EditOfferPage() {
  const router = useRouter();
  const params = useParams();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function loadOffer() {
      const { data } = await supabase.from('offers').select('*').eq('id', params.id).single();
      if (data) setOffer(data);
    }
    loadOffer();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);

    const { error: updateError } = await supabase.from('offers').update({
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      requirements: formData.get('requirements') as string || null,
      commission_type: formData.get('commission_type') as string,
      commission_value: parseFloat(formData.get('commission_value') as string),
      product_type: formData.get('product_type') as string || null,
      product_url: formData.get('product_url') as string || null,
      status: formData.get('status') as string,
    }).eq('id', params.id);

    if (updateError) { setError(updateError.message); setLoading(false); return; }
    router.push('/dashboard/offers');
    router.refresh();
  };

  if (!offer) return <div className="text-center py-12 text-gray-500">Chargement...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <a href="/dashboard/offers" className="text-sm text-brand-green hover:underline">&larr; Retour aux offres</a>
        <h1 className="text-2xl font-bold text-brand-dark mt-2">Modifier l&apos;offre</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="title" label="Titre" defaultValue={offer.title} required />
            <Textarea name="description" label="Description" defaultValue={offer.description} rows={5} required />
            <Textarea name="requirements" label="Prérequis" defaultValue={offer.requirements || ''} rows={3} />
            <div className="grid grid-cols-2 gap-4">
              <Select name="commission_type" label="Type de commission" defaultValue={offer.commission_type}
                options={[{ value: 'percentage', label: 'Pourcentage' }, { value: 'fixed', label: 'Montant fixe' }]} />
              <Input name="commission_value" label="Valeur" type="number" step="0.01" defaultValue={offer.commission_value} required />
            </div>
            <Select name="status" label="Statut" defaultValue={offer.status}
              options={[{ value: 'active', label: 'Active' }, { value: 'paused', label: 'En pause' }, { value: 'closed', label: 'Fermée' }]} />
            <Input name="product_type" label="Type de produit" defaultValue={offer.product_type || ''} />
            <Input name="product_url" label="URL du produit" type="url" defaultValue={offer.product_url || ''} />

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
