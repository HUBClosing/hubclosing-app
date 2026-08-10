'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Button, Input, Textarea } from '@/components/ui';
import { ArrowLeft, Save, Loader2, Clock } from 'lucide-react';
import type { Offer, Skill, OfferType } from '@/types/database';

const OFFER_TYPES: { value: OfferType; label: string }[] = [
  { value: 'challenge', label: 'Challenge' },
  { value: 'recurring', label: 'Recurring à l\'année' },
  { value: 'mission', label: 'Mission ponctuelle' },
];

const SKILLS: { value: Skill; label: string }[] = [
  { value: 'closing', label: 'Closing' },
  { value: 'setting', label: 'Setting' },
  { value: 'management', label: 'Management' },
  { value: 'hos', label: 'Head of Sales' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'training', label: 'Formation' },
];

const LANGUAGES = [
  { value: 'Français', label: 'Français' },
  { value: 'Anglais', label: 'Anglais' },
  { value: 'Espagnol', label: 'Espagnol' },
  { value: 'Arabe', label: 'Arabe' },
  { value: 'Portugais', label: 'Portugais' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700' },
  { value: 'paused', label: 'En pause', color: 'bg-amber-100 text-amber-700' },
  { value: 'closed', label: 'Fermée', color: 'bg-gray-100 text-gray-600' },
];

export default function EditOfferPage() {
  const router = useRouter();
  const params = useParams();
  const offerId = params.id as string;
  const supabase = createClient();

  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [offerType, setOfferType] = useState<OfferType>('challenge');
  const [niche, setNiche] = useState('');
  const [infoproductName, setInfoproductName] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [replayUrl, setReplayUrl] = useState('');
  const [hosVideoUrl, setHosVideoUrl] = useState('');
  const [fixedSalary, setFixedSalary] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [productPriceRange, setProductPriceRange] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [maxApplicants, setMaxApplicants] = useState('');
  const [status, setStatus] = useState('active');

  // Load offer
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('offers').select('*').eq('id', offerId).single();
      if (!data) { setLoading(false); return; }

      const o = data as Offer;
      setOffer(o);
      setTitle(o.title || '');
      setDescription(o.description || '');
      setOfferType(o.offer_type || 'challenge');
      setNiche(o.niche || '');
      setInfoproductName(o.product_type || '');
      setFixedSalary(o.fixed_salary ? String(o.fixed_salary) : '');
      setCommissionRate(o.commission_rate ? String(o.commission_rate) : '');
      setProductPriceRange(o.product_price_range || '');
      setSelectedSkills((o.required_skills as Skill[]) || []);
      setSelectedLanguages(o.required_languages || []);
      setDeadline(o.application_deadline || '');
      setMaxApplicants(o.max_applicants ? String(o.max_applicants) : '');
      setStatus(o.status || 'active');

      // Parse location field for Instagram/LinkedIn
      const locationParts = (o.location || '').split(' | ');
      locationParts.forEach(part => {
        if (part.includes('instagram')) setInstagramUrl(part);
        else if (part.includes('linkedin')) setLinkedinUrl(part);
      });

      setVideoUrl((o as any).video_url || '');
      setReplayUrl((o as any).replay_url || '');
      setHosVideoUrl((o as any).hos_video_url || '');

      setLoading(false);
    }
    load();
  }, [offerId, supabase]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (!title.trim() || !description.trim()) {
      setError('Le titre et la description sont obligatoires.');
      setSaving(false);
      return;
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase.from('offers').update({
      title: title.trim(),
      description: description.trim(),
      offer_type: offerType,
      niche: niche.trim() || null,
      product_type: infoproductName.trim() || null,
      fixed_salary: fixedSalary ? parseFloat(fixedSalary) : null,
      commission_rate: commissionRate ? parseFloat(commissionRate) : null,
      product_price_range: productPriceRange.trim() || null,
      location: [instagramUrl.trim(), linkedinUrl.trim()].filter(Boolean).join(' | ') || null,
      video_url: videoUrl.trim() || null,
      replay_url: replayUrl.trim() || null,
      hos_video_url: hosVideoUrl.trim() || null,
      required_skills: selectedSkills,
      required_languages: selectedLanguages,
      application_deadline: deadline || null,
      max_applicants: maxApplicants ? parseInt(maxApplicants) : null,
      status,
      updated_at: now,
    }).eq('id', offerId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess('Offre mise à jour avec succès !');
    setOffer(prev => prev ? { ...prev, updated_at: now } : prev);
    setSaving(false);
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Chargement...</div>;
  if (!offer) return <div className="text-center py-12 text-gray-500">Offre introuvable</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <a href="/dashboard/offers" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-dark transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour à mes offres
        </a>
        <h1 className="text-2xl font-bold text-brand-dark mt-2">Modifier l&apos;offre</h1>
        {(offer as any).updated_at && (
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3" />
            Dernière mise à jour : {new Date((offer as any).updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Statut */}
        <Card>
          <CardContent className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut de l&apos;offre</label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    status === opt.value
                      ? `${opt.color} ring-2 ring-offset-1 ring-current border-current`
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Informations principales */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-brand-dark">Informations de l&apos;offre</h2>
            <Input label="Titre" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} required />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Type de contrat</label>
              <div className="flex gap-2">
                {OFFER_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setOfferType(t.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      offerType === t.value ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white text-gray-600 border-gray-300 hover:border-brand-dark'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <Input label="Niche / Secteur" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Ex : Immobilier, Crypto..." />
            <Input label="Nom de l'infoproduit" value={infoproductName} onChange={(e) => setInfoproductName(e.target.value)} placeholder="Ex : Formation Investir..." />

            <div className="grid grid-cols-2 gap-4">
              <Input label="Instagram (optionnel)" type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." />
              <Input label="LinkedIn (optionnel)" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/..." />
            </div>

            <Input label="Vidéo de présentation (optionnel)" type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." />
            <Input label="Exemple de call (optionnel)" type="url" value={replayUrl} onChange={(e) => setReplayUrl(e.target.value)} placeholder="https://fathom.video/..." />
            <Input label="Vidéo HOS / Infopreneur (optionnel)" type="url" value={hosVideoUrl} onChange={(e) => setHosVideoUrl(e.target.value)} placeholder="https://youtube.com/..." />
          </CardContent>
        </Card>

        {/* Rémunération */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-brand-dark">Rémunération</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Salaire fixe (€, optionnel)" type="number" value={fixedSalary} onChange={(e) => setFixedSalary(e.target.value)} placeholder="Ex : 2000" />
              <Input label="Taux de commission (%)" type="number" step="0.5" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} placeholder="Ex : 10" />
            </div>
            <Input label="Détail produits et prix" value={productPriceRange} onChange={(e) => setProductPriceRange(e.target.value)} placeholder="Produit 1 : 5000€ : 10% | Produit 2 : 2000€ : 15%" />
          </CardContent>
        </Card>

        {/* Profil recherché */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-brand-dark">Profil recherché</h2>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Compétences</label>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map(s => (
                  <button key={s.value} type="button" onClick={() => toggleSkill(s.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      selectedSkills.includes(s.value) ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white text-gray-600 border-gray-300 hover:border-brand-dark'
                    }`}
                  >{s.label}</button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Langues</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(l => (
                  <button key={l.value} type="button" onClick={() => toggleLanguage(l.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      selectedLanguages.includes(l.value) ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white text-gray-600 border-gray-300 hover:border-brand-dark'
                    }`}
                  >{l.label}</button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paramètres */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-brand-dark">Paramètres</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Date limite" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              <Input label="Max candidats" type="number" min="1" value={maxApplicants} onChange={(e) => setMaxApplicants(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        {success && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" isLoading={saving} className="flex-1" size="lg">
            <Save className="h-4 w-4 mr-2" /> Enregistrer les modifications
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
