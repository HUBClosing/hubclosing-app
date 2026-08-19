'use client';

import { useState, useEffect } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Copy, Check, Plus, Trash2, Send, ToggleLeft, ToggleRight, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import type { WebhookEndpoint, WebhookEventType } from '@/types/database';
import { WEBHOOK_EVENT_LABELS, ALL_WEBHOOK_EVENTS } from '@/types/database';

interface SyncLog {
  id: string;
  source_crm: string;
  event_type: string | null;
  processed: boolean;
  result: string;
  created_at: string;
}

export default function WebhooksSettingsPage() {
  // Incoming
  const [incomingUrl, setIncomingUrl] = useState('');
  const [loadingToken, setLoadingToken] = useState(true);
  const [copiedIncoming, setCopiedIncoming] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [showSyncLogs, setShowSyncLogs] = useState(false);

  // Outgoing
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEventType[]>([...ALL_WEBHOOK_EVENTS]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active CRM tab for guide
  const [activeGuide, setActiveGuide] = useState<'ghl' | 'hubspot' | 'airtable'>('ghl');

  useEffect(() => {
    fetchIncomingToken();
    fetchEndpoints();
  }, []);

  async function fetchIncomingToken() {
    try {
      const res = await fetch('/api/webhooks/token');
      if (res.ok) {
        const data = await res.json();
        setIncomingUrl(data.url);
      }
    } catch {
      console.error('Erreur token');
    } finally {
      setLoadingToken(false);
    }
  }

  async function fetchEndpoints() {
    try {
      const res = await fetch('/api/webhooks');
      if (res.ok) setEndpoints(await res.json());
    } catch {
      console.error('Erreur webhooks');
    }
  }

  async function fetchSyncLogs() {
    try {
      const res = await fetch('/api/crm/sync/logs?limit=20');
      if (res.ok) setSyncLogs(await res.json());
    } catch {
      console.error('Erreur logs');
    }
  }

  function copyToClipboard(text: string, type: 'incoming' | 'other') {
    navigator.clipboard.writeText(text);
    if (type === 'incoming') {
      setCopiedIncoming(true);
      setTimeout(() => setCopiedIncoming(false), 2000);
    }
    setMessage({ type: 'success', text: 'Copié !' });
    setTimeout(() => setMessage(null), 2000);
  }

  async function handleAddOutgoing() {
    if (!newUrl.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl.trim(), description: newDescription.trim() || null, events: selectedEvents }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Connexion ajoutée' });
        setNewUrl('');
        setNewDescription('');
        setSelectedEvents([...ALL_WEBHOOK_EVENTS]);
        setShowAddForm(false);
        fetchEndpoints();
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette connexion ?')) return;
    const res = await fetch(`/api/webhooks?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setEndpoints((prev) => prev.filter((e) => e.id !== id));
      setMessage({ type: 'success', text: 'Connexion supprimée' });
    }
  }

  async function handleToggle(id: string, active: boolean) {
    const res = await fetch('/api/webhooks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    });
    if (res.ok) {
      setEndpoints((prev) => prev.map((e) => (e.id === id ? { ...e, active: !active } : e)));
    }
  }

  async function handleTest(id: string) {
    setTesting(id);
    const res = await fetch('/api/webhooks/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhook_id: id }),
    });
    if (res.ok) {
      setMessage({ type: 'success', text: 'Test envoyé !' });
      setTimeout(fetchEndpoints, 2000);
    }
    setTesting(null);
  }

  function toggleEvent(event: WebhookEventType) {
    setSelectedEvents((prev) => prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Connexion CRM</h1>
        <p className="text-gray-500 mt-1">Synchronisez automatiquement HUBClosing avec votre CRM</p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* ========================================= */}
      {/* SECTION 1 : VOTRE CRM → HUBCLOSING */}
      {/* ========================================= */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ArrowDownToLine className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-brand-dark">Votre CRM → HUBClosing</h2>
              <p className="text-sm text-gray-500">Quand votre CRM a des modifications, elles remontent ici automatiquement</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Copiez cette URL et collez-la dans votre CRM (section Webhooks / Automations)
              </label>
              {loadingToken ? (
                <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={incomingUrl}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono text-gray-700 select-all"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={() => copyToClipboard(incomingUrl, 'incoming')}
                    className="flex items-center gap-2 bg-brand-amber text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition whitespace-nowrap"
                  >
                    {copiedIncoming ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedIncoming ? 'Copié' : 'Copier'}
                  </button>
                </div>
              )}
            </div>

            {/* Guide par CRM */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Comment faire selon votre CRM :</p>
              <div className="flex gap-2 mb-4">
                {[
                  { id: 'ghl' as const, label: 'GoHighLevel' },
                  { id: 'hubspot' as const, label: 'HubSpot' },
                  { id: 'airtable' as const, label: 'Airtable' },
                ].map((crm) => (
                  <button
                    key={crm.id}
                    onClick={() => setActiveGuide(crm.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      activeGuide === crm.id
                        ? 'bg-brand-amber text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-amber'
                    }`}
                  >
                    {crm.label}
                  </button>
                ))}
              </div>

              {activeGuide === 'ghl' && (
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Dans GoHighLevel, allez dans <strong>Settings → Webhooks</strong></li>
                  <li>Cliquez <strong>&quot;Add New Webhook&quot;</strong></li>
                  <li>Collez l&apos;URL HUBClosing ci-dessus</li>
                  <li>Sélectionnez les événements : <strong>Opportunity Status Changed</strong>, <strong>Contact Created</strong></li>
                  <li>Cliquez <strong>Save</strong> — c&apos;est tout !</li>
                </ol>
              )}
              {activeGuide === 'hubspot' && (
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Dans HubSpot, allez dans <strong>Settings → Integrations → Private Apps</strong></li>
                  <li>Créez une Private App ou allez dans <strong>Webhooks</strong></li>
                  <li>Ajoutez une souscription webhook avec l&apos;URL HUBClosing</li>
                  <li>Choisissez les événements : <strong>deal.propertyChange</strong> (montant, étape)</li>
                  <li>Activez — les deals se synchronisent automatiquement</li>
                </ol>
              )}
              {activeGuide === 'airtable' && (
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Dans Airtable, ouvrez votre base → <strong>Automations</strong></li>
                  <li>Créez une automation : trigger = <strong>&quot;When record is created/updated&quot;</strong></li>
                  <li>Action = <strong>&quot;Send webhook&quot;</strong></li>
                  <li>Collez l&apos;URL HUBClosing et mappez les champs (nom, email, montant)</li>
                  <li>Activez l&apos;automation</li>
                </ol>
              )}
            </div>

            {/* Logs entrants */}
            <button
              onClick={() => { setShowSyncLogs(!showSyncLogs); if (!showSyncLogs) fetchSyncLogs(); }}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className="w-4 h-4" />
              {showSyncLogs ? 'Masquer' : 'Voir'} les données reçues
            </button>

            {showSyncLogs && (
              <div className="border border-gray-100 rounded-lg divide-y divide-gray-100 max-h-60 overflow-y-auto">
                {syncLogs.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">Aucune donnée reçue pour le moment</p>
                ) : (
                  syncLogs.map((log) => (
                    <div key={log.id} className="px-3 py-2 flex items-center gap-2">
                      {log.processed ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      )}
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{log.source_crm}</span>
                      <span className="text-sm text-gray-600 flex-1 truncate">{log.result}</span>
                      <span className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SECTION 2 : HUBCLOSING → VOTRE CRM */}
      {/* ========================================= */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ArrowUpFromLine className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-dark">HUBClosing → Votre CRM</h2>
                <p className="text-sm text-gray-500">Les actions sur HUBClosing sont envoyées automatiquement vers votre CRM</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 bg-brand-amber text-white px-3 py-2 rounded-lg hover:opacity-90 text-sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </div>
        <div className="p-5">
          {/* Add form */}
          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL webhook de votre CRM *</label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="Collez l'URL webhook de votre CRM ici..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-amber focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Trouvez cette URL dans les paramètres Webhooks de votre CRM
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom (optionnel)</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ex: Mon GoHighLevel"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-amber focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quelles données envoyer ?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {ALL_WEBHOOK_EVENTS.map((event) => (
                    <label key={event} className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="rounded border-gray-300 text-brand-amber focus:ring-brand-amber"
                      />
                      <span className="text-sm">{WEBHOOK_EVENT_LABELS[event]}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-sm text-gray-600">Annuler</button>
                <button
                  onClick={handleAddOutgoing}
                  disabled={saving || !newUrl.trim() || selectedEvents.length === 0}
                  className="px-4 py-1.5 text-sm bg-brand-amber text-white rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : 'Connecter'}
                </button>
              </div>
            </div>
          )}

          {/* Endpoints list */}
          {endpoints.length === 0 && !showAddForm ? (
            <div className="text-center py-8 text-gray-400">
              <p className="mb-2">Aucune connexion sortante configurée</p>
              <p className="text-sm">Cliquez &quot;Ajouter&quot; pour envoyer vos données HUBClosing vers votre CRM</p>
            </div>
          ) : (
            <div className="space-y-2">
              {endpoints.map((ep) => (
                <div key={ep.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ep.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-dark truncate">{ep.description || 'CRM'}</p>
                      <p className="text-xs text-gray-400 font-mono truncate">{ep.url}</p>
                    </div>
                    {ep.last_status_code && (
                      <span className="flex items-center gap-1 text-xs">
                        {ep.last_status_code < 400 ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                      </span>
                    )}
                    {ep.failure_count >= 5 && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{ep.failure_count} erreurs</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleTest(ep.id)} disabled={testing === ep.id || !ep.active} className="p-1.5 text-gray-400 hover:text-blue-600 disabled:opacity-30" title="Tester">
                      <Send className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleToggle(ep.id, ep.active)} className="p-1.5 text-gray-400 hover:text-brand-amber">
                      {ep.active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => handleDelete(ep.id)} className="p-1.5 text-gray-400 hover:text-red-600" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Résumé */}
      <div className="bg-brand-light rounded-lg p-4 border border-gray-200">
        <h3 className="font-medium text-brand-dark mb-2">En résumé</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <ArrowDownToLine className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span><strong>CRM → HUBClosing :</strong> copiez l&apos;URL HUBClosing dans les webhooks de votre CRM. Les modifications (deals, revenue, appels) se synchronisent automatiquement.</span>
          </div>
          <div className="flex items-start gap-2">
            <ArrowUpFromLine className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>HUBClosing → CRM :</strong> collez l&apos;URL webhook de votre CRM ici. Les événements, assignations et performances sont envoyés automatiquement.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
