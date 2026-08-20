import { requireAdmin } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { StatsCard } from '@/components/ui';
import { Users, UserCheck, Briefcase, UserX } from 'lucide-react';
import { UsersClient } from './users-client';

export default async function AdminUsersPage() {
  await requireAdmin();
  const adminClient = getSupabaseAdmin();

  const { data: users } = await adminClient
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  const allUsers = users || [];
  const closers = allUsers.filter(u => u.role === 'closer' || u.role_type === 'candidate').length;
  const managers = allUsers.filter(u => u.role === 'manager' || u.role_type === 'recruiter').length;
  const active = allUsers.filter(u => u.is_active !== false).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">Gestion des utilisateurs</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total" value={allUsers.length} icon={<Users className="h-6 w-6" />} />
        <StatsCard title="Candidats" value={closers} icon={<UserCheck className="h-6 w-6" />} />
        <StatsCard title="Recruteurs" value={managers} icon={<Briefcase className="h-6 w-6" />} />
        <StatsCard title="Actifs" value={active} icon={<UserX className="h-6 w-6" />} />
      </div>

      <UsersClient users={allUsers} />
    </div>
  );
}
