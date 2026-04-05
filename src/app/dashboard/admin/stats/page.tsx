import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { StatsCard, Card, CardContent, CardHeader } from '@/components/ui';
import { Users, Briefcase, FileText, TrendingUp, MessageSquare, BarChart3 } from 'lucide-react';

export default async function AdminStatsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: totalClosers },
    { count: totalManagers },
    { count: totalOffers },
    { count: activeOffers },
    { count: totalApps },
    { count: pendingApps },
    { count: acceptedApps },
    { count: totalMessages },
    { count: totalConversations },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'closer'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'manager'),
    supabase.from('offers').select('*', { count: 'exact', head: true }),
    supabase.from('offers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('applications').select('*', { count: 'exact', head: true }),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase.from('conversations').select('*', { count: 'exact', head: true }),
  ]);

  const conversionRate = totalApps && totalApps > 0 ? ((acceptedApps || 0) / totalApps * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">Statistiques de la plateforme</h1>

      <div>
        <h2 className="text-lg font-semibold text-brand-dark mb-3">Utilisateurs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard title="Total utilisateurs" value={totalUsers || 0} icon={<Users className="h-6 w-6" />} />
          <StatsCard title="Closers" value={totalClosers || 0} icon={<Users className="h-6 w-6" />} />
          <StatsCard title="Managers" value={totalManagers || 0} icon={<Users className="h-6 w-6" />} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-brand-dark mb-3">Offres</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard title="Total offres" value={totalOffers || 0} icon={<Briefcase className="h-6 w-6" />} />
          <StatsCard title="Offres actives" value={activeOffers || 0} icon={<Briefcase className="h-6 w-6" />} />
          <StatsCard title="Taux remplissage" value={totalOffers && totalOffers > 0 ? `${((activeOffers || 0) / totalOffers * 100).toFixed(0)}%` : '0%'} icon={<BarChart3 className="h-6 w-6" />} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-brand-dark mb-3">Candidatures</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard title="Total candidatures" value={totalApps || 0} icon={<FileText className="h-6 w-6" />} />
          <StatsCard title="En attente" value={pendingApps || 0} icon={<FileText className="h-6 w-6" />} />
          <StatsCard title="Acceptées" value={acceptedApps || 0} icon={<FileText className="h-6 w-6" />} />
          <StatsCard title="Taux conversion" value={`${conversionRate}%`} icon={<TrendingUp className="h-6 w-6" />} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-brand-dark mb-3">Messagerie</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatsCard title="Messages envoyés" value={totalMessages || 0} icon={<MessageSquare className="h-6 w-6" />} />
          <StatsCard title="Conversations" value={totalConversations || 0} icon={<MessageSquare className="h-6 w-6" />} />
        </div>
      </div>
    </div>
  );
}
