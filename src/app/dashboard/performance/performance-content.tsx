'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User, PerformanceRecord } from '@/types/database';
import { EVENT_TYPE_OPTIONS } from '@/types/database';
import { Card, CardContent, CardHeader } from '@/components/ui';
import {
  Plus, TrendingUp, Phone, DollarSign, ShieldCheck,
  Loader2, Trash2, Send, X, CheckCircle2, Clock,
  BarChart3, AlertTriangle, Calendar, Eye,
} from 'lucide-react';

interface PerformanceContentProps {
  user: User;
}

export function PerformanceContent({ user }: PerformanceContentProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [performances, setPerformances] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Formulaire
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('Webinaire');
  const [eventDate, setEventDate] = useState('');
  const [callsScheduled, setCallsScheduled] = useState('');
  const [callsCompleted, setCallsCompleted] = useState('');
  const [revenueCollected, setRevenueCollected] = useState('');
  const [revenueInvoiced, setRevenueInvoiced] = useState('');
  const [noShows, setNoShows] = useState('');
  const [cancellations, setCancellations] = useState('');
  const [hosName, setHosName] = useState('');
  const [hosEmail, setHosEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Modal envoi validation
  const [sendModalId, setSendModalId] = useState<string | null>(null);
  const [sendEmail, setSendEmail] = useState('');
  const [sending, setSending] = useState(false);

  // Détail performance
  const [detailId, setDetailId] = useState<string | null>(null);

  const fetchPerformances = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/performances');
    const data = await res.json();
    if (data.performances) setPerformances(data.performances);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPerformances();
  }, [fetchPerformances]);

  const resetForm = () => {
    setEventName(''); setEventType('Webinaire'); setEventDate('');
    setCallsScheduled(''); setCallsCompleted('');
    setRevenueCollected(''); setRevenueInvoiced('');
    setNoShows(''); setCancellations('');
    setHosName(''); setHosEmail(''); setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const res = await fetch('/api/performances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        event_type: eventType,
        event_date: eventDate,
        calls_scheduled: callsScheduled,
        calls_completed: callsCompleted,
        revenue_collected: revenueCollected,
        revenue_invoiced: revenueInvoiced,
        no_shows: noShows,
        cancellations: cancellations,
        hos_name: hosName,
        hos_email: hosEmail,
        notes,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || 'Erreur lors de la création');
      return;
    }

    setSuccess('Performance ajoutée !');
    setTimeout(() => setSuccess(''), 3000);
    resetForm();
    setShowForm(false);
    fetchPerformances();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette performance ?')) return;

    const res = await fetch(`/api/performances/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchPerformances();
    }
  };

  const handleSendValidation = async () => {
    if (!sendModalId || !sendEmail.trim()) return;
    setSending(true);

    const res = await fetch(`/api/performances/${sendModalId}/send-validation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hos_email: sendEmail }),
    });

    const data = await res.json();
    setSending(false);

    if (res.ok) {
      setSuccess('Email de validation envoyé au HOS !');
      setTimeout(() => setSuccess(''), 4000);
      setSendModalId(null);
      setSendEmail('');
      fetchPerformances();
    } else {
      setError(data.error || 'Erreur envoi');
      setTimeout(() => setError(''), 4000);
    }
  };

  // Stats calculées
  const totalRevenue = performances.reduce((sum, p) => sum + Number(p.revenue_collected), 0);
  const totalCalls = performances.reduce((sum, p) => sum + p.calls_completed, 0);
  const totalNoShows = performances.reduce((sum, p) => sum + p.no_shows, 0);
  const totalScheduled = performances.reduce((sum, p) => sum + p.calls_scheduled, 0);
  const noShowRate = totalScheduled > 0 ? ((totalNoShows / totalScheduled) * 100).toFixed(1) : '0';
  const verifiedCount = performances.filter((p) => p.is_verified).length;
  const verifiedPct = performances.length > 0 ? Math.round((verifiedCount / performances.length) * 100) : 0;

  const detailPerf = detailId ? performances.find((p) => p.id === detailId) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-dark">Tracking Performance</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-amber text-white rounded-lg text-sm font-medium hover:bg-brand-amber/90 transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Annuler' : 'Nouvelle performance'}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-600 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> {success}
        </div>
      )}

      {/* ═══════ STATS ═══════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-brand-dark">{totalRevenue.toLocaleString('fr-FR')} €</p>
            <p className="text-xs text-gray-500">CA encaissé total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Phone className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-brand-dark">{totalCalls}</p>
            <p className="text-xs text-gray-500">Calls réalisés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-brand-dark">{noShowRate}%</p>
            <p className="text-xs text-gray-500">Taux no-show</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ShieldCheck className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-brand-dark">{verifiedPct}%</p>
            <p className="text-xs text-gray-500">Vérifié ({verifiedCount}/{performances.length})</p>
          </CardContent>
        </Card>
      </div>

      {/* ═══════ FORMULAIRE ═══════ */}
      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-brand-dark flex items-center gap-2">
              <Plus className="h-4 w-4" /> Ajouter une performance
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Nom de l&apos;événement *</label>
                  <input
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    required
                    placeholder="Ex: Lancement programme X"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Type d&apos;événement *</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber"
                  >
                    {EVENT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Date *</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Calls agenda</label>
                  <input type="number" min={0} value={callsScheduled} onChange={(e) => setCallsScheduled(e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Calls pris</label>
                  <input type="number" min={0} value={callsCompleted} onChange={(e) => setCallsCompleted(e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">CA encaissé (€)</label>
                  <input type="number" min={0} step="0.01" value={revenueCollected} onChange={(e) => setRevenueCollected(e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">CA facturé (€)</label>
                  <input type="number" min={0} step="0.01" value={revenueInvoiced} onChange={(e) => setRevenueInvoiced(e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">No-shows</label>
                  <input type="number" min={0} value={noShows} onChange={(e) => setNoShows(e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Annulations</label>
                  <input type="number" min={0} value={cancellations} onChange={(e) => setCancellations(e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Nom du HOS *</label>
                  <input value={hosName} onChange={(e) => setHosName(e.target.value)} required placeholder="Nom du HOS" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Email du HOS</label>
                  <input type="email" value={hosEmail} onChange={(e) => setHosEmail(e.target.value)} placeholder="hos@email.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Notes (optionnel)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Commentaires..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber resize-none" />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-amber text-white rounded-lg text-sm font-medium hover:bg-brand-amber/90 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Ajouter la performance
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ═══════ TABLEAU DES PERFORMANCES ═══════ */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-brand-dark flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Historique des performances
          </h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : performances.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Aucune performance enregistrée</p>
              <p className="text-sm mt-1">Cliquez sur &quot;Nouvelle performance&quot; pour commencer</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="px-3 py-3 font-medium text-gray-500">Statut</th>
                    <th className="px-3 py-3 font-medium text-gray-500">Événement</th>
                    <th className="px-3 py-3 font-medium text-gray-500">Type</th>
                    <th className="px-3 py-3 font-medium text-gray-500">Date</th>
                    <th className="px-3 py-3 font-medium text-gray-500 text-right">Calls agenda</th>
                    <th className="px-3 py-3 font-medium text-gray-500 text-right">Calls pris</th>
                    <th className="px-3 py-3 font-medium text-gray-500 text-right">CA encaissé</th>
                    <th className="px-3 py-3 font-medium text-gray-500 text-right">CA facturé</th>
                    <th className="px-3 py-3 font-medium text-gray-500 text-right">No-shows</th>
                    <th className="px-3 py-3 font-medium text-gray-500 text-right">Annul.</th>
                    <th className="px-3 py-3 font-medium text-gray-500">HOS</th>
                    <th className="px-3 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {performances.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-3">
                        {p.is_verified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                            <ShieldCheck className="h-3 w-3" /> Vérifié
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                            <Clock className="h-3 w-3" /> En attente
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-medium text-brand-dark">{p.event_name}</td>
                      <td className="px-3 py-3 text-gray-600">{p.event_type}</td>
                      <td className="px-3 py-3 text-gray-600">{new Date(p.event_date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-3 py-3 text-right">{p.calls_scheduled}</td>
                      <td className="px-3 py-3 text-right">{p.calls_completed}</td>
                      <td className="px-3 py-3 text-right font-medium text-green-600">{Number(p.revenue_collected).toLocaleString('fr-FR')} €</td>
                      <td className="px-3 py-3 text-right text-gray-600">{Number(p.revenue_invoiced).toLocaleString('fr-FR')} €</td>
                      <td className="px-3 py-3 text-right">{p.no_shows}</td>
                      <td className="px-3 py-3 text-right">{p.cancellations}</td>
                      <td className="px-3 py-3 text-gray-600">{p.hos_name}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          {/* Voir détail */}
                          <button
                            onClick={() => setDetailId(detailId === p.id ? null : p.id)}
                            className="p-1.5 text-gray-400 hover:text-brand-amber hover:bg-brand-amber/10 rounded transition-colors"
                            title="Voir détail"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {/* Envoyer validation */}
                          {!p.is_verified && (
                            <button
                              onClick={() => { setSendModalId(p.id); setSendEmail(p.hos_email || ''); }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Envoyer pour validation"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}
                          {/* Supprimer */}
                          {!p.is_verified && (
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════ DÉTAIL PERFORMANCE ═══════ */}
      {detailPerf && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-brand-dark flex items-center gap-2">
                <Eye className="h-4 w-4" /> Détail — {detailPerf.event_name}
              </h2>
              <button onClick={() => setDetailId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div><p className="text-xs text-gray-500">Type</p><p className="font-medium">{detailPerf.event_type}</p></div>
              <div><p className="text-xs text-gray-500">Date</p><p className="font-medium">{new Date(detailPerf.event_date).toLocaleDateString('fr-FR')}</p></div>
              <div><p className="text-xs text-gray-500">HOS</p><p className="font-medium">{detailPerf.hos_name}</p></div>
              <div><p className="text-xs text-gray-500">Calls agenda</p><p className="font-medium">{detailPerf.calls_scheduled}</p></div>
              <div><p className="text-xs text-gray-500">Calls pris</p><p className="font-medium">{detailPerf.calls_completed}</p></div>
              <div><p className="text-xs text-gray-500">Taux de show</p><p className="font-medium">{detailPerf.calls_scheduled > 0 ? Math.round((detailPerf.calls_completed / detailPerf.calls_scheduled) * 100) : 0}%</p></div>
              <div><p className="text-xs text-gray-500">CA encaissé</p><p className="font-medium text-green-600">{Number(detailPerf.revenue_collected).toLocaleString('fr-FR')} €</p></div>
              <div><p className="text-xs text-gray-500">CA facturé</p><p className="font-medium">{Number(detailPerf.revenue_invoiced).toLocaleString('fr-FR')} €</p></div>
              <div><p className="text-xs text-gray-500">No-shows / Annulations</p><p className="font-medium">{detailPerf.no_shows} / {detailPerf.cancellations}</p></div>
            </div>
            {detailPerf.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{detailPerf.notes}</p>
              </div>
            )}
            {detailPerf.is_verified && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-700">Performance vérifiée</p>
                  <p className="text-xs text-emerald-600">
                    Validé {detailPerf.verified_by === 'account' ? 'via compte' : 'via lien'} par {detailPerf.verifier_name || detailPerf.hos_name}
                    {detailPerf.verified_at && ` le ${new Date(detailPerf.verified_at).toLocaleDateString('fr-FR')}`}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════ MODAL ENVOI VALIDATION ═══════ */}
      {sendModalId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-brand-dark flex items-center gap-2">
                <Send className="h-4 w-4" /> Envoyer pour validation
              </h3>
              <button onClick={() => setSendModalId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Le HOS recevra un email avec vos données de performance et un bouton pour les valider.
            </p>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1">Email du HOS</label>
              <input
                type="email"
                value={sendEmail}
                onChange={(e) => setSendEmail(e.target.value)}
                placeholder="hos@email.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSendModalId(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSendValidation}
                disabled={sending || !sendEmail.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-amber text-white rounded-lg text-sm font-medium hover:bg-brand-amber/90 transition-colors disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
