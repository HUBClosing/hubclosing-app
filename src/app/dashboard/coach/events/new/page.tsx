'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Video, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function NewCoachEventPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'coaching',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    price: '',
    max_participants: '',
    link_type: 'jitsi' as 'external' | 'jitsi',
    meeting_url: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Le titre est requis');
      return;
    }
    if (!formData.start_date || !formData.start_time) {
      setError('La date et l\'heure de début sont requises');
      return;
    }
    if (formData.link_type === 'external' && !formData.meeting_url.trim()) {
      setError('L\'URL de la visio est requise pour un lien externe');
      return;
    }

    setSubmitting(true);

    const startDateTime = `${formData.start_date}T${formData.start_time}:00`;
    const endDateTime = formData.end_date && formData.end_time
      ? `${formData.end_date}T${formData.end_time}:00`
      : null;

    try {
      const res = await fetch('/api/coach/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          event_type: formData.event_type,
          start_date: startDateTime,
          end_date: endDateTime,
          price: formData.price || '0',
          max_participants: formData.max_participants || null,
          link_type: formData.link_type,
          meeting_url: formData.link_type === 'external' ? formData.meeting_url.trim() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la création');
        setSubmitting(false);
        return;
      }

      router.push('/dashboard/coach/events');
      router.refresh();
    } catch {
      setError('Erreur réseau. Réessayez.');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/coach/events" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Créer un événement</h1>
          <p className="text-gray-500 mt-1">Organisez un coaching ou un webinaire en ligne</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Titre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre de l&apos;événement <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
            placeholder="Ex: Session de coaching closing — niveau avancé"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none resize-none"
            placeholder="Décrivez le contenu de votre événement, ce que les participants vont apprendre..."
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type d&apos;événement <span className="text-red-500">*</span>
          </label>
          <select
            name="event_type"
            value={formData.event_type}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
          >
            <option value="coaching">Coaching</option>
            <option value="webinaire">Webinaire</option>
            <option value="atelier">Atelier</option>
            <option value="networking">Networking</option>
          </select>
        </div>

        {/* Date & Heure */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de début <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heure de début <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heure de fin</label>
            <input
              type="time"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
            />
          </div>
        </div>

        {/* Prix & Participants */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix (€) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
              placeholder="0 = gratuit"
            />
            <p className="text-xs text-gray-400 mt-1">Laissez 0 pour un événement gratuit</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Participants max</label>
            <input
              type="number"
              name="max_participants"
              value={formData.max_participants}
              onChange={handleChange}
              min="1"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
              placeholder="Illimité si vide"
            />
          </div>
        </div>

        {/* Type de lien */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Visioconférence <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, link_type: 'jitsi' }))}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                formData.link_type === 'jitsi'
                  ? 'border-brand-amber bg-brand-amber/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Video className={`h-6 w-6 mb-2 ${formData.link_type === 'jitsi' ? 'text-brand-amber' : 'text-gray-400'}`} />
              <p className="font-medium text-brand-dark">Jitsi Meet</p>
              <p className="text-xs text-gray-500 mt-1">Visio intégrée, rien à installer</p>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, link_type: 'external' }))}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                formData.link_type === 'external'
                  ? 'border-brand-amber bg-brand-amber/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ExternalLink className={`h-6 w-6 mb-2 ${formData.link_type === 'external' ? 'text-brand-amber' : 'text-gray-400'}`} />
              <p className="font-medium text-brand-dark">Lien externe</p>
              <p className="text-xs text-gray-500 mt-1">Zoom, Google Meet, Teams...</p>
            </button>
          </div>
        </div>

        {/* URL externe */}
        {formData.link_type === 'external' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL de la visio <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              name="meeting_url"
              value={formData.meeting_url}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
              placeholder="https://zoom.us/j/... ou https://meet.google.com/..."
              required={formData.link_type === 'external'}
            />
          </div>
        )}

        {formData.link_type === 'jitsi' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <Video className="h-4 w-4 inline-block mr-1" />
              Un lien Jitsi sera automatiquement généré à la création de l&apos;événement.
              Les participants y accéderont directement depuis HUBClosing.
            </p>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Link
            href="/dashboard/coach/events"
            className="px-6 py-2.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-brand-amber text-brand-dark font-bold rounded-lg hover:bg-brand-amber/90 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Création...' : 'Créer l\'événement'}
          </button>
        </div>
      </form>
    </div>
  );
}
