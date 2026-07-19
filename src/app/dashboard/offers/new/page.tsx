'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Button, Input, Textarea, Select } from '@/components/ui';
import { ArrowLeft, Send, Info, Crown, Plus, X, Timer, AlertTriangle } from 'lucide-react';
import type { Skill, OfferType } from '@/types/database';

const OFFER_TYPES: { value: OfferType; label: string; desc: string }[] = [
  { value: 'challenge', label: 'Challenge', desc: 'Mission courte avec objectif de performance' },
  { value: 'recurring', label: 'Recurring à l\'année', desc: 'Collaboration longue durée, récurrente' },
  { value: 'mission', label: 'Mission ponctuelle', desc: 'Mission unique avec début et fin définis' },
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

interface ProductLine {
  id: string;
  name: string;
  price: string;
  commission: string; // Taux de commission propre au produit (%)
}

function DeadlineCountdown({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'soon' | 'urgent' | 'expired'>('normal');

  const computeCountdown = useCallback(() => {
    const now = new Date();
    const end = new Date(deadline + 'T23:59:59');
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeLeft('Expirée');
      setUrgency('expired');
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 7) {
      setTimeLeft(`${days}j ${hours}h restants`);
      setUrgency('normal');
    } else if (days > 3) {
      setTimeLeft(`${days}j ${hours}h ${minutes}min restants`);
      setUrgency('soon');
    } else if (days > 0) {
      setTimeLeft(`${days}j ${hours}h ${minutes}min restants`);
      setUrgency('urgent');
    } else {
      setTimeLeft(`${hours}h ${minutes}min ${seconds}s restants`);
      setUrgency('urgent');
    }
  }, [deadline]);

  useEffect(() => {
    computeCountdown();
    const interval = setInterval(computeCountdown, 1000);
    return () => clearInterval(interval);
  }, [computeCountdown]);

  if (!deadline) return null;

  const styles = {
    normal: 'bg-blue-50 border-blue-200 text-blue-700',
    soon: 'bg-amber-50 border-amber-200 text-amber-700',
    urgent: 'bg-orange-50 border-orange-200 text-orange-700',
    expired: 'bg-red-50 border-red-200 text-red-700',
  };

  const iconStyles = {
    normal: 'text-blue-500',
    soon: 'text-amber-500',
    urgent: 'text-orange-500',
    expired: 'text-red-500',
  };

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border ${styles[urgency]}`}>
      {urgency === 'expired' ? (
        <AlertTriangle className={`h-4 w-4 shrink-0 ${iconStyles[urgency]}`} />
      ) : (
        <Timer className={`h-4 w-4 shrink-0 ${iconStyles[urgency]}`} />
      )}
      <div className="flex-1">
        <span className="text-sm font-semibold tabular-nums">{timeLeft}</span>
        <span className="text-xs opacity-75 ml-2">
          pour candidater (fin le {new Date(deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })})
        </span>
      </div>
    </div>
  );
}

export default function NewOfferPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [offerType, setOfferType] = useState<OfferType>('challenge');
  const [deadline, setDeadline] = useState('');

  // Produits multiples avec commission individuelle
  const [products, setProducts] = useState<ProductLine[]>([
    { id: '1', name: '', price: '', commission: '' },
  ]);

  const addProduct = () => {
    setProducts(prev => [...prev, { id: Date.now().toString(), name: '', price: '', commission: '' }]);
  };

  const removeProduct = (id: string) => {
    if (products.length <= 1) return;
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateProduct = (id: string, field: 'name' | 'price' | 'commission', value: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  // Auto-qualification premium : regarde si AU MOINS UN produit a commission >= 12% ET prix >= 5000€
  const maxProductCommission = Math.max(...products.map(p => parseFloat(p.commission) || 0), 0);
  const maxProductPrice = Math.max(...products.map(p => parseFloat(p.price) || 0), 0);
  const isPremiumPreview = maxProductCommission >= 12 && maxProductPrice >= 5000;

  // Concaténer les produits en une string pour product_price_range (inclut commission par produit)
  const buildPriceRange = (): string => {
    return products
      .filter(p => p.name.trim() || p.price.trim())
      .map(p => {
        const parts = [];
        if (p.name.trim()) parts.push(p.name.trim());
        if (p.price.trim()) parts.push(`${parseFloat(p.price).toLocaleString('fr-FR')}€`);
        if (p.commission.trim()) parts.push(`${p.commission}%`);
        return parts.join(' : ');
      })
      .join(' | ');
  };

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
    // Commission stockée en BDD = max parmi tous les produits (les détails par produit sont dans product_price_range)
    const commRate = maxProductCommission > 0 ? maxProductCommission : null;
    const fixedSalary = formData.get('fixed_salary') ? parseFloat(formData.get('fixed_salary') as string) : null;
    const priceRange = buildPriceRange() || null;
    const niche = (formData.get('niche') as string)?.trim() || null;
    const infoproductName = (formData.get('infoproduct_name') as string)?.trim() || null;
    const instagramUrl = (formData.get('instagram_url') as string)?.trim() || null;
    const linkedinUrl = (formData.get('linkedin_url') as string)?.trim() || null;
    const experienceRequired = (formData.get('required_experience') as string) || null;
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

    if (selectedLanguages.length === 0) {
      setError('Sélectionnez au moins une langue requise.');
      setLoading(false);
      return;
    }

    const hasValidProduct = products.some(p => p.name.trim() && p.price.trim() && p.commission.trim());
    if (!hasValidProduct) {
      setError('Ajoutez au moins un produit complet (nom, prix et taux de commission).');
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
      product_type: infoproductName,
      product_price_range: priceRange,
      niche,
      location: [instagramUrl, linkedinUrl].filter(Boolean).join(' | ') || null,
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

            {/* Type de contrat — boutons radio visuels */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Type de contrat <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {OFFER_TYPES.map((type) => {
                  const isSelected = offerType === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setOfferType(type.value)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-brand-dark text-white border-brand-dark'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-brand-dark'
                      }`}
                    >
                      <span className="text-sm font-medium block">{type.label}</span>
                      <span className={`text-xs block mt-0.5 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                        {type.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Niche — champ libre */}
            <Input
              name="niche"
              label="Niche / Secteur"
              placeholder="Ex : Immobilier, Crypto, Coaching, E-commerce, Santé..."
              helperText="Écrivez librement le secteur de votre offre"
              required
            />

            <Input
              name="infoproduct_name"
              label="Nom de l'infoproduit"
              placeholder="Ex : Formation « Investir en immobilier », Coaching Mindset Pro..."
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                name="instagram_url"
                label="Lien Instagram"
                type="url"
                placeholder="https://instagram.com/..."
              />
              <Input
                name="linkedin_url"
                label="Lien LinkedIn"
                type="url"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2 : Rémunération & Produits */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-brand-amber/10 text-brand-amber text-xs font-bold flex items-center justify-center">2</div>
              Rémunération et produits
            </h2>

            {offerType === 'recurring' && (
              <Input
                name="fixed_salary"
                label="Salaire fixe mensuel (€)"
                type="number"
                step="100"
                min="0"
                placeholder="Ex : 2000"
                helperText="Optionnel — rémunération fixe en plus de la commission"
              />
            )}

            {/* Produits multiples avec commission individuelle */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Produits à vendre <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-400">
                Ajoutez chaque produit/offre avec son prix et son taux de commission. Chaque produit peut avoir un taux différent.
              </p>

              {/* En-têtes des colonnes */}
              <div className="hidden sm:grid grid-cols-[1fr_120px_100px_36px] gap-2 px-1">
                <span className="text-xs text-gray-400 font-medium">Nom du produit</span>
                <span className="text-xs text-gray-400 font-medium">Prix</span>
                <span className="text-xs text-gray-400 font-medium">Commission</span>
                <span></span>
              </div>

              <div className="space-y-2">
                {products.map((product, idx) => (
                  <div key={product.id} className="flex items-center gap-2">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_120px_100px] gap-2">
                      <input
                        type="text"
                        placeholder={`Produit ${idx + 1} — nom`}
                        value={product.name}
                        onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                        required={idx === 0}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-green focus:ring-brand-green/20"
                      />
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="Prix"
                          step="100"
                          min="0"
                          value={product.price}
                          onChange={(e) => updateProduct(product.id, 'price', e.target.value)}
                          required={idx === 0}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-green focus:ring-brand-green/20"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="Taux"
                          step="0.5"
                          min="0"
                          max="100"
                          value={product.commission}
                          onChange={(e) => updateProduct(product.id, 'commission', e.target.value)}
                          required={idx === 0}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-green focus:ring-brand-green/20"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                      </div>
                    </div>
                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProduct(product.id)}
                        className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addProduct}
                className="flex items-center gap-1.5 text-sm text-brand-dark hover:text-brand-amber transition-colors font-medium"
              >
                <Plus className="h-4 w-4" /> Ajouter un produit
              </button>
            </div>

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
              placeholder="Sélectionner..."
              options={EXPERIENCE_LEVELS}
              required
            />

            {/* Languages multi-select */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Langues requises <span className="text-red-500">*</span>
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

        {/* Section 4 : Paramètres + Décompte */}
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
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
              <Input
                name="max_applicants"
                label="Nombre maximum de candidats"
                type="number"
                min="1"
                placeholder="Ex : 10"
                required
              />
            </div>

            {/* Décompte temps réel */}
            {deadline && <DeadlineCountdown deadline={deadline} />}

            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                L&apos;offre sera visible immédiatement dans la marketplace. Les candidats verront le décompte en temps réel. Vous pourrez la mettre en pause ou la fermer à tout moment.
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
