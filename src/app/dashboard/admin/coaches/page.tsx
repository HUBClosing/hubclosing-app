import { requireAdmin } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import AdminCoachesContent from './admin-coaches-content';

export default async function AdminCoachesPage() {
  await requireAdmin();
  const adminClient = getSupabaseAdmin();

  // Récupérer les coachs
  const { data: coaches } = await adminClient
    .from('users')
    .select('*')
    .eq('role_type', 'coach')
    .order('created_at', { ascending: false });

  // Récupérer les invitations
  const { data: invitations } = await adminClient
    .from('coach_invitations')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <AdminCoachesContent
      coaches={coaches || []}
      invitations={invitations || []}
    />
  );
}
