'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Button, Input, Textarea, Select, Checkbox } from '@/components/ui';

const niches = [
  { value: 'Immobilier', label: 'Immobilier' },
  { value: 'Bourse / Trading', label: 'Bourse / Trading' },
  { value: 'Crypto / Blockchain', label: 'Crypto / Blockchain' },
  { value: 'Coaching / Developpement personnel', label: 'Coaching / Developpement personnel' },
  { value: 'E-commerce / Dropshipping', label: 'E-commerce / Dropshipping' },
  { value: 'Marketing digital', label: 'Marketing digital' },
  { value: 'Sante / Bien-etre', label: 'Sante / Bien-etre' },
  { value: 'Finance / Investissement', label: 'Finance / Investissement' },
  { value: 'Formation professionnelle', label: 'Formation professionnelle' },
  { value: 'Autre', label: 'Autre' },
];

export default function AddEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(e.currentTarget);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Non authentifie');

      const callsMade = parseInt(form.get('calls_made') as string) || 0;
      const revenueClosed = parseFloat(form.get('revenue_closed') as string) || 0;
      const cashPerCall = callsMade > 0 ? revenueClosed / callsMade : 0;

      const { error: insertError } = await supabase.from('portfolio_entries').insert({
        user_id: authUser.id,
        offer_name: (form.get('offer_name') as string).trim(),
        niche: (form.get('niche') as string) || null,
        product_price: form.get('product_price') ? parseFloat(form.get('product_price') as string) : null,
        revenue_closed: revenueClosed,
        calls_made: callsMade,
        appointments_booked: parseInt(form.get('appointments_booked') as string) || 0,
        deals_closed: parseInt(form.get('deals_closed') as string) || 0,
        cash_per_call: cashPerCall,
        conversion_rate_gross: form.get('conversion_rate_gross') ? parseFloat(form.get('conversion_rate_gross') as string) : null,
        conversion_rate_net: form.get('conversion_rate_net') ? parseFloat(form.get('conversion_rate_net') as string) : null,
        start_date: (form.get('start_date') as string) || null,
        end_date: isCurrent ? null : ((form.get('end_date') as string) || null),
        is_current: isCurrent,
        notes: (form.get('notes') as string) || null,
      });

      if (insertError) throw insertError;

      router.push('/dashboard/performance');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <a href="/dashboard/performance" className="text-sm text-brand-green hover:underline">
          &larr; Retour au portfolio
        </a>
        <h1 className="text-2xl font-bold text-brand-dark mt-2">Ajouter une offre</h1>
        <p className="text-gray-500 mt-1">
          Enregistrez vos performances sur une offre pour enrichir votre CV de closer.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="font-semibold text-brand-dark border-b pb-2">Informations de l&apos;offre</h3>

            <Input
              name="offer_name"
              label="Nom de l'offre"
              placeholder="Ex: Programme High Ticket Coaching"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                name="niche"
                label="Niche"
                options={niches}
                placeholder="Selectionnez une niche"
              />
              <Input
                name="product_price"
                label="Prix du produit (EUR)"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 2000"
              />
            </div>

            <h3 className="font-semibold text-brand-dark border-b pb-2 pt-2">Statistiques de performance</h3>

            <div className="grid grid-cols-2 gap-4">
              <Input
                name="revenue_closed"
                label="Revenu close (EUR)"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="Ex: 50000"
              />
              <Input
                name="calls_made"
                label="Appels effectues"
                type="number"
                min="0"
                required
                placeholder="Ex: 100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                name="appointments_booked"
                label="Rendez-vous pris"
                type="number"
                min="0"
                placeholder="Ex: 80"
              />
              <Input
                name="deals_closed"
                label="Deals closes"
                type="number"
                min="0"
                required
                placeholder="Ex: 25"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                name="conversion_rate_gross"
                label="Taux de conversion brut (%)"
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="Ex: 25.0"
              />
              <Input
                name="conversion_rate_net"
                label="Taux de conversion net (%)"
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="Ex: 20.0"
              />
            </div>

            <h3 className="font-semibold text-brand-dark border-b pb-2 pt-2">Periode</h3>

            <div className="grid grid-cols-2 gap-4">
              <Input
                name="start_date"
                label="Date de debut"
                type="date"
              />
              {!isCurrent && (
                <Input
                  name="end_date"
                  label="Date de fin"
                  type="date"
                />
              )}
            </div>

            <Checkbox
              id="is_current"
              label="Offre en cours"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
            />

            <Textarea
              name="notes"
              label="Notes (optionnel)"
              placeholder="Contexte additionnel, details sur l'offre..."
              rows={3}
            />

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" isLoading={loading} className="flex-1">
                Enregistrer l&apos;offre
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
