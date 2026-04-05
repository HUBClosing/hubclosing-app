import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { StatsCard, Card, CardContent, CardHeader } from '@/components/ui';
import {
  Briefcase, Users, MessageSquare, TrendingUp, FileText,
  ShoppingBag, BarChart3, Calendar, GraduationCap, Rocket,
  Clock, CheckCircle, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

async function getDashboardData(userId: string, role: string) {
  const supabase = await createClient();

  if (role === 'closer') {
    const [
      { count: applications },
      { count: messages },
      { count: activeOffers },
      { count: acceptedApps },
      { data: upcomingEvents },
      { data: recentOffers },
    ] = await Promise.all([
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('closer_id', userId),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('sender_id', userId),
      supabase.from('offers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('closer_id', userId).eq('status', 'accepted'),
      supabase.from('events').select('*, host:users!host_id(full_name)').eq('status', 'upcoming').order('start_date', { ascending: true }).limit(3),
      supabase.from('offers').select('*, manager:users!manager_id(full_name)').eq('status', 'active').order('created_at', { ascending: false }).limit(4),
    ]);
    return {
      applications: applications || 0,
      messages: messages || 0,
      activeOffers: activeOffers || 0,
      acceptedApps: acceptedApps || 0,
      upcomingEvents: upcomingEvents || [],
      recentOffers: recentOffers || [],
    };
  }

  if (role === 'manager') {
    const [
      { count: offers },
      { count: applications },
      { count: acceptedApps },
      { data: recentApps },
      { data: upcomingEvents },
    ] = await Promise.all([
      supabase.from('offers').select('*', { count: 'exact', head: true }).eq('manager_id', userId),
      supabase.from('applications').select('*, offers!inner(manager_id)', { count: 'exact', head: true }).eq('offers.manager_id', userId),
      supabase.from('applications').select('*, offers!inner(manager_id)', { count: 'exact', head: true }).eq('offers.manager_id', userId).eq('status', 'accepted'),
      supabase.from('applications').select('*, closer:users!closer_id(full_name, email), offer:offers!inner(title, manager_id)').eq('offers.manager_id', userId).order('created_at', { ascending: false }).limit(5),
      supabase.from('events').select('*, host:users!host_id(full_name)').eq('status', 'upcoming').order('start_date', { ascending: true }).limit(3),
    ]);
    const conversionRate = applications && applications > 0 ? ((acceptedApps || 0) / applications * 100).toFixed(1) : '0';
    return {
      offers: offers || 0,
      applications: applications || 0,
      conversionRate,
      recentApps: recentApps || [],
      upcomingEvents: upcomingEvents || [],
    };
  }

  if (role === 'admin') {
    const [
      { count: totalUsers },
      { count: totalOffers },
      { count: totalApplications },
      { count: activeOffers },
      { count: totalClosers },
      { count: totalManagers },
      { count: pendingApps },
      { data: recentUsers },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('offers').select('*', { count: 'exact', head: true }),
      supabase.from('applications').select('*', { count: 'exact', head: true }),
      supabase.from('offers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'closer'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'manager'),
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('users').select('id, email, full_name, role, created_at').order('created_at', { ascending: false }).limit(5),
    ]);
    return {
      totalUsers: totalUsers || 0,
      totalOffers: totalOffers || 0,
      totalApplications: totalApplications || 0,
      activeOffers: activeOffers || 0,
      totalClosers: totalClosers || 0,
      totalManagers: totalManagers || 0,
      pendingApps: pendingApps || 0,
      recentUsers: recentUsers || [],
    };
  }

  return {};
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

const eventTypeLabels: Record<string, string> = {
  coaching: 'Coaching',
  webinaire: 'Webinaire',
  atelier: 'Atelier',
  networking: 'Networking',
};

const eventTypeColors: Record<string, string> = {
  coaching: 'bg-blue-100 text-blue-700',
  webinaire: 'bg-purple-100 text-purple-700',
  atelier: 'bg-green-100 text-green-700',
  networking: 'bg-amber-100 text-amber-700',
};

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id, user.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">
          {user.role === 'closer' && 'Retrouvez vos opportunit\u00e9s et suivez vos candidatures'}
          {user.role === 'manager' && 'G\u00e9rez vos offres et trouvez les meilleurs closers'}
          {user.role === 'admin' && 'Vue d\'ensemble de la plateforme HUBClosing'}
        </p>
      </div>

      {/* ========== CLOSER DASHBOARD ========== */}
      {user.role === 'closer' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Candidatures envoy\u00e9es" value={data.applications || 0} icon={<FileText className="h-6 w-6" />} />
            <StatsCard title="Candidatures accept\u00e9es" value={data.acceptedApps || 0} icon={<CheckCircle className="h-6 w-6" />} />
            <StatsCard title="Offres disponibles" value={data.activeOffers || 0} icon={<ShoppingBag className="h-6 w-6" />} />
            <StatsCard title="Messages" value={data.messages || 0} icon={<MessageSquare className="h-6 w-6" />} />
          </div>

          {/* Recent Offers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-brand-amber" /> Offres r\u00e9centes
                </h2>
                <Link href="/dashboard/marketplace" className="text-sm text-brand-green hover:underline flex items-center gap-1">
                  Voir tout <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data.recentOffers && data.recentOffers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.recentOffers.map((offer: any) => (
                    <Link key={offer.id} href={`/dashboard/marketplace/${offer.id}`} className="block p-4 rounded-lg border border-gray-200 hover:border-brand-green hover:shadow-sm transition-all">
                      <h3 className="font-medium text-brand-dark">{offer.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{offer.manager?.full_name}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          {offer.commission_value}{offer.commission_type === 'percentage' ? '%' : '\u20ac'} commission
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(offer.created_at)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6">Aucune offre disponible pour le moment.</p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-brand-amber" /> Coaching &amp; \u00c9v\u00e9nements
                </h2>
                <Link href="/dashboard/events" className="text-sm text-brand-green hover:underline flex items-center gap-1">
                  Voir tout <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data.upcomingEvents && data.upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {data.upcomingEvents.map((event: any) => (
                    <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                      <div className="flex-shrink-0 h-12 w-12 bg-brand-amber/10 rounded-lg flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-brand-amber" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-brand-dark truncate">{event.title}</h3>
                        <p className="text-sm text-gray-500">{formatDateTime(event.start_date)} &middot; {event.host?.full_name || 'HUBClosing'}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${eventTypeColors[event.event_type] || 'bg-gray-100 text-gray-600'}`}>
                        {eventTypeLabels[event.event_type] || event.event_type}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Aucun \u00e9v\u00e9nement \u00e0 venir pour le moment.</p>
                  <p className="text-sm text-gray-400 mt-1">Les coaching et webinaires seront affich\u00e9s ici.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ========== MANAGER DASHBOARD ========== */}
      {user.role === 'manager' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Offres publi\u00e9es" value={data.offers || 0} icon={<Briefcase className="h-6 w-6" />} />
            <StatsCard title="Candidatures re\u00e7ues" value={data.applications || 0} icon={<Users className="h-6 w-6" />} />
            <StatsCard title="Taux de conversion" value={`${data.conversionRate || 0}%`} icon={<TrendingUp className="h-6 w-6" />} />
            <StatsCard title="Messages" value="—" icon={<MessageSquare className="h-6 w-6" />} />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/dashboard/offers/new" className="block">
              <Card hover>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 bg-brand-green/10 rounded-xl flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-brand-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark">Publier une offre</h3>
                    <p className="text-sm text-gray-500">Attirez les meilleurs closers pour vos produits</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/events" className="block">
              <Card hover>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 bg-brand-amber/10 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-brand-amber" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark">\u00c9v\u00e9nements</h3>
                    <p className="text-sm text-gray-500">Coaching, webinaires et networking</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-brand-dark">Derni\u00e8res candidatures re\u00e7ues</h2>
            </CardHeader>
            <CardContent>
              {data.recentApps && data.recentApps.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {data.recentApps.map((app: any) => (
                    <div key={app.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-brand-dark">{app.closer?.full_name || app.closer?.email}</p>
                        <p className="text-sm text-gray-500">Pour : {app.offer?.title}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        app.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {app.status === 'pending' ? 'En attente' : app.status === 'accepted' ? 'Accept\u00e9e' : 'Refus\u00e9e'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6">Aucune candidature re\u00e7ue pour le moment.</p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-brand-amber" /> Prochains \u00e9v\u00e9nements
                </h2>
                <Link href="/dashboard/events" className="text-sm text-brand-green hover:underline flex items-center gap-1">
                  Voir tout <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data.upcomingEvents && data.upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {data.upcomingEvents.map((event: any) => (
                    <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100">
                      <div className="flex-shrink-0 h-12 w-12 bg-brand-amber/10 rounded-lg flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-brand-amber" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-brand-dark truncate">{event.title}</h3>
                        <p className="text-sm text-gray-500">{formatDateTime(event.start_date)}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${eventTypeColors[event.event_type] || 'bg-gray-100 text-gray-600'}`}>
                        {eventTypeLabels[event.event_type] || event.event_type}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun \u00e9v\u00e9nement \u00e0 venir.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ========== ADMIN DASHBOARD ========== */}
      {user.role === 'admin' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Utilisateurs" value={data.totalUsers || 0} icon={<Users className="h-6 w-6" />} />
            <StatsCard title="Offres actives" value={data.activeOffers || 0} icon={<Briefcase className="h-6 w-6" />} />
            <StatsCard title="Candidatures" value={data.totalApplications || 0} icon={<BarChart3 className="h-6 w-6" />} />
            <StatsCard title="En attente" value={data.pendingApps || 0} icon={<Clock className="h-6 w-6" />} />
          </div>

          {/* Admin breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-brand-dark">{data.totalClosers || 0}</p>
                <p className="text-sm text-gray-500">Closers inscrits</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Briefcase className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-brand-dark">{data.totalManagers || 0}</p>
                <p className="text-sm text-gray-500">Managers / HOS</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <ShoppingBag className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-brand-dark">{data.totalOffers || 0}</p>
                <p className="text-sm text-gray-500">Offres total</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Admin Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/admin/users" className="block">
              <Card hover>
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="h-5 w-5 text-brand-green" />
                  <span className="font-medium text-brand-dark">G\u00e9rer les utilisateurs</span>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/admin/offers" className="block">
              <Card hover>
                <CardContent className="p-4 flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-brand-green" />
                  <span className="font-medium text-brand-dark">G\u00e9rer les offres</span>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/admin/stats" className="block">
              <Card hover>
                <CardContent className="p-4 flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-brand-green" />
                  <span className="font-medium text-brand-dark">Statistiques</span>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent Users */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-brand-dark">Derniers inscrits</h2>
            </CardHeader>
            <CardContent>
              {data.recentUsers && data.recentUsers.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {data.recentUsers.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-brand-dark">{u.full_name || u.email}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          u.role === 'closer' ? 'bg-blue-100 text-blue-700' :
                          u.role === 'manager' ? 'bg-purple-100 text-purple-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {u.role}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(u.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun utilisateur inscrit.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
