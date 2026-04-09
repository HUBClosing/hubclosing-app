import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { StatsCard, Card, CardContent, CardHeader, Badge, Avatar } from '@/components/ui';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Briefcase, MessageSquare, TrendingUp } from 'lucide-react';

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Fetch all platform data in parallel
  const [
    totalUsersResult,
    closersResult,
    managersResult,
    pendingUsersResult,
    totalOffersResult,
    activeOffersResult,
    pausedOffersResult,
    totalApplicationsResult,
    pendingAppsResult,
    acceptedAppsResult,
    rejectedAppsResult,
    messagesResult,
    conversationsResult,
    recentUsersResult,
    recentApplicationsResult,
    recentOffersResult,
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'closer'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'manager'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'pending'),
    supabase.from('offers').select('id', { count: 'exact', head: true }),
    supabase.from('offers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('offers').select('id', { count: 'exact', head: true }).eq('status', 'paused'),
    supabase.from('applications').select('id', { count: 'exact', head: true }),
    supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'accepted'),
    supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase.from('messages').select('id', { count: 'exact', head: true }),
    supabase
      .from('messages')
      .select('sender_id, receiver_id')
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase.from('users').select('id, email, full_name, role, created_at').order('created_at', { ascending: false }).limit(10),
    supabase
      .from('applications')
      .select('id, status, created_at, closer:users!closer_id(id, email, full_name), offer:offers!offer_id(id, title, manager_id)')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('offers')
      .select('id, title, status, commission_rate, manager_id, created_at, manager:users!manager_id(id, email, full_name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  // Extract counts
  const totalUsers = totalUsersResult.count || 0;
  const closersCount = closersResult.count || 0;
  const managersCount = managersResult.count || 0;
  const pendingUsersCount = pendingUsersResult.count || 0;

  const totalOffers = totalOffersResult.count || 0;
  const activeOffers = activeOffersResult.count || 0;
  const pausedOffers = pausedOffersResult.count || 0;
  const closedOffers = totalOffers - activeOffers - pausedOffers;

  const totalApplications = totalApplicationsResult.count || 0;
  const pendingApplications = pendingAppsResult.count || 0;
  const acceptedApplications = acceptedAppsResult.count || 0;
  const rejectedApplications = rejectedAppsResult.count || 0;
  const conversionRate = totalApplications > 0 ? ((acceptedApplications / totalApplications) * 100).toFixed(1) : '0';

  const totalMessages = messagesResult.count || 0;
  const conversations = conversationsResult.data || [];
  const uniqueConversations = new Set(
    conversations.flatMap((msg: any) => [
      `${[msg.sender_id, msg.receiver_id].sort().join('-')}`,
    ])
  ).size;

  const recentUsers = recentUsersResult.data || [];
  const recentApplications = recentApplicationsResult.data || [];
  const recentOffers = recentOffersResult.data || [];

  // Role label mapping
  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      closer: 'Closer',
      manager: 'Manager',
      admin: 'Admin',
      pending: 'En attente',
    };
    return roleMap[role] || role;
  };

  // Role badge variant
  const getRoleBadgeVariant = (role: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    const variantMap: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
      closer: 'info',
      manager: 'info',
      admin: 'success',
      pending: 'warning',
    };
    return variantMap[role] || 'default';
  };

  // Application status badge variant
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

  // Offer status badge variant
  const getOfferStatusBadgeVariant = (status: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    const variantMap: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
      active: 'success',
      paused: 'warning',
      closed: 'error',
    };
    return variantMap[status] || 'default';
  };

  const getOfferStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      active: 'Active',
      paused: 'En pause',
      closed: 'Fermée',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-brand-dark">Vue d'ensemble Admin</h1>
        <p className="text-gray-500">Tableau de bord de gestion de la plateforme HUBClosing</p>
      </div>

      {/* KPI Row 1: Users */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Utilisateurs" value={totalUsers} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Closers actifs" value={closersCount} icon={<TrendingUp className="h-5 w-5" />} />
        <StatsCard title="Managers actifs" value={managersCount} icon={<Briefcase className="h-5 w-5" />} />
        <StatsCard title="En attente" value={pendingUsersCount} icon={<Users className="h-5 w-5" />} />
      </div>

      {/* KPI Row 2: Offers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Offres" value={totalOffers} />
        <StatsCard title="Offres actives" value={activeOffers} />
        <StatsCard title="En pause" value={pausedOffers} />
        <StatsCard title="Fermées" value={closedOffers} />
      </div>

      {/* KPI Row 3: Applications */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Candidatures" value={totalApplications} />
        <StatsCard title="En attente" value={pendingApplications} />
        <StatsCard title="Acceptées" value={acceptedApplications} />
        <StatsCard title="Taux de conversion" value={`${conversionRate}%`} />
      </div>

      {/* KPI Row 4: Messaging */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total Messages" value={totalMessages} icon={<MessageSquare className="h-5 w-5" />} />
        <StatsCard title="Conversations uniques" value={uniqueConversations} />
        <StatsCard
          title="Taux d'acceptation"
          value={totalApplications > 0 ? `${((acceptedApplications / totalApplications) * 100).toFixed(0)}%` : '0%'}
        />
        <StatsCard title="Taux de refus" value={totalApplications > 0 ? `${((rejectedApplications / totalApplications) * 100).toFixed(0)}%` : '0%'} />
      </div>

      {/* Two-column grid: Recent Users & Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-brand-dark">Derniers inscrits</h2>
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

      {/* Recent Offers */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-bold text-brand-dark">Dernières offres</h2>
        </CardHeader>
        <CardContent>
          {recentOffers && recentOffers.length > 0 ? (
            <div className="space-y-4">
              {recentOffers.map((offer: any) => (
                <div
                  key={offer.id}
                  className="flex items-center justify-between gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-brand-dark truncate">{offer.title}</p>
                    <p className="text-sm text-gray-500 truncate">{offer.manager?.full_name || offer.manager?.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {offer.commission_rate && (
                      <div className="text-right">
                        <p className="text-sm font-semibold text-brand-amber">{offer.commission_rate}%</p>
                        <p className="text-xs text-gray-500">Commission</p>
                      </div>
                    )}
                    <Badge variant={getOfferStatusBadgeVariant(offer.status)}>{getOfferStatusLabel(offer.status)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Aucune offre récente</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
