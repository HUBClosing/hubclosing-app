'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Button, Input, Textarea, Select } from '@/components/ui';
import { ArrowLeft, Send, Info, Crown } from 'lucide-react';
import type { Skill, OfferType } from '@/types/database';

const OFFER_TYPES: { value: OfferType; label: string }[] = [
  { value: 'commission_only', label: 'Commission uniquement' },
  { value: 'full_time', label: 'Temps plein (fixe + commission)' },
  { value: 'part_time', label: 'Temps partiel' },
  { value: 'mission', label: 'Mission ponctuelle' },
];

const NICHES = [
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

const SKILLS: { value: Skill; label: string }[] = [
  { value: 'closing', label: 'Closing' },
  { value: 'setting', label: 'Setting' },
  { value: 'management', label: 'Management' },
  { value: 'hos', label: 'Head of Sales' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'training', label: 'Formation' },
];

const EXPERIENCE_LEVELS = [
  { value: 'junior', label: 'Junior (0-1 an)' },
  { value: 'intermediaire', label: 'Intermédiaire (1-3 ans)' },
  { value: 'senior', label: 'Senior (3-5 ans)' },
  { value: 'expert', label: 'Expert (5+ ans)' },
];

const LANGUAGES = [
  { value: 'Français', label: 'Français' },
  { value: 'Anglais', label: 'Anglais' },
  { value: 'Espagnol', label: 'Espagnol' },
  { value: 'Arabe', label: 'Arabe' },
  { value: 'Portugais', label: 'Portugais' },
];

export default function NewOfferPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [offerType, setOfferType] = useState<OfferType>('commission_only');
  const [commissionRate, setCommissionRate] = useState('');
  const [productPrice, setProductPrice] = useState('');

  // Auto-qualification premium
  const isPremiumPreview = (parseFloat(commissionRate) || 0) >= 12 &&
    (parseFloat(productPrice) || 0) >= 5000;

  const toggleSkill = (skill: Skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) { setError('Non connecté'); setLoading(false); return; }

    // Vérifier la limite d'offres actives
    const { count } = await supabase
      .from('offers')
      .select('id', { count: 'exact', head: true })
      .eq('manager_id', user.id)
      .eq('status', 'active');

    const { data: userData } = await supabase
      .from('users')
      .select('tier')
      .eq('id', user.id)
      .single();

    const tier = userData?.tier || 'free';
    const maxOffers = tier === 'agency' ? Infinity : tier === 'business' ? 5 : 1;

    if ((count || 0) >= maxOffers) {
      setError(`Vous avez atteint la limite de ${maxOffers} offre${maxOffers > 1 ? 's' : ''} active${maxOffers > 1 ? 's' : ''} pour votre plan. Passez au plan supérieur pour en publier davantage.`);
      setLoading(false);
      return;
    }

    const title = (formData.get('title') as string).trim();
    const description = (formData.get('description') as string).trim();
    const commRate = formData.get('commission_rate') ? parseFloat(formData.get('commission_rate') as string) : null;
    const fixedSalary = formData.get('fixed_salary') ? parseFloat(formData.get('fixed_salary') as string) : null;
    const priceRange = (formData.get('product_price_range') as string)?.trim() || null;
    const niche = (formData.get('niche') as string) || null;
    const location = (formData.get('location') as string)?.trim() || null;
    const productType = (formData.get('product_type') as string)?.trim() || null;
    const experienceRequired = (formData.get('required_experience') as string) || null;
    const deadline = (formData.get('application_deadline') as string) || null;
    const maxApplicants = formData.get('max_applicants') ? parseInt(formData.get('max_applicants') as string) : null;

    if (!title || !description) {
      setError('Le titre et la description sont obligatoires.');
      setLoading(false);
      return;
    }

    if (selectedSkills.length === 0) {
      setError('Sélectionnez au moins une compétence recherchée.');
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('offers').insert({
      manager_id: user.id,
      title,
      description,
      offer_type: offerType,
      commission_rate: commRate,
      fixed_salary: fixedSalary,
      product_type: productType,
      product_price_range: priceRange,
      niche,
      location,
      required_experience: experienceRequired,
      required_skills: selectedSkills,
      required_languages: selectedLanguages,
      application_deadline: deadline || null,
      max_applicants: maxApplicants,
      status: 'active',
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard/offers');
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <a href="/dashboard/offers" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-dark transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour à mes offres
        </a>
        <h1 className="text-2xl font-bold text-brand-dark mt-2">Publier une offre</h1>
        <p className="text-gray-500 mt-1">Complétez les informations pour attirer les meilleurs candidats</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1 : Informations principales */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-brand-amber/10 text-brand-amber text-xs font-bold flex items-center justify-center">1</div>
              Informations de l&apos;offre
            </h2>

            <Input
              name="title"
              label="Titre de l'offre"
              placeholder="Ex : Closer pour formation immobilier haut de gamme"
              required
            />

            <Textarea
              name="description"
              label="Description détaillée"
              placeholder="Décrivez l'offre, le produit à vendre, les conditions de travail, les attentes..."
              rows={6}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                name="offer_type"
                label="Type de contrat"
                value={offerType}
                onChange={(e) => setOfferType(e.target.value as OfferType)}
                options={OFFER_TYPES}
              />
              <Select
                name="niche"
                label="Niche / Secteur"
                placeholder="Sélectionner..."
                options={NICHES.map(n => ({ value: n, label: n }))}
              />
            </div>

            <Input
              name="product_type"
              label="Type de produit"
              placeholder="Ex : Formation en ligne, coaching, SaaS..."
            />

            <Input
              name="location"
              label="Localisation"
              placeholder="Remote, Paris, Lyon... (laisser vide = Remote)"
            />
          </CardContent>
        </Card>

        {/* Section 2 : Rémunération */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-brand-amber/10 text-brand-amber text-xs font-bold flex items-center justify-center">2</div>
              Rémunération
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                name="commission_rate"
                label="Taux de commission (%)"
                type="number"
                step="0.5"
                min="0"
                max="100"
                placeholder="Ex : 10"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
              />
              {(offerType === 'full_time' || offerType === 'part_time') && (
                <Input
                  name="fixed_salary"
                  label="Salaire fixe mensuel (€)"
                  type="number"
                  step="100"
                  min="0"
                  placeholder="Ex : 2000"
                />
              )}
            </div>

            <Input
              name="product_price_range"
              label="Prix du produit / Fourchette"
              placeholder="Ex : 2 000€ - 5 000€"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              helperText="Indiquez le prix ou la fourchette de prix du produit à vendre"
            />

            {/* Preview premium */}
            {isPremiumPreview && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-brand-amber/10 border border-brand-amber/20">
                <Crown className="h-4 w-4 text-brand-amber shrink-0" />
                <p className="text-sm text-brand-amber font-medium">
                  Cette offre sera qualifiée Premium (commission ≥ 12% et produit ≥ 5 000€)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3 : Profil recherché */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-brand-amber/10 text-brand-amber text-xs font-bold flex items-center justify-center">3</div>
              Profil recherché
            </h2>

            {/* Skills multi-select */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Compétences recherchées <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((skill) => {
                  const isSelected = selectedSkills.includes(skill.value);
                  return (
                    <button
                      key={skill.value}
                      type="button"
                      onClick={() => toggleSkill(skill.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                        isSelected
                          ? 'bg-brand-dark text-white border-brand-dark'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-brand-dark hover:text-brand-dark'
                      }`}
                    >
                      {skill.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Select
              name="required_experience"
              label="Niveau d'expérience requis"
              placeholder="Tous niveaux"
              options={EXPERIENCE_LEVELS}
            />

            {/* Languages multi-select */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Langues requises
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => {
                  const isSelected = selectedLanguages.includes(lang.value);
                  return (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => toggleLanguage(lang.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                        isSelected
                          ? 'bg-brand-dark text-white border-brand-dark'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-brand-dark hover:text-brand-dark'
                      }`}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4 : Paramètres */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-brand-amber/10 text-brand-amber text-xs font-bold flex items-center justify-center">4</div>
              Paramètres de candidature
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                name="application_deadline"
                label="Date limite de candidature"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                helperText="Laissez vide pour aucune limite"
              />
              <Input
                name="max_applicants"
                label="Nombre maximum de candidats"
                type="number"
                min="1"
                placeholder="Illimité"
                helperText="Laissez vide pour illimité"
              />
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                L&apos;offre sera visible immédiatement dans la marketplace. Vous pourrez la mettre en pause ou la fermer à tout moment depuis votre tableau de bord.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Erreur */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" isLoading={loading} className="flex-1" size="lg">
            <Send className="h-4 w-4 mr-2" /> Publier l&apos;offre
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
