'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui';
import { Webhook, Plus, Trash2, Send, ToggleLeft, ToggleRight, Copy, ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { WebhookEndpoint, WebhookEventType, WebhookLog } from '@/types/database';
import { WEBHOOK_EVENT_LABELS, ALL_WEBHOOK_EVENTS } from '@/types/database';

export default function WebhooksSettingsPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  // Form state
  const [newUrl, setNewUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEventType[]>([...ALL_WEBHOOK_EVENTS]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchEndpoints();
  }, []);

  async function fetchEndpoints() {
    try {
      const res = await fetch('/api/webhooks');
      if (res.ok) {
        const data = await res.json();
        setEndpoints(data);
      }
    } catch {
      console.error('Erreur chargement webhooks');
    } finally {
      setLoading(false);
    }
  }

  async function fetchLogs() {
    try {
      const res = await fetch('/api/webhooks/logs?limit=50');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch {
      console.error('Erreur chargement logs');
    }
  }

  async function handleAdd() {
    if (!newUrl.trim()) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newUrl.trim(),
          description: newDescription.trim() || null,
          events: selectedEvents,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Webhook ajouté avec succès' });
        setNewUrl('');
        setNewDescription('');
        setSelectedEvents([...ALL_WEBHOOK_EVENTS]);
        setShowAddForm(false);
        fetchEndpoints();
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Erreur' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce webhook ?')) return;

    try {
      const res = await fetch(`/api/webhooks?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEndpoints((prev) => prev.filter((e) => e.id !== id));
        setMessage({ type: 'success', text: 'Webhook supprimé' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur suppression' });
    }
  }

  async function handleToggle(id: string, active: boolean) {
    try {
      const res = await fetch('/api/webhooks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !active }),
      });

      if (res.ok) {
        setEndpoints((prev) =>
          prev.map((e) => (e.id === id ? { ...e, active: !active, failure_count: !active ? e.failure_count : 0 } : e))
        );
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur mise à jour' });
    }
  }

  async function handleTest(id: string) {
    setTesting(id);
    setMessage(null);

    try {
      const res = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_id: id }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Webhook de test envoyé !' });
        // Refresh pour voir le statut mis à jour
        setTimeout(fetchEndpoints, 2000);
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Erreur envoi test' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau' });
    } finally {
      setTesting(null);
    }
  }

  function toggleEvent(event: WebhookEventType) {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  }

  function copySecret(secret: string) {
    navigator.clipboard.writeText(secret);
    setMessage({ type: 'success', text: 'Secret copié dans le presse-papier' });
    setTimeout(() => setMessage(null), 2000);
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <Webhook className="w-6 h-6 text-brand-amber" />
            Webhooks
          </h1>
          <p className="text-gray-500 mt-1">
            Connectez HUBClosing à votre CRM (HubSpot, Airtable, GoHighLevel...) via Zapier ou Make
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-brand-amber text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-brand-dark">Nouveau webhook</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL du webhook *
                </label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-amber focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">
                  URL Zapier, Make, ou tout endpoint HTTPS qui accepte des POST
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnel)
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ex: Sync vers HubSpot"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-amber focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Événements à envoyer
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_WEBHOOK_EVENTS.map((event) => (
                    <label
                      key={event}
                      className="flex items-center gap-2 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="rounded border-gray-300 text-brand-amber focus:ring-brand-amber"
                      />
                      <span className="text-sm">{WEBHOOK_EVENT_LABELS[event]}</span>
                      <span className="text-xs text-gray-400 ml-auto">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saving || !newUrl.trim() || selectedEvents.length === 0}
                  className="px-4 py-2 text-sm bg-brand-amber text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : 'Créer le webhook'}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Endpoints list */}
      {endpoints.length === 0 && !showAddForm ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Webhook className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Aucun webhook configuré</h3>
              <p className="text-gray-400 text-sm mb-4">
                Ajoutez un webhook pour synchroniser automatiquement vos données CRM avec HubSpot, Airtable, GoHighLevel, etc.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 bg-brand-amber text-white px-4 py-2 rounded-lg hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                Ajouter un webhook
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <Card key={ep.id}>
              <CardContent>
                <div className="flex items-start justify-between gap-4 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          ep.active ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      <span className="font-medium text-brand-dark truncate">
                        {ep.description || 'Webhook'}
                      </span>
                      {ep.failure_count >= 5 && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3" />
                          {ep.failure_count} échecs
                        </span>
                      )}
                      {!ep.active && ep.failure_count >= 10 && (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
                          Désactivé auto
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 font-mono truncate">{ep.url}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{ep.events.length} événement{ep.events.length > 1 ? 's' : ''}</span>
                      {ep.last_triggered_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Dernier envoi: {new Date(ep.last_triggered_at).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      {ep.last_status_code && (
                        <span className="flex items-center gap-1">
                          {ep.last_status_code < 400 ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                          HTTP {ep.last_status_code}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTest(ep.id)}
                      disabled={testing === ep.id || !ep.active}
                      className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                      title="Envoyer un test"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggle(ep.id, ep.active)}
                      className="p-2 text-gray-400 hover:text-brand-amber"
                      title={ep.active ? 'Désactiver' : 'Activer'}
                    >
                      {ep.active ? (
                        <ToggleRight className="w-5 h-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        setExpandedEndpoint(expandedEndpoint === ep.id ? null : ep.id)
                      }
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      {expandedEndpoint === ep.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(ep.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedEndpoint === ep.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Secret de signature</h4>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-gray-50 px-3 py-1.5 rounded text-xs font-mono text-gray-600 truncate">
                          {ep.secret}
                        </code>
                        <button
                          onClick={() => copySecret(ep.secret)}
                          className="p-1.5 text-gray-400 hover:text-brand-amber"
                          title="Copier"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Utilisez ce secret pour vérifier la signature HMAC-SHA256 (header X-HubClosing-Signature)
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Événements abonnés</h4>
                      <div className="flex flex-wrap gap-1">
                        {ep.events.map((event) => (
                          <span
                            key={event}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                          >
                            {WEBHOOK_EVENT_LABELS[event]}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Format du payload</h4>
                      <pre className="text-xs text-gray-600 overflow-x-auto">
{`{
  "event": "event.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": { ... },
  "metadata": {
    "recruiter_id": "uuid",
    "source": "hubclosing",
    "version": "1.0"
  }
}`}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Logs section */}
      {endpoints.length > 0 && (
        <div>
          <button
            onClick={() => {
              setShowLogs(!showLogs);
              if (!showLogs) fetchLogs();
            }}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <Clock className="w-4 h-4" />
            {showLogs ? 'Masquer' : 'Voir'} l&apos;historique des envois
            {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showLogs && (
            <Card className="mt-3">
              <CardContent>
                {logs.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">Aucun envoi pour le moment</p>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                    {logs.map((log) => (
                      <div key={log.id} className="py-2 flex items-center gap-3">
                        {log.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">
                            {WEBHOOK_EVENT_LABELS[log.event_type] || log.event_type}
                          </span>
                          {log.status_code && (
                            <span className={`ml-2 text-xs ${log.success ? 'text-green-600' : 'text-red-600'}`}>
                              HTTP {log.status_code}
                            </span>
                          )}
                          {log.error_message && (
                            <span className="ml-2 text-xs text-red-500">{log.error_message}</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(log.sent_at).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Guide Zapier/Make */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-brand-dark">Comment connecter votre CRM ?</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Avec Zapier</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-500">
                <li>Créez un nouveau Zap avec le trigger &quot;Webhooks by Zapier&quot; → &quot;Catch Hook&quot;</li>
                <li>Copiez l&apos;URL du webhook Zapier</li>
                <li>Collez-la ici en cliquant &quot;Ajouter&quot;</li>
                <li>Envoyez un test pour configurer le mapping dans Zapier</li>
                <li>Connectez l&apos;action vers HubSpot, Airtable, GoHighLevel, etc.</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Avec Make (Integromat)</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-500">
                <li>Créez un scénario avec le module &quot;Webhooks&quot; → &quot;Custom webhook&quot;</li>
                <li>Copiez l&apos;URL générée par Make</li>
                <li>Collez-la ici et envoyez un test</li>
                <li>Ajoutez les modules CRM de destination</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
