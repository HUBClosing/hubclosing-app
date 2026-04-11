'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { Bell, Check, Trash2, Eye, EyeOff, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  category: 'bug' | 'suggestion' | 'signalement' | 'urgent' | 'general';
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
  sender_id: string;
  sender: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

type FilterTab = 'toutes' | 'non-lues' | 'bug' | 'suggestion' | 'signalement' | 'urgent';

export function NotificationsClient() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('toutes');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*, sender:users!sender_id(id, email, full_name)')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setNotifications(data as Notification[]);
      applyFilter(data as Notification[], 'toutes');
    } catch (err) {
      console.error('Erreur lors du chargement des notifications:', err);
      setError('Impossible de charger les notifications');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (data: Notification[], tab: FilterTab) => {
    let filtered = data;

    switch (tab) {
      case 'non-lues':
        filtered = data.filter((n) => !n.is_read);
        break;
      case 'bug':
      case 'suggestion':
      case 'signalement':
      case 'urgent':
        filtered = data.filter((n) => n.category === tab);
        break;
      case 'toutes':
      default:
        filtered = data;
    }

    setFilteredNotifications(filtered);
    setActiveTab(tab);
  };

  const handleMarkAsRead = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: !currentState })
        .eq('id', id);

      if (error) throw error;

      const updated = notifications.map((n) =>
        n.id === id ? { ...n, is_read: !currentState } : n
      );
      setNotifications(updated);
      applyFilter(updated, activeTab);
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
    }
  };

  const handleMarkResolved = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_resolved: !currentState })
        .eq('id', id);

      if (error) throw error;

      const updated = notifications.map((n) =>
        n.id === id ? { ...n, is_resolved: !currentState } : n
      );
      setNotifications(updated);
      applyFilter(updated, activeTab);
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) return;

    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);

      if (error) throw error;

      const updated = notifications.filter((n) => n.id !== id);
      setNotifications(updated);
      applyFilter(updated, activeTab);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'bug':
        return 'bg-red-100 text-red-800';
      case 'suggestion':
        return 'bg-blue-100 text-blue-800';
      case 'signalement':
        return 'bg-red-100 text-red-800';
      case 'urgent':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      bug: 'Bug',
      suggestion: 'Suggestion',
      signalement: 'Signalement',
      urgent: 'Urgent',
      general: 'Général',
    };
    return labels[category] || category;
  };

  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const resolvedCount = notifications.filter((n) => n.is_resolved).length;

  return (
    <div className="space-y-6 p-6 bg-brand-cream min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-brand-dark" />
          <h1 className="text-3xl font-bold text-brand-dark">Notifications</h1>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white border border-brand-dark/10">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">Total</p>
              <p className="text-3xl font-bold text-brand-dark">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-brand-dark/10">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">Non lues</p>
              <p className="text-3xl font-bold text-brand-amber">{unreadCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-brand-dark/10">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">Résolues</p>
              <p className="text-3xl font-bold text-green-600">{resolvedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-brand-dark/10">
        {[
          { tab: 'toutes' as FilterTab, label: 'Toutes' },
          { tab: 'non-lues' as FilterTab, label: 'Non lues' },
          { tab: 'bug' as FilterTab, label: 'Bug' },
          { tab: 'suggestion' as FilterTab, label: 'Suggestion' },
          { tab: 'signalement' as FilterTab, label: 'Signalement' },
          { tab: 'urgent' as FilterTab, label: 'Urgent' },
        ].map(({ tab, label }) => (
          <button
            key={tab}
            onClick={() => applyFilter(notifications, tab)}
            className={`px-4 py-2 whitespace-nowrap text-sm font-medium border-b-2 transition ${
              activeTab === tab
                ? 'border-brand-amber text-brand-dark'
                : 'border-transparent text-gray-600 hover:text-brand-dark'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <Card className="bg-red-50 border border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Chargement des notifications...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredNotifications.length === 0 && (
        <Card className="bg-white border border-brand-dark/10">
          <CardContent className="pt-12 pb-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucune notification</p>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => (
          <Card
            key={notification.id}
            className={`border ${
              notification.is_read
                ? 'border-brand-dark/10 bg-white'
                : 'border-brand-amber bg-amber-50'
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                {/* Main Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    {/* Category Badge */}
                    <Badge className={`${getCategoryBadgeColor(notification.category)} text-xs`}>
                      {getCategoryLabel(notification.category)}
                    </Badge>

                    {/* Read Status Indicator */}
                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-brand-amber" />
                      )}
                      {notification.is_resolved && (
                        <Badge className="bg-green-100 text-green-800 text-xs">Résolu</Badge>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-brand-dark">{notification.title}</h3>

                  {/* Message */}
                  <p className="text-gray-700 text-sm leading-relaxed">{notification.message}</p>

                  {/* Sender Info */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">
                      {notification.sender.full_name || 'Utilisateur'}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>{notification.sender.email}</span>
                  </div>

                  {/* Date */}
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    variant={notification.is_read ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => handleMarkAsRead(notification.id, notification.is_read)}
                    className={
                      !notification.is_read
                        ? 'bg-brand-amber hover:bg-brand-amber/90 text-brand-dark border-0'
                        : 'text-gray-600 hover:text-brand-dark'
                    }
                  >
                    {notification.is_read ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" />
                        <span className="text-xs">Marquer non lu</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        <span className="text-xs">Marquer comme lu</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant={notification.is_resolved ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => handleMarkResolved(notification.id, notification.is_resolved)}
                    className={
                      notification.is_resolved
                        ? 'bg-green-600 hover:bg-green-700 text-white border-0'
                        : 'text-gray-600 hover:text-green-600'
                    }
                  >
                    <Check className="w-4 h-4 mr-1" />
                    <span className="text-xs">
                      {notification.is_resolved ? 'Rétablir' : 'Résolu'}
                    </span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(notification.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    <span className="text-xs">Supprimer</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
