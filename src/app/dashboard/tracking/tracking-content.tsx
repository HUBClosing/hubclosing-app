'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Badge } from '@/components/ui';
import type { User, CallStat, CoachingBooking, CallEventType } from '@/types/database';
import { getMedalForCashPerCall, MEDAL_CONFIG } from '@/types/database';
import {
  Phone, TrendingUp, DollarSign, Award, Plus, Trash2, Loader2,
  BarChart3, Target, Calendar, X, AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TrackingContentProps {
  user: User;
  initialStats: CallStat[];
  coachingBookings: CoachingBooking[];
}

const EVENT_TYPES: { value: CallEventType; label: string; icon: string }[] = [
  { value: 'challenge', label: 'Challenge', icon: '🏆' },
  { value: 'webinaire', label: 'Webinaire', icon: '🎥' },
  { value: 've', label: 'Virtual Event', icon: '💻' },
];

export function TrackingContent({ user, initialStats, coachingBookings }: TrackingContentProps) {
  const [stats, setStats] = useState<CallStat[]>(initialStats);
  const [showForm, setShowForm] = useState(false);
  const [showCoachingPopup, setShowCoachingPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Form state
  const [form, setForm] = useState({
    event_type: 'challenge' as CallEventType,
    event_name: '',
    event_date: new Date().toISOString().split('T')[0],
    total_calls: '',
    ns_count: '',
    cancelled_count: '',
    total_revenue: '',
    notes: '',
  });

  // Métriques agrégées
  const aggregated = useMemo(() => {
    const totalCalls = stats.reduce((sum, s) => sum + s.total_calls, 0);
    const totalEffective = stats.reduce((sum, s) => sum + (s.effective_calls || (s.total_calls - s.ns_count - s.cancelled_count)), 0);
    const totalRevenue = stats.reduce((sum, s) => sum + Number(s.total_revenue), 0);
    const avgCashPerCall = totalEffective > 0 ? totalRevenue / totalEffective : 0;
    const bestCashPerCall = stats.length > 0
      ? Math.max(...stats.map(s => Number(s.cash_per_call) || (
        (s.total_calls - s.ns_count - s.cancelled_count) > 0
          ? Number(s.total_revenue) / (s.total_calls - s.ns_count - s.cancelled_count)
          : 0
      )))
      : 0;

    return {
      total_events: stats.length,
      total_calls: totalCalls,
      total_effective_calls: totalEffective,
      total_revenue: totalRevenue,
      average_cash_per_call: Math.round(avgCashPerCall * 100) / 100,
      best_cash_per_call: Math.round(bestCashPerCall * 100) / 100,
      medal: getMedalForCashPerCall(avgCashPerCall),
    };
  }, [stats]);

  const medalConfig = MEDAL_CONFIG[aggregated.medal];
  const needsCoaching = aggregated.total_events > 0 && aggregated.average_cash_per_call < 1000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/call-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: form.event_type,
          event_name: form.event_name,
          event_date: form.event_date,
          total_calls: parseInt(form.total_calls) || 0,
          ns_count: parseInt(form.ns_count) || 0,
          cancelled_count: parseInt(form.cancelled_count) || 0,
          total_revenue: parseFloat(form.total_revenue) || 0,
          notes: form.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStats(prev => [data.stat, ...prev]);
      setForm({ event_type: 'challenge', event_name: '', event_date: new Date().toISOString().split('T')[0], total_calls: '', ns_count: '', cancelled_count: '', total_revenue: '', notes: '' });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    try {
      const res = await fetch(`/api/call-stats?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStats(prev => prev.filter(s => s.id !== id));
      }
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tracking Calls</h1>
          <p className="text-gray-500 text-sm mt-1">Suis tes performances et décroche ta médaille</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-green/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Ajouter un event
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <Phone className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{aggregated.total_calls}</p>
          <p className="text-xs text-gray-500">Calls totaux</p>
        </Card>
        <Card className="p-4 text-center">
          <Target className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{aggregated.total_effective_calls}</p>
          <p className="text-xs text-gray-500">Calls effectifs</p>
        </Card>
        <Card className="p-4 text-center">
          <DollarSign className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{aggregated.total_revenue.toLocaleString('fr-FR')}€</p>
          <p className="text-xs text-gray-500">CA total</p>
        </Card>
        <Card className="p-4 text-center">
          <TrendingUp className="w-5 h-5 text-purple-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{aggregated.average_cash_per_call.toLocaleString('fr-FR')}€</p>
          <p className="text-xs text-gray-500">Cash / call moyen</p>
        </Card>
        <Card className={`p-4 text-center ${medalConfig.bgColor}`}>
          <span className="text-3xl block mb-1">{medalConfig.icon}</span>
          <p className={`text-lg font-bold ${medalConfig.color}`}>{medalConfig.label}</p>
          <p className="text-xs text-gray-600">{medalConfig.description}</p>
        </Card>
      </div>

      {/* Coaching Popup Trigger */}
      {needsCoaching && (
        <Card className="p-4 border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Ton cash/call est sous 1 000€</p>
                <p className="text-sm text-amber-600">Un coaching individuel peut t&apos;aider à passer au niveau supérieur</p>
              </div>
            </div>
            <button
              onClick={() => setShowCoachingPopup(true)}
              className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors whitespace-nowrap"
            >
              Réserver un coaching
            </button>
          </div>
        </Card>
      )}

      {/* Stats Table */}
      <Card>
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            Historique ({stats.length} events)
          </h2>
        </div>

        {stats.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Phone className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Aucune donnée de calls</p>
            <p className="text-sm mt-1">Ajoute ton premier event pour commencer à tracker</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Calls</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">NS</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Annulés</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Effectifs</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">CA</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">€/call</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.map((stat) => {
                  const effective = stat.effective_calls ?? (stat.total_calls - stat.ns_count - stat.cancelled_count);
                  const cpc = stat.cash_per_call ?? (effective > 0 ? Number(stat.total_revenue) / effective : 0);
                  const cpcMedal = getMedalForCashPerCall(cpc);

                  return (
                    <tr key={stat.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{stat.event_name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="info" className="text-xs">
                          {EVENT_TYPES.find(t => t.value === stat.event_type)?.icon} {stat.event_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(stat.event_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-right">{stat.total_calls}</td>
                      <td className="px-4 py-3 text-right text-red-500">{stat.ns_count}</td>
                      <td className="px-4 py-3 text-right text-red-500">{stat.cancelled_count}</td>
                      <td className="px-4 py-3 text-right font-medium">{effective}</td>
                      <td className="px-4 py-3 text-right font-medium">{Number(stat.total_revenue).toLocaleString('fr-FR')}€</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${MEDAL_CONFIG[cpcMedal].color}`}>
                          {Math.round(cpc).toLocaleString('fr-FR')}€
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(stat.id)}
                          disabled={deleteLoading === stat.id}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          {deleteLoading === stat.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Ajout Event */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Ajouter un event</h2>
                <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type d'event */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type d&apos;event</label>
                  <div className="grid grid-cols-3 gap-2">
                    {EVENT_TYPES.map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, event_type: t.value }))}
                        className={`p-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                          form.event_type === t.value
                            ? 'border-brand-green bg-brand-green/5 text-brand-green'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl block mb-1">{t.icon}</span>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nom + Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;event</label>
                    <input
                      value={form.event_name}
                      onChange={e => setForm(f => ({ ...f, event_name: e.target.value }))}
                      placeholder="ex: Lancement Produit X"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={form.event_date}
                      onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calls pris (total)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.total_calls}
                      onChange={e => setForm(f => ({ ...f, total_calls: e.target.value }))}
                      placeholder="0"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CA généré (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.total_revenue}
                      onChange={e => setForm(f => ({ ...f, total_revenue: e.target.value }))}
                      placeholder="0"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NS (No Show)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.ns_count}
                      onChange={e => setForm(f => ({ ...f, ns_count: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Annulés</label>
                    <input
                      type="number"
                      min="0"
                      value={form.cancelled_count}
                      onChange={e => setForm(f => ({ ...f, cancelled_count: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                    />
                  </div>
                </div>

                {/* Preview métriques */}
                {form.total_calls && form.total_revenue && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Aperçu :</p>
                    {(() => {
                      const eff = (parseInt(form.total_calls) || 0) - (parseInt(form.ns_count) || 0) - (parseInt(form.cancelled_count) || 0);
                      const cpc = eff > 0 ? (parseFloat(form.total_revenue) || 0) / eff : 0;
                      const m = getMedalForCashPerCall(cpc);
                      return (
                        <p className="text-sm font-medium">
                          {eff} calls effectifs → <span className={MEDAL_CONFIG[m].color}>{Math.round(cpc).toLocaleString('fr-FR')}€/call {MEDAL_CONFIG[m].icon}</span>
                        </p>
                      );
                    })()}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    placeholder="Contexte, observations..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-green text-white py-2.5 rounded-xl font-medium hover:bg-brand-green/90 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Enregistrer
                </button>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Coaching Popup */}
      {showCoachingPopup && (
        <CoachingPopup
          cashPerCall={aggregated.average_cash_per_call}
          onClose={() => setShowCoachingPopup(false)}
          onSuccess={() => { setShowCoachingPopup(false); router.refresh(); }}
        />
      )}
    </div>
  );
}

// ─── Coaching Popup ──────────────────────────────────────────

function CoachingPopup({ cashPerCall, onClose, onSuccess }: {
  cashPerCall: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    main_challenge: '',
    experience_months: '',
    niche: '',
    goals: '',
    availability: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_cash_per_call: cashPerCall,
          main_challenge: form.main_challenge,
          experience_months: parseInt(form.experience_months) || null,
          niche: form.niche,
          goals: form.goals,
          availability: form.availability,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(true);
      setTimeout(onSuccess, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <span className="text-5xl block mb-4">🎯</span>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Demande envoyée !</h2>
          <p className="text-gray-500">Tu vas être recontacté(e) rapidement pour planifier ton coaching.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Coaching individuel
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 mb-4">
            <p className="text-sm text-amber-800">
              Ton cash/call moyen est à <strong>{Math.round(cashPerCall)}€</strong>.
              L&apos;objectif est d&apos;atteindre <strong>1 000€+/call</strong> pour décrocher la médaille Gold 🥇
            </p>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Remplis cette fiche pour préparer ton coaching. Un rendez-vous personnalisé sera planifié.
          </p>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quel est ton plus gros challenge en closing ?*</label>
              <textarea
                value={form.main_challenge}
                onChange={e => setForm(f => ({ ...f, main_challenge: e.target.value }))}
                required
                rows={3}
                placeholder="ex: J'ai du mal à gérer les objections prix, je perds beaucoup de prospects en fin de call..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expérience (mois)</label>
                <input
                  type="number"
                  min="0"
                  value={form.experience_months}
                  onChange={e => setForm(f => ({ ...f, experience_months: e.target.value }))}
                  placeholder="ex: 6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ta niche actuelle</label>
                <input
                  value={form.niche}
                  onChange={e => setForm(f => ({ ...f, niche: e.target.value }))}
                  placeholder="ex: coaching business"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qu&apos;est-ce que tu veux améliorer ?</label>
              <textarea
                value={form.goals}
                onChange={e => setForm(f => ({ ...f, goals: e.target.value }))}
                rows={2}
                placeholder="ex: Augmenter mon taux de closing, mieux qualifier mes prospects..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tes disponibilités cette semaine</label>
              <input
                value={form.availability}
                onChange={e => setForm(f => ({ ...f, availability: e.target.value }))}
                placeholder="ex: Lundi et mercredi après-midi"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white py-2.5 rounded-xl font-medium hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              Envoyer ma demande de coaching
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
