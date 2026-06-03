'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Button, Input, Textarea, Select, Checkbox } from '@/components/ui';

const videoTypes = [
  { value: 'presentation', label: 'Presentation' },
  { value: 'call_recording', label: "Enregistrement d'appel" },
  { value: 'testimonial', label: 'Temoignage' },
];

export default function AddVideoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(e.currentTarget);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Non authentifie');

      const url = (form.get('url') as string).trim();
      // Basic URL validation for YouTube/Loom
      if (!url.includes('youtube.com') && !url.includes('youtu.be') && !url.includes('loom.com')) {
        throw new Error('Veuillez entrer un lien YouTube ou Loom valide');
      }

      const { error: insertError } = await supabase.from('portfolio_videos').insert({
        user_id: authUser.id,
        title: (form.get('title') as string).trim(),
        url,
        video_type: form.get('video_type') as string,
        description: (form.get('description') as string) || null,
        offer_name: (form.get('offer_name') as string) || null,
        is_public: isPublic,
        sort_order: 0,
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
        <h1 className="text-2xl font-bold text-brand-dark mt-2">Ajouter une video</h1>
        <p className="text-gray-500 mt-1">
          Ajoutez une video YouTube ou Loom pour enrichir votre profil de closer.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              name="title"
              label="Titre de la video"
              placeholder="Ex: Appel de closing - Programme Premium"
              required
            />

            <Input
              name="url"
              label="Lien de la video (YouTube ou Loom)"
              type="url"
              placeholder="https://www.youtube.com/watch?v=... ou https://www.loom.com/share/..."
              required
            />

            <Select
              name="video_type"
              label="Type de video"
              options={videoTypes}
              placeholder="Selectionnez un type"
              required
            />

            <Textarea
              name="description"
              label="Description (optionnel)"
              placeholder="Decrivez brievement le contenu de la video..."
              rows={3}
            />

            <Input
              name="offer_name"
              label="Offre associee (optionnel)"
              placeholder="Ex: Programme High Ticket Coaching"
            />

            <Checkbox
              id="is_public"
              label="Video visible par les recruteurs"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" isLoading={loading} className="flex-1">
                Ajouter la video
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
