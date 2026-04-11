import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { StatsCard, Card, CardContent, CardHeader, Badge, Avatar } from '@/components/ui';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Briefcase, MessageSquare, TrendingUp, Bell, Settings, ArrowRight } from 'lucide-react';

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Fetch all platform data in parallel
  const [
    totalUsersResult,
    closersResult,
    managersResult,
    unreadNotificationsResult,
    activeOffersResult,
    pendingAppsResult,
    totalAppsResult,
    messagesResult,
    recentNotificationsResult,
    recentUsersResult,
    recentApplicationsResult,
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'closer'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'manager'),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false),
    supabase.from('offers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('applications').select('id', { count: 'exact', head: true }),
    supabase.from('messages').select('id', { count: 'exact', head: true }),
    supabase
      .from('notifications')
      .select('*, sender:users!sender_id(id, email, full_name)')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('users').select('id, email, full_name, role, created_at').order('created_at', { ascending: false }).limit(5),
    supabase
      .from('applications')
      .select('id, status, created_at, closer:users!closer_id(id, email, full_name), offer:offers!offer_id(id, title)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  // Extract counts
  const totalUsers = totalUsersResult.count || 0;
  const closersCount = closersResult.count || 0;
  const managersCount = managersResult.count || 0;
  const unreadNotifications = unreadNotificationsResult.count || 0;

  const activeOffers = activeOffersResult.count || 0;
  const pendingApplications = pendingAppsResult.count || 0;
  const totalApplications = totalAppsResult.count || 0;
  const totalMessages = messagesResult.count || 0;
  const conversionRate = totalApplications > 0 ? ((totalApplications - pendingApplications) / totalApplications * 100).toFixed(1) : '0';

  const recentNotifications = recentNotificationsResult.data || [];
  const recentUsers = recentUsersResult.data || [];
  const recentApplications = recentApplicationsResult.data || [];

  // Helper functions
  const getCategoryBadgeVariant = (category: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    const variantMap: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
      bug: 'error',
      suggestion: 'info',
      general: 'default',
      urgent: 'warning',
      signalement: 'error',
    };
    return variantMap[category] || 'default';
  };

  const getCategoryLabel = (category: string) => {
    const labelMap: Record<string, string> = {
      bug: 'Bug',
      suggestion: 'Suggestion',
      general: 'Général',
      urgent: 'Urgent',
      signalement: 'Signalement',
    };
    return labelMap[category] || category;
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      closer: 'Closer',
      manager: 'Manager',
      admin: 'Admin',
      pending: 'En attente',
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeVariant = (role: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    const variantMap: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
      closer: 'info',
      manager: 'info',
      admin: 'success',
      pending: 'warning',
    };
    return variantMap[role] || 'default';
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    const variantMap: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
      pending: 'warning',
      accepted: 'success',
      rejected: 'error',
      withdrawn: 'default',
    };
    return variantMap[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'En attente',
      accepted: 'Acceptée',
      rejected: 'Refusée',
      withdrawn: 'Retirée',
    };
    return statusMap[status] || status;
  };

  const truncateText = (text: string, length: number = 80) => {
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-brand-dark">Centre de commande Admin</h1>
        <p className="text-gray-500">Tableau de bord complet de gestion et de suivi de la plateforme HUBClosing</p>
      </div>

      {/* KPI Row 1: Users & Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total utilisateurs" value={totalUsers} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Closers actifs" value={closersCount} icon={<TrendingUp className="h-5 w-5" />} />
        <StatsCard title="Managers actifs" value={managersCount} icon={<Briefcase className="h-5 w-5" />} />
        <StatsCard title="Notifications non lues" value={unreadNotifications} icon={<Bell className="h-5 w-5" />} />
      </div>

      {/* KPI Row 2: Offers, Applications, Conversion & Messages */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Offres actives" value={activeOffers} icon={<Briefcase className="h-5 w-5" />} />
        <StatsCard title="Candidatures en attente" value={pendingApplications} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Taux de conversion" value={`${conversionRate}%`} icon={<TrendingUp className="h-5 w-5" />} />
        <StatsCard title="Messages total" value={totalMessages} icon={<MessageSquare className="h-5 w-5" />} />
      </div>

      {/* Two-column layout: Notifications & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications & Remontées */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications & Remontées
            </h2>
          </CardHeader>
          <CardContent>
            {recentNotifications && recentNotifications.length > 0 ? (
              <div className="space-y-3">
                {recentNotifications.map((notification: any) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border-l-4 transition-colors ${
                      notification.is_read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getCategoryBadgeVariant(notification.category)}>
                            {getCategoryLabel(notification.category)}
                          </Badge>
                          {!notification.is_read && (
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <p className="font-medium text-brand-dark truncate">{notification.title}</p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{truncateText(notification.message, 100)}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">{notification.sender?.full_name || notification.sender?.email}</span>
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <Link
                  href="/dashboard/admin/notifications"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 mt-4 pt-4 border-t border-gray-200"
                >
                  Voir toutes les notifications
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Aucune notification</p>
            )}
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Actions rapides
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link
                href="/dashboard/admin/users"
                className="flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Gérer les utilisateurs</span>
                </div>
                <ArrowRight className="h-4 w-4 text-blue-600" />
              </Link>

              <Link
                href="/dashboard/admin/offers"
                className="flex items-center justify-between p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors border border-green-200"
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">Gérer les offres</span>
                </div>
                <ArrowRight className="h-4 w-4 text-green-600" />
              </Link>

              <Link
                href="/dashboard/admin/notifications"
                className="flex items-center justify-between p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200"
              >
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-amber-900">Voir les notifications</span>
                </div>
                <ArrowRight className="h-4 w-4 text-amber-600" />
              </Link>

              <Link
                href="/dashboard/admin/settings"
                className="flex items-center justify-between p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors border border-purple-200"
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Configuration</span>
                </div>
                <ArrowRight className="h-4 w-4 text-purple-600" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-brand-dark">Derniers utilisateurs inscrits</h2>
          </CardHeader>
          <CardContent>
            {recentUsers && recentUsers.length > 0 ? (
              <div className="space-y-4">
                {recentUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar src={undefined} fallback={user.full_name || user.email} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-brand-dark truncate">{user.full_name || user.email}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleLabel(user.role)}</Badge>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Aucun utilisateur récent</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-brand-dark">Dernières candidatures</h2>
          </CardHeader>
          <CardContent>
            {recentApplications && recentApplications.length > 0 ? (
              <div className="space-y-4">
                {recentApplications.map((app: any) => (
                  <div key={app.id} className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-brand-dark truncate">{app.closer?.full_name || app.closer?.email}</p>
                      <p className="text-sm text-gray-500 truncate">{app.offer?.title || 'Offre supprimée'}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(app.created_at), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(app.status)}>{getStatusLabel(app.status)}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Aucune candidature récente</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
