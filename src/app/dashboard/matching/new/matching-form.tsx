'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, ArrowLeft, Briefcase, Target, Globe2,
  TrendingUp, Video, GraduationCap,
  ChevronDown, ChevronUp,
  Loader2,
} from 'lucide-react';

const SKILLS = [
  { value: 'closing', label: 'Closing' },
  { value: 'setting', label: 'Setting' },
  { value: 'management', label: 'Management' },
  { value: 'hos', label: 'HOS' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'training', label: 'Formation' },
];

const OFFER_TYPES = [
  { value: 'challenge', label: 'Challenge' },
  { value: 'recurring', label: 'Récurrent' },
  { value: 'mission', label: 'Mission ponctuelle' },
  { value: 'full_time', label: 'CDI / Temps plein' },
  { value: 'part_time', label: 'Temps partiel' },
  { value: 'commission_only', label: 'Commission only' },
];

const EXPERIENCE_LEVELS = [
  { value: '', label: 'Tous niveaux' },
  { value: 'junior', label: 'Junior (0-1 an)' },
  { value: 'intermediaire', label: 'Intermédiaire (1-3 ans)' },
  { value: 'senior', label: 'Senior (3-5 ans)' },
  { value: 'expert', label: 'Expert (5+ ans)' },
];

const NICHES = [
  'Coaching', 'Formation', 'SaaS', 'E-commerce', 'Immobilier',
  'Finance', 'Assurance', 'Santé', 'Bien-être', 'Marketing Digital',
  'Développement personnel', 'Consulting', 'Agence', 'Trading',
  'Crypto', 'Infoproduit', 'High Ticket', 'B2B', 'B2C',
];

const LANGUAGES = [
  'Français', 'Anglais', 'Espagnol', 'Allemand', 'Arabe',
  'Portugais', 'Italien', 'Néerlandais', 'Russe', 'Chinois',
];

const TRAINING_CENTERS = [
  'Closers Group', 'Best Closer', 'CGM ELITE', 'Closer Mastery',
  'Navy Sales', 'Sales Influence', 'Striker', 'Ossama Rhamri',
  'Cole Gordon', 'Momentum', 'Mon Closer', 'Closer Evolution',
];

const BADGE_LEVELS = [
  { value: '', label: 'Aucun minimum' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' },
  { value: 'diamond', label: 'Diamond' },
];

const MEDAL_LEVELS = [
  { value: '', label: 'Aucune minimum' },
  { value: 'bronze', label: 'Bronze (300€/call)' },
  { value: 'silver', label: 'Silver (600€/call)' },
  { value: 'gold', label: 'Gold (1000€/call)' },
  { value: 'diamond', label: 'Diamond (2000€/call)' },
];

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="p-2 bg-brand-amber/10 rounded-lg">
        <Icon className="h-5 w-5 text-brand-amber" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

export function MatchingForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Sections collapsibles
  const [showPerformance, setShowPerformance] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    niche: '',
    required_skills: [] as string[],
    offer_type: '',
    experience_level: '',
    min_years_experience: '',
    languages: [] as string[],
    min_commission_rate: '',
    max_commission_rate: '',
    location: '',
    availability_required: true,
    min_hours_per_week: '',
    is_employed_preferred: '' as '' | 'true' | 'false',
    min_cash_per_call: '',
    min_deals_closed: '',
    min_revenue_generated: '',
    min_reputation_score: '',
    min_badge_level: '',
    medal_required: '',
    loom_required: false,
    training_centers: [] as string[],
    notes: '',
  });

  function toggleArrayValue(field: 'required_skills' | 'languages' | 'training_centers', value: string) {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // 1. Créer la fiche
      const res = await fetch('/api/matching/fiches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          is_employed_preferred: form.is_employed_preferred === '' ? null : form.is_employed_preferred === 'true',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la création');
        setSubmitting(false);
        return;
      }

      // 2. Lancer le matching
      await fetch('/api/matching/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiche_id: data.fiche.id }),
      });

      // 3. Rediriger vers les résultats
      router.push(`/dashboard/matching/${data.fiche.id}`);
    } catch {
      setError('Erreur réseau');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/matching')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-brand-amber" />
          Nouvelle fiche de poste
        </h1>
        <p className="text-gray-500 mt-1">
          Décrivez le profil idéal que vous recherchez. Notre IA analysera tous les candidats
          et vous proposera les meilleurs matchs.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Informations générales */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <SectionHeader icon={Briefcase} title="Informations générales" subtitle="Les critères principaux de votre recherche" />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre de la fiche *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Closer senior pour programme coaching High Ticket"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niche recherchée
                </label>
                <select
                  value={form.niche}
                  onChange={e => setForm({ ...form, niche: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none bg-white"
                >
                  <option value="">Toutes niches</option>
                  {NICHES.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de contrat
                </label>
                <select
                  value={form.offer_type}
                  onChange={e => setForm({ ...form, offer_type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none bg-white"
                >
                  <option value="">Tous types</option>
                  {OFFER_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes / Précisions
              </label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Détails supplémentaires sur le poste..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Compétences et expérience */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <SectionHeader icon={Target} title="Compétences et expérience" subtitle="Les compétences et le niveau recherchés" />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compétences requises
              </label>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map(skill => (
                  <button
                    key={skill.value}
                    type="button"
                    onClick={() => toggleArrayValue('required_skills', skill.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      form.required_skills.includes(skill.value)
                        ? 'bg-brand-amber text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {skill.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niveau d&apos;expérience minimum
                </label>
                <select
                  value={form.experience_level}
                  onChange={e => setForm({ ...form, experience_level: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none bg-white"
                >
                  {EXPERIENCE_LEVELS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Années d&apos;expérience minimum
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={form.min_years_experience}
                  onChange={e => setForm({ ...form, min_years_experience: e.target.value })}
                  placeholder="Ex: 2"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Langues et disponibilité */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <SectionHeader icon={Globe2} title="Langues et disponibilité" subtitle="Langues parlées et disponibilité souhaitée" />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Langues requises
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleArrayValue('languages', lang)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      form.languages.includes(lang)
                        ? 'bg-brand-amber text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disponibilité requise
                </label>
                <select
                  value={form.availability_required ? 'true' : 'false'}
                  onChange={e => setForm({ ...form, availability_required: e.target.value === 'true' })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none bg-white"
                >
                  <option value="true">Oui, doit être disponible</option>
                  <option value="false">Non, pas obligatoire</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heures minimum / semaine
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={form.min_hours_per_week}
                  onChange={e => setForm({ ...form, min_hours_per_week: e.target.value })}
                  placeholder="Ex: 20"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localisation
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="Ex: France, Remote"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission minimum (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.min_commission_rate}
                  onChange={e => setForm({ ...form, min_commission_rate: e.target.value })}
                  placeholder="Ex: 10"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission maximum (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.max_commission_rate}
                  onChange={e => setForm({ ...form, max_commission_rate: e.target.value })}
                  placeholder="Ex: 20"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut souhaité
              </label>
              <select
                value={form.is_employed_preferred}
                onChange={e => setForm({ ...form, is_employed_preferred: e.target.value as '' | 'true' | 'false' })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none bg-white"
              >
                <option value="">Indifférent</option>
                <option value="true">Salarié</option>
                <option value="false">Indépendant / Freelance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Performance (collapsible) */}
        <div className="bg-white rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => setShowPerformance(!showPerformance)}
            className="w-full p-6 flex items-center justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-brand-amber/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-brand-amber" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Critères de performance</h3>
                <p className="text-sm text-gray-500">Cash per call, deals closés, CA généré (optionnel)</p>
              </div>
            </div>
            {showPerformance ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
          </button>

          {showPerformance && (
            <div className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cash / call minimum (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.min_cash_per_call}
                    onChange={e => setForm({ ...form, min_cash_per_call: e.target.value })}
                    placeholder="Ex: 500"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deals closés minimum
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.min_deals_closed}
                    onChange={e => setForm({ ...form, min_deals_closed: e.target.value })}
                    placeholder="Ex: 20"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CA généré minimum (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.min_revenue_generated}
                    onChange={e => setForm({ ...form, min_revenue_generated: e.target.value })}
                    placeholder="Ex: 50000"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Médaille minimum
                  </label>
                  <select
                    value={form.medal_required}
                    onChange={e => setForm({ ...form, medal_required: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none bg-white"
                  >
                    {MEDAL_LEVELS.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Score de réputation minimum (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.min_reputation_score}
                    onChange={e => setForm({ ...form, min_reputation_score: e.target.value })}
                    placeholder="Ex: 50"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Badge de réputation minimum
                </label>
                <select
                  value={form.min_badge_level}
                  onChange={e => setForm({ ...form, min_badge_level: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none bg-white"
                >
                  {BADGE_LEVELS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Préférences (collapsible) */}
        <div className="bg-white rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => setShowPreferences(!showPreferences)}
            className="w-full p-6 flex items-center justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-brand-amber/10 rounded-lg">
                <GraduationCap className="h-5 w-5 text-brand-amber" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Préférences supplémentaires</h3>
                <p className="text-sm text-gray-500">Formation, vidéo Loom (optionnel)</p>
              </div>
            </div>
            {showPreferences ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
          </button>

          {showPreferences && (
            <div className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Centres de formation préférés
                </label>
                <div className="flex flex-wrap gap-2">
                  {TRAINING_CENTERS.map(tc => (
                    <button
                      key={tc}
                      type="button"
                      onClick={() => toggleArrayValue('training_centers', tc)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        form.training_centers.includes(tc)
                          ? 'bg-brand-amber text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tc}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.loom_required}
                  onChange={e => setForm({ ...form, loom_required: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-brand-amber focus:ring-brand-amber/50"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Video className="h-4 w-4" />
                    Vidéo Loom requise
                  </span>
                  <p className="text-xs text-gray-500">Le candidat doit avoir une vidéo de présentation</p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/matching')}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-2.5 bg-brand-amber text-white rounded-lg font-medium hover:bg-brand-amber/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Lancer le matching IA
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
