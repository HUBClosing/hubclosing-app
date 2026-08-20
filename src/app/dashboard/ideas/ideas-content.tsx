'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Badge, Avatar } from '@/components/ui';
import {
  Lightbulb, Send, Loader2, MessageSquare, Bug, Sparkles, Plus, X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Idea {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  admin_response: string | null;
  votes: number;
  created_at: string;
  users: { full_name: string | null; avatar_url: string | null } | null;
}

const CATEGORIES = [
  { value: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'text-amber-500' },
  { value: 'bug', label: 'Bug', icon: Bug, color: 'text-red-500' },
  { value: 'feature', label: 'Nouvelle fonctionnalité', icon: Sparkles, color: 'text-blue-500' },
  { value: 'feedback', label: 'Retour général', icon: MessageSquare, color: 'text-green-500' },
];

const STATUS_MAP: Record<string, { label: string; variant: 'info' | 'warning' | 'success' | 'error' }> = {
  new: { label: 'Nouvelle', variant: 'info' },
  reviewed: { label: 'Examinée', variant: 'warning' },
  planned: { label: 'Planifiée', variant: 'success' },
  done: { label: 'Réalisée', variant: 'success' },
  declined: { label: 'Déclinée', variant: 'error' },
};

export function IdeasContent({ ideas: initialIdeas, currentUserId }: { ideas: Idea[]; currentUserId: string }) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('suggestion');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), category }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur');
      } else {
        setTitle('');
        setDescription('');
        setCategory('suggestion');
        setShowForm(false);
        router.refresh();
        // Optimistic update
        setIdeas(prev => [{
          ...data.idea,
          users: { full_name: 'Vous', avatar_url: null },
        }, ...prev]);
      }
    } catch {
      setError('Erreur réseau');
    }
    setLoading(false);
  };

  const filtered = filterCat === 'all' ? ideas : ideas.filter(i => i.category === filterCat);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-7 w-7 text-brand-amber" />
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">Bo&icirc;te &agrave; id&eacute;es</h1>
            <p className="text-sm text-gray-500">Partagez vos suggestions pour am&eacute;liorer HUBClosing</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-green text-white rounded-xl text-sm font-medium hover:bg-brand-green/90 transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Annuler' : 'Proposer une idée'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cat&eacute;gorie</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          category === cat.value
                            ? 'bg-brand-green text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="R&eacute;sumez votre id&eacute;e en une phrase..."
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="D&eacute;crivez votre id&eacute;e en d&eacute;tail : quel probl&egrave;me &ccedil;a r&eacute;sout, comment &ccedil;a fonctionnerait..."
                  rows={4}
                  maxLength={2000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green resize-none"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">{description.length}/2000</p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !title.trim() || !description.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-brand-green/90 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Envoyer
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterCat === 'all' ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Toutes ({ideas.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = ideas.filter(i => i.category === cat.value).length;
          return (
            <button
              key={cat.value}
              onClick={() => setFilterCat(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterCat === cat.value ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Liste des idées */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucune id&eacute;e pour le moment</p>
            <p className="text-sm text-gray-400 mt-1">Soyez le premier &agrave; proposer une id&eacute;e !</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((idea) => {
            const catInfo = CATEGORIES.find(c => c.value === idea.category) || CATEGORIES[0];
            const CatIcon = catInfo.icon;
            const statusInfo = STATUS_MAP[idea.status] || STATUS_MAP.new;
            const isOwn = idea.user_id === currentUserId;

            return (
              <Card key={idea.id} className={isOwn ? 'ring-1 ring-brand-green/20' : ''}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gray-50 ${catInfo.color}`}>
                      <CatIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-brand-dark">{idea.title}</h3>
                        <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{idea.description}</p>

                      {idea.admin_response && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs font-medium text-blue-700 mb-1">R&eacute;ponse de l&apos;&eacute;quipe :</p>
                          <p className="text-sm text-blue-800">{idea.admin_response}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Avatar
                            src={idea.users?.avatar_url || undefined}
                            fallback={idea.users?.full_name || 'U'}
                            size="xs"
                          />
                          <span>{isOwn ? 'Vous' : (idea.users?.full_name || 'Utilisateur')}</span>
                        </div>
                        <span>{formatDistanceToNow(new Date(idea.created_at), { addSuffix: true, locale: fr })}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
