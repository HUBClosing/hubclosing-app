'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Button, Textarea } from '@/components/ui';

export default function ApplyPage() {
  const router = useRouter();
  const params = useParams();
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('Vous devez être connecté');
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('applications').insert({
      offer_id: params.id as string,
      closer_id: user.id,
      cover_letter: coverLetter || null,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard/candidatures');
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <a href={`/dashboard/marketplace/${params.id}`} className="text-sm text-brand-green hover:underline">&larr; Retour à l&apos;offre</a>
        <h1 className="text-2xl font-bold text-brand-dark mt-2">Postuler</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              label="Lettre de motivation (optionnel)"
              placeholder="Présentez-vous et expliquez pourquoi cette offre vous intéresse..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={6}
            />

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" isLoading={loading} className="flex-1">
                Envoyer ma candidature
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
