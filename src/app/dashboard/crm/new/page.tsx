'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui';
import {
  Calendar, ArrowLeft, Search, Plus, X, UserPlus, Mail,
} from 'lucide-react';
import type { CrmEventType } from '@/types/database';
import { CRM_EVENT_TYPE_LABELS } from '@/types/database';

interface SearchResult {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  niches: string[] | null;
}

interface CloserToAssign {
  closer_id: string | null;
  closer_name: string;
  closer_email: string;
  is_external: boolean;
}

interface OfferOption {
  id: string;
  title: string;
}

export default function NewEventPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [offers, setOffers] = useState<OfferOption[]>([]);

  // Champs formulaire
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<CrmEventType>('challenge');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [offerId, setOfferId] = useState('');
  const [notes, setNotes] = useState('');

  // Assignation closers
  const [closersToAssign, setClosersToAssign] = useState<CloserToAssign[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showExternalForm, setShowExternalForm] = useState(false);
  const [externalName, setExternalName] = useState('');
  const [externalEmail, setExternalEmail] = useState('');

  // Charger les offres du recruteur
  useEffect(() => {
    async function loadOffers() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('offers')
        .select('id, title')
        .eq('manager_id', user.id)
        .order('created_at', { ascending: false });

      setOffers(data || []);
    }
    loadOffers();
  }, [supabase]);

  // Recherche closers
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/crm/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          // Filtrer ceux déjà ajoutés
          const existingIds = new Set(closersToAssign.map(c => c.closer_id).filter(Boolean));
          setSearchResults(data.filter((u: SearchResult) => !existingIds.has(u.id)));
        }
      } catch { /* ignore */ }
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, closersToAssign]);

  const addCloser = (user: SearchResult) => {
    setClosersToAssign(prev => [...prev, {
      closer_id: user.id,
      closer_name: user.full_name,
      closer_email: user.email,
      is_external: false,
    }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const addExternalCloser = () => {
    if (!externalName.trim() || !externalEmail.trim()) return;
    setClosersToAssign(prev => [...prev, {
      closer_id: null,
      closer_name: externalName.trim(),
      closer_email: externalEmail.trim(),
      is_external: true,
    }]);
    setExternalName('');
    setExternalEmail('');
    setShowExternalForm(false);
  };

  const removeCloser = (index: number) => {
    setClosersToAssign(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) return;

    setSaving(true);
    try {
      // 1. Créer l'événement
      const res = await fetch('/api/crm/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          event_type: eventType,
          start_date: startDate,
          end_date: endDate || null,
          description: description.trim() || null,
          offer_id: offerId || null,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Erreur lors de la création');
        setSaving(false);
        return;
      }

      const event = await res.json();

      // 2. Assigner les closers
      for (const closer of closersToAssign) {
        if (closer.is_external) {
          // Invitation externe
          await fetch('/api/crm/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_id: event.id,
              closer_name: closer.closer_name,
              closer_email: closer.closer_email,
            }),
          });
        } else {
          // Assignation directe
          await fetch(`/api/crm/events/${event.id}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              closer_id: closer.closer_id,
              closer_name: closer.closer_name,
              closer_email: closer.closer_email,
            }),
          });
        }
      }

      router.push(`/dashboard/crm/${event.id}`);
    } catch {
      alert('Erreur lors de la création');
    }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <a href="/dashboard/crm" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </a>
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Nouvel événement</h1>
          <p className="text-gray-500 mt-1">Créez un événement et assignez vos closers</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Infos événement */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-amber" />
              Informations
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre de l&apos;événement <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Lancement Formation X"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as CrmEventType)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber"
                >
                  {(Object.entries(CRM_EVENT_TYPE_LABELS) as [CrmEventType, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Offre liée
                </label>
                <select
                  value={offerId}
                  onChange={(e) => setOfferId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber"
                >
                  <option value="">Aucune offre liée</option>
                  {offers.map(o => (
                    <option key={o.id} value={o.id}>{o.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Décrivez l'événement..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes internes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Notes visibles uniquement par vous..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Assignation closers */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-brand-dark flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-brand-amber" />
              Closers
            </h2>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un closer par nom..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-amber/30 focus:border-brand-amber"
              />

              {/* Résultats recherche */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {searchResults.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => addCloser(u)}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 text-left"
                    >
                      <div className="h-8 w-8 rounded-full bg-brand-amber/10 flex items-center justify-center text-brand-amber font-bold text-sm">
                        {u.full_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-brand-dark truncate">{u.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      {u.niches && u.niches.length > 0 && (
                        <span className="text-xs text-gray-400">{u.niches[0]}</span>
                      )}
                      <Plus className="h-4 w-4 text-brand-amber" />
                    </button>
                  ))}
                </div>
              )}

              {searching && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 px-4 py-3">
                  <p className="text-sm text-gray-400">Recherche en cours...</p>
                </div>
              )}
            </div>

            {/* Bouton inviter externe */}
            {!showExternalForm ? (
              <button
                type="button"
                onClick={() => setShowExternalForm(true)}
                className="flex items-center gap-2 text-sm text-brand-amber hover:text-brand-amber/80"
              >
                <Mail className="h-4 w-4" />
                Inviter un closer externe par email
              </button>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={externalName}
                    onChange={(e) => setExternalName(e.target.value)}
                    placeholder="Nom du closer"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                  <input
                    type="email"
                    value={externalEmail}
                    onChange={(e) => setExternalEmail(e.target.value)}
                    placeholder="Email du closer"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addExternalCloser}
                    className="px-3 py-1.5 bg-brand-amber text-white rounded-lg text-sm font-medium"
                  >
                    Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExternalForm(false)}
                    className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {/* Liste closers à assigner */}
            {closersToAssign.length > 0 && (
              <div className="space-y-2">
                {closersToAssign.map((closer, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-brand-amber/10 flex items-center justify-center text-brand-amber font-bold text-sm">
                      {closer.closer_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-dark truncate">{closer.closer_name}</p>
                      <p className="text-xs text-gray-400 truncate">{closer.closer_email}</p>
                    </div>
                    {closer.is_external && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                        Invitation
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeCloser(idx)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <a
            href="/dashboard/crm"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Annuler
          </a>
          <button
            type="submit"
            disabled={saving || !title.trim() || !startDate}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-amber text-white rounded-lg hover:bg-brand-amber/90 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Création...' : 'Créer l\'événement'}
          </button>
        </div>
      </form>
    </div>
  );
}
