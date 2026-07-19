'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui';
import {
  Bell, CheckCheck, Trash2, Filter, Loader2,
} from 'lucide-react';
import type { Notification, NotificationType } from '@/types/database';

// ============================================================
// Config types
// ============================================================

const NOTIF_TYPE_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
  new_application:      { emoji: '📩', color: 'bg-blue-100', label: 'Nouvelle candidature' },
  status_change:        { emoji: '🔄', color: 'bg-amber-100', label: 'Changement de statut' },
  questionnaire_filled: { emoji: '📝', color: 'bg-green-100', label: 'Questionnaire rempli' },
  offer_expiring:       { emoji: '⏰', color: 'bg-red-100', label: 'Offre expirante' },
  message_received:     { emoji: '💬', color: 'bg-purple-100', label: 'Nouveau message' },
  system:               { emoji: '📢', color: 'bg-gray-100', label: 'Système' },
};

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'unread', label: 'Non lues' },
  { value: 'new_application', label: 'Candidatures' },
  { value: 'status_change', label: 'Statuts' },
  { value: 'questionnaire_filled', label: 'Questionnaires' },
  { value: 'message_received', label: 'Messages' },
  { value: 'system', label: 'Système' },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;

  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return `Aujourd'hui à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Hier à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function NotificationsPage() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    const { data } = await query;
    setNotifications((data || []) as Notification[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  // Filtrage côté client
  const filtered = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.is_read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Marquer une notification comme lue
  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    setActionLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
    setActionLoading(false);
  };

  // Supprimer les notifications lues
  const deleteRead = async () => {
    setActionLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('is_read', true);
      setNotifications(prev => prev.filter(n => !n.is_read));
    }
    setActionLoading(false);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Chargement des notifications...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0
              ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''} sur ${notifications.length}`
              : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-green bg-brand-green/10 rounded-lg hover:bg-brand-green/20 transition-colors disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              Tout marquer lu
            </button>
          )}
          <button
            onClick={deleteRead}
            disabled={actionLoading || notifications.filter(n => n.is_read).length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer lues
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-gray-400" />
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filter === opt.value
                ? 'bg-brand-dark text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
            {opt.value === 'unread' && unreadCount > 0 && (
              <span className="ml-1 inline-block bg-red-500 text-white rounded-full px-1.5 text-xs">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {filter === 'all' ? 'Aucune notification' : 'Aucune notification dans cette catégorie'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const config = NOTIF_TYPE_CONFIG[notif.type] || NOTIF_TYPE_CONFIG.system;

            return (
              <Card
                key={notif.id}
                className={`transition-all hover:shadow-md cursor-pointer ${!notif.is_read ? 'ring-1 ring-blue-200 bg-blue-50/20' : ''}`}
              >
                <CardContent className="p-0">
                  <div
                    className="flex items-start gap-3 p-4"
                    onClick={() => {
                      if (!notif.is_read) markAsRead(notif.id);
                      if (notif.link) window.location.href = notif.link;
                    }}
                  >
                    {/* Icône */}
                    <div className={`h-10 w-10 rounded-full ${config.color} flex items-center justify-center shrink-0 text-lg`}>
                      {config.emoji}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm ${!notif.is_read ? 'font-semibold text-brand-dark' : 'font-medium text-gray-700'}`}>
                            {notif.title}
                          </p>
                          <span className="text-xs text-gray-400 mt-0.5 inline-block">{config.label}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-400">{formatDate(notif.created_at)}</span>
                          {!notif.is_read && <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
                        </div>
                      </div>
                      {notif.body && (
                        <p className="text-sm text-gray-500 mt-1">{notif.body}</p>
                      )}
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
