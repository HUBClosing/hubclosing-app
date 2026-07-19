'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, Check, CheckCheck, ExternalLink, X } from 'lucide-react';
import type { Notification } from '@/types/database';

// ============================================================
// Icônes & couleurs par type de notification
// ============================================================

const NOTIF_TYPE_CONFIG: Record<string, { emoji: string; color: string }> = {
  new_application:      { emoji: '📩', color: 'bg-blue-100' },
  status_change:        { emoji: '🔄', color: 'bg-amber-100' },
  questionnaire_filled: { emoji: '📝', color: 'bg-green-100' },
  offer_expiring:       { emoji: '⏰', color: 'bg-red-100' },
  message_received:     { emoji: '💬', color: 'bg-purple-100' },
  system:               { emoji: '📢', color: 'bg-gray-100' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Charger les notifications récentes
  const loadNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n: Record<string, unknown>) => !n.is_read).length);
    }
  }, [userId, supabase]);

  useEffect(() => {
    loadNotifications();

    // Polling toutes les 30 secondes pour les nouvelles notifications
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Marquer une notification comme lue
  const markAsRead = async (notifId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId);

    setNotifications(prev =>
      prev.map(n => n.id === notifId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    setLoading(true);
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    setLoading(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[480px] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
          {/* Header dropdown */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-sm font-semibold text-brand-dark">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  ({unreadCount} non lue{unreadCount > 1 ? 's' : ''})
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="text-xs text-brand-green hover:text-brand-green/80 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Tout lire
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="max-h-[380px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const config = NOTIF_TYPE_CONFIG[notif.type] || NOTIF_TYPE_CONFIG.system;
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notif.is_read ? 'bg-blue-50/30' : ''
                    }`}
                    onClick={() => {
                      if (!notif.is_read) markAsRead(notif.id);
                      if (notif.link) {
                        window.location.href = notif.link;
                        setIsOpen(false);
                      }
                    }}
                  >
                    {/* Icône type */}
                    <div className={`h-9 w-9 rounded-full ${config.color} flex items-center justify-center shrink-0 text-base`}>
                      {config.emoji}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-tight ${!notif.is_read ? 'font-semibold text-brand-dark' : 'text-gray-700'}`}>
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                      {notif.body && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer — lien vers toutes les notifications */}
          <div className="border-t border-gray-100 bg-gray-50/50">
            <a
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-1.5 p-2.5 text-sm font-medium text-brand-green hover:text-brand-green/80 hover:bg-gray-100 transition-colors"
            >
              Voir toutes les notifications
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
