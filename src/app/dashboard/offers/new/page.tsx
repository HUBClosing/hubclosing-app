'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Button, Input, Textarea } from '@/components/ui';
import { ArrowLeft, Send, Info, Crown, Plus, X, Timer, AlertTriangle, ClipboardList, Trash2, GripVertical, CheckSquare, AlignLeft, Lock, Sparkles } from 'lucide-react';
import type { Skill, OfferType, Questionnaire } from '@/types/database';

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
  commission: string;
}

interface InlineQuestion {
  id: string;
  type: 'mcq' | 'free_text';
  text: string;
  options: string[];       // For MCQ: the choices
  correctAnswers: number[]; // For MCQ: indices of correct answers
  isRequired: boolean;
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
  const [enableQuestionnaire, setEnableQuestionnaire] = useState(false);
  const [questionnaireTitle, setQuestionnaireTitle] = useState('');
  const [inlineQuestions, setInlineQuestions] = useState<InlineQuestion[]>([]);
  const [hasMatchingIA, setHasMatchingIA] = useState(false);

  // Vérifier si le recruteur a le matching IA (tier solo, equipe, campagne ou agency)
  useEffect(() => {
    const checkMatching = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('tier').eq('id', user.id).single();
      if (data && data.tier && data.tier !== 'free') {
        setHasMatchingIA(true);
      }
    };
    checkMatching();
  }, []);

  const addQuestion = (type: 'mcq' | 'free_text') => {
    setInlineQuestions(prev => [...prev, {
      id: Date.now().toString(),
      type,
      text: '',
      options: type === 'mcq' ? ['', ''] : [],
      correctAnswers: [],
      isRequired: true,
    }]);
  };

  const updateQuestion = (id: string, updates: Partial<InlineQuestion>) => {
    setInlineQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setInlineQuestions(prev => prev.filter(q => q.id !== id));
  };

  const addOption = (qId: string) => {
    setInlineQuestions(prev => prev.map(q => q.id === qId ? { ...q, options: [...q.options, ''] } : q));
  };

  const updateOption = (qId: string, idx: number, value: string) => {
    setInlineQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      const opts = [...q.options];
      opts[idx] = value;
      return { ...q, options: opts };
    }));
  };

  const removeOption = (qId: string, idx: number) => {
    setInlineQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      const opts = q.options.filter((_, i) => i !== idx);
      const correct = q.correctAnswers.filter(i => i !== idx).map(i => i > idx ? i - 1 : i);
      return { ...q, options: opts, correctAnswers: correct };
    }));
  };

  const toggleCorrectAnswer = (qId: string, idx: number) => {
    setInlineQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      const correct = q.correctAnswers.includes(idx)
        ? q.correctAnswers.filter(i => i !== idx)
        : [...q.correctAnswers, idx];
      return { ...q, correctAnswers: correct };
    }));
  };

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
      .select('tier, recruiter_annonces_remaining')
      .eq('id', user.id)
      .single();

    const tier = userData?.tier || 'free';
    const annoncesRemaining = userData?.recruiter_annonces_remaining || 0;

    // Vérifier les crédits d'annonces (agency = illimité, packs = basé sur crédits)
    if (tier === 'free') {
      setError('Vous devez acheter un pack recruteur pour publier une offre.');
      setLoading(false);
      return;
    }

    if (tier !== 'agency' && annoncesRemaining <= 0) {
      setError('Vous n\'avez plus de crédit d\'annonce. Achetez une annonce supplémentaire ou un nouveau pack.');
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
    const hosVideoUrl = (formData.get('hos_video_url') as string)?.trim() || null;
    const maxApplicants = formData.get('max_applicants') ? parseInt(formData.get('max_applicants') as string) : null;

    // Profil prospect cible
    const prospectGender = (formData.get('prospect_gender') as string)?.trim() || null;
    const prospectAgeRange = (formData.get('prospect_age_range') as string)?.trim() || null;
    const prospectQualities = (formData.get('prospect_qualities') as string)?.trim() || null;
    const prospectExperience = (formData.get('prospect_experience') as string)?.trim() || null;
    const prospectValues = (formData.get('prospect_values') as string)?.trim() || null;
    const prospectMindset = (formData.get('prospect_mindset') as string)?.trim() || null;

    // Profil idéal Matching IA
    const idealAgeRange = (formData.get('ideal_age_range') as string)?.trim() || null;
    const idealExperience = (formData.get('ideal_experience') as string)?.trim() || null;
    const idealMindset = (formData.get('ideal_mindset') as string)?.trim() || null;
    const idealValues = (formData.get('ideal_values') as string)?.trim() || null;

    if (!title || !description) {
      setError('Le titre et la description sont obligatoires.');
      setLoading(false);
      return;
    }

    if (!niche) {
      setError('La niche / secteur est obligatoire.');
      setLoading(false);
      return;
    }

    if (!infoproductName) {
      setError('Le nom de l\'infoproduit est obligatoire.');
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

    // Créer le questionnaire inline si activé
    let questionnaireId: string | null = null;
    if (enableQuestionnaire && inlineQuestions.length > 0) {
      const qTitle = questionnaireTitle.trim() || `Questionnaire — ${title}`;
      const { data: qData, error: qError } = await supabase.from('questionnaires').insert({
        title: qTitle,
        recruiter_id: user.id,
      }).select('id').single();

      if (qError) {
        setError('Erreur création questionnaire : ' + qError.message);
        setLoading(false);
        return;
      }

      questionnaireId = qData.id;

      // Insérer les questions
      const questionsToInsert = inlineQuestions.map((q, idx) => ({
        questionnaire_id: questionnaireId,
        question_text: q.text,
        question_type: q.type === 'mcq' ? 'mcq' : 'text',
        options: q.type === 'mcq' ? q.options.filter(o => o.trim()) : null,
        correct_answers: q.type === 'mcq' && q.correctAnswers.length > 0 ? q.correctAnswers.map(i => q.options[i]) : null,
        is_required: q.isRequired,
        sort_order: idx,
      }));

      const { error: questionsError } = await supabase.from('questionnaire_questions').insert(questionsToInsert);
      if (questionsError) {
        setError('Erreur création questions : ' + questionsError.message);
        setLoading(false);
        return;
      }
    }

    // Construire la description enrichie avec le profil prospect
    const prospectSection = [
      '\n\n--- PROFIL DU PROSPECT CIBLE ---',
      prospectGender ? `Genre : ${prospectGender}` : null,
      prospectAgeRange ? `Tranche d'âge : ${prospectAgeRange}` : null,
      prospectQualities ? `Qualités : ${prospectQualities}` : null,
      prospectExperience ? `Expérience : ${prospectExperience}` : null,
      prospectValues ? `Valeurs : ${prospectValues}` : null,
      prospectMindset ? `Mindset : ${prospectMindset}` : null,
    ].filter(Boolean).join('\n');

    const fullDescription = description + prospectSection;

    // Stocker le profil idéal Matching IA en metadata JSON
    const idealProfile = (idealAgeRange || idealExperience || idealMindset || idealValues) ? JSON.stringify({
      age_range: idealAgeRange,
      experience: idealExperience,
      mindset: idealMindset,
      values: idealValues,
    }) : null;

    const { error: insertError } = await supabase.from('offers').insert({
      manager_id: user.id,
      title,
      description: fullDescription,
      offer_type: offerType,
      commission_rate: commRate,
      fixed_salary: fixedSalary,
      product_type: infoproductName,
      product_price_range: priceRange,
      niche,
      location: [instagramUrl, linkedinUrl].filter(Boolean).join(' | ') || null,
      video_url: hosVideoUrl,
      hos_video_url: hosVideoUrl,
      replay_url: idealProfile,
      required_skills: selectedSkills,
      required_languages: selectedLanguages,
      questionnaire_id: questionnaireId,
      application_deadline: deadline || null,
      max_applicants: maxApplicants,
      status: 'active',
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Décrémenter le crédit d'annonce (sauf agency = illimité)
    if (tier !== 'agency') {
      await supabase.from('users').update({
        recruiter_annonces_remaining: Math.max(0, annoncesRemaining - 1),
      }).eq('id', user.id);
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
              name="infoproduct_name"
              label="Nom de l'infoproduit"
              placeholder="Ex : Formation « Investir en immobilier », Coaching Mindset Pro..."
              required
            />

            <Input
              name="title"
              label="Titre de l'offre"
              placeholder="Ex : Closer pour formation immobilier haut de gamme"
              required
            />

            {/* Niche — champ libre */}
            <Input
              name="niche"
              label="Niche / Secteur"
              placeholder="Ex : Immobilier, Crypto, Coaching, E-commerce, Santé..."
              helperText="Écrivez librement le secteur de votre offre"
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

            <div className="space-y-1">
              <Textarea
                name="description"
                label="Description de l'offre"
                placeholder="Décrivez l'offre, le produit à vendre, les conditions de travail, les attentes..."
                rows={6}
                required
              />
              <p className="text-xs text-gray-400">Mettez un max d&apos;infos pour rendre votre offre attractive</p>
            </div>

            {/* Sous-section : Profil du prospect cible */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-brand-dark">Profil du prospect cible</h3>
              <p className="text-xs text-gray-500">Décrivez le type de client que le closer devra contacter pour correspondre à votre audience.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Genre du prospect <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="prospect_gender"
                    required
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                  >
                    <option value="">Sélectionner</option>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                    <option value="indifferent">Indifférent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Tranche d&apos;âge du prospect <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="prospect_age_range"
                    required
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                  >
                    <option value="">Sélectionner</option>
                    <option value="indifferent">Indifférent</option>
                    <option value="18-25">18 – 25 ans</option>
                    <option value="25-35">25 – 35 ans</option>
                    <option value="35-45">35 – 45 ans</option>
                    <option value="45+">45 ans et +</option>
                  </select>
                </div>
              </div>

              <Textarea
                name="prospect_qualities"
                label="Qualités personnelles recherchées"
                placeholder="Ex : Empathique, bon communicant, à l'écoute, orienté résultats..."
                rows={2}
                required
              />

              <Input
                name="prospect_experience"
                label="Expérience minimum requise"
                placeholder="Ex : 6 mois en closing, 1 an en vente B2C..."
                required
              />

              <Textarea
                name="prospect_values"
                label="Valeurs attendues"
                placeholder="Ex : Éthique, transparence, engagement, excellence..."
                rows={2}
                required
              />

              <Textarea
                name="prospect_mindset"
                label="Mindset recherché"
                placeholder="Ex : Growth mindset, résilient, autonome, ambitieux..."
                rows={2}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                name="instagram_url"
                label="Lien Instagram"
                type="url"
                placeholder="https://instagram.com/..."
                required
              />
              <Input
                name="linkedin_url"
                label="Lien LinkedIn"
                type="url"
                placeholder="https://linkedin.com/in/..."
                required
              />
            </div>

            <div className="space-y-1">
              <Input
                name="hos_video_url"
                label="Vidéo de présentation HOS / Infopreneur (optionnel)"
                type="url"
                placeholder="https://youtube.com/... ou https://loom.com/..."
              />
              <p className="text-xs text-brand-amber">💡 Fortement suggéré — une vidéo du HOS ou de l&apos;infopreneur attire beaucoup plus de candidats qualifiés</p>
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

            <Input
              name="fixed_salary"
              label="Salaire fixe mensuel (€)"
              type="number"
              step="100"
              min="0"
              placeholder="Ex : 2000"
              helperText="Optionnel — rémunération fixe en plus de la commission"
            />

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

            {/* Questionnaire intégré */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableQuestionnaire}
                    onChange={(e) => setEnableQuestionnaire(e.target.checked)}
                    className="rounded border-gray-300 text-brand-amber focus:ring-brand-amber"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Ajouter un questionnaire de qualification
                  </span>
                  <span className="text-xs text-gray-400 block ml-6">
                    Affinez vos critères de sélection en posant des questions ciblées aux candidats
                  </span>
                </label>
              </div>

              {enableQuestionnaire && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="h-5 w-5 text-brand-amber" />
                    <p className="text-sm font-semibold text-brand-dark">Questionnaire — testez les connaissances des candidats</p>
                  </div>

                  <Input
                    label="Titre du questionnaire"
                    placeholder="Ex : Test de connaissances en immobilier"
                    value={questionnaireTitle}
                    onChange={(e) => setQuestionnaireTitle(e.target.value)}
                  />

                  {/* Liste des questions */}
                  {inlineQuestions.map((q, qIdx) => (
                    <div key={q.id} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {q.type === 'mcq' ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                              <CheckSquare className="h-3 w-3" /> QCM
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                              <AlignLeft className="h-3 w-3" /> Réponse libre
                            </span>
                          )}
                          <span className="text-xs text-gray-400">Question {qIdx + 1}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={q.isRequired}
                              onChange={(e) => updateQuestion(q.id, { isRequired: e.target.checked })}
                              className="rounded border-gray-300 text-brand-amber focus:ring-brand-amber h-3.5 w-3.5"
                            />
                            Obligatoire
                          </label>
                          <button
                            type="button"
                            onClick={() => removeQuestion(q.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Votre question..."
                        value={q.text}
                        onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                      />

                      {/* Options QCM */}
                      {q.type === 'mcq' && (
                        <div className="space-y-2 pl-2">
                          <p className="text-xs text-gray-400">Cochez la ou les bonnes réponses :</p>
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleCorrectAnswer(q.id, optIdx)}
                                className={`shrink-0 h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                                  q.correctAnswers.includes(optIdx)
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'border-gray-300 hover:border-green-400'
                                }`}
                              >
                                {q.correctAnswers.includes(optIdx) && <CheckSquare className="h-3 w-3" />}
                              </button>
                              <input
                                type="text"
                                placeholder={`Option ${optIdx + 1}`}
                                value={opt}
                                onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                              />
                              {q.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(q.id, optIdx)}
                                  className="text-gray-300 hover:text-red-500 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOption(q.id)}
                            className="text-xs text-brand-dark hover:text-brand-amber font-medium flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" /> Ajouter une option
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Boutons ajout question */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => addQuestion('mcq')}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors"
                    >
                      <CheckSquare className="h-4 w-4" /> Ajouter un QCM
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion('free_text')}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-200 transition-colors"
                    >
                      <AlignLeft className="h-4 w-4" /> Ajouter une question libre
                    </button>
                  </div>

                  {inlineQuestions.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">
                      Ajoutez des questions pour tester les connaissances des candidats dans votre thématique
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                L&apos;offre sera visible immédiatement dans la marketplace. Les candidats verront le décompte en temps réel. Vous pourrez la mettre en pause ou la fermer à tout moment.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 5 : Profil Idéal — Matching IA */}
        <Card className={!hasMatchingIA ? 'opacity-75 relative' : ''}>
          {!hasMatchingIA && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-xl z-10 flex flex-col items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-full bg-brand-amber/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-brand-amber" />
              </div>
              <p className="text-sm font-semibold text-brand-dark">Matching IA</p>
              <p className="text-xs text-gray-500 text-center max-w-xs">Complétez le profil idéal de votre closer pour bénéficier du matching IA et recevoir les meilleurs profils automatiquement.</p>
              <a href="/dashboard/subscription" className="text-xs font-medium text-brand-amber hover:underline">
                Débloquer le Matching IA →
              </a>
            </div>
          )}
          <CardContent className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-brand-amber to-orange-500 text-white text-xs font-bold flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              Profil idéal du closer — Matching IA
            </h2>
            <p className="text-xs text-gray-500">
              Décrivez le closer idéal pour cette offre. Ces critères seront utilisés par notre algorithme de Matching IA pour vous proposer automatiquement les profils les plus compatibles.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Tranche d&apos;âge idéale</label>
                <select
                  name="ideal_age_range"
                  disabled={!hasMatchingIA}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green disabled:bg-gray-100"
                >
                  <option value="">Indifférent</option>
                  <option value="18-25">18 – 25 ans</option>
                  <option value="25-35">25 – 35 ans</option>
                  <option value="35-45">35 – 45 ans</option>
                  <option value="45+">45 ans et +</option>
                </select>
              </div>

              <Input
                name="ideal_experience"
                label="Expérience souhaitée"
                placeholder="Ex : 1 an en closing B2C, débutant accepté..."
                disabled={!hasMatchingIA}
              />
            </div>

            <Textarea
              name="ideal_mindset"
              label="Mindset recherché"
              placeholder="Ex : Ambitieux, résilient, orienté résultats, capacité à gérer la pression..."
              rows={2}
              disabled={!hasMatchingIA}
            />

            <Textarea
              name="ideal_values"
              label="Valeurs importantes"
              placeholder="Ex : Éthique, transparence, esprit d'équipe, excellence..."
              rows={2}
              disabled={!hasMatchingIA}
            />
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
