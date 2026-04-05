import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { StatsCard } from '@/components/ui';
import { Users, UserCheck, UserX } from 'lucide-react';
import { UsersClient } from './users-client';

export default async function AdminUsersPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  const allUsers = users || [];
  const closers = allUsers.filter(u => u.role === 'closer').length;
  const managers = allUsers.filter(u => u.role === 'manager').length;
  const active = allUsers.filter(u => u.is_active).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">Gestion des utilisateurs</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total" value={allUsers.length} icon={<Users className="h-6 w-6" />} />
        <StatsCard title="Closers" value={closers} icon={<UserCheck className="h-6 w-6" />} />
        <StatsCard title="Managers" value={managers} icon={<UserCheck className="h-6 w-6" />} />
        <StatsCard title="Actifs" value={active} icon={<UserX className="h-6 w-6" />} />
      </div>

      <UsersClient users={allUsers} />
    </div>
  );
}
