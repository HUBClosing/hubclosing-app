import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CandidaturesContent } from './candidatures-content';

export default async function CandidaturesPage() {
  const user = await requireUser();

  // Seuls les candidats (ou both en mode candidat) voient cette page
  const isCandidate =
    user.role_type === 'candidate' ||
    (user.role_type === 'both' && user.active_role === 'candidate') ||
    user.role === 'closer' ||
    user.role_type === 'admin';

  if (!isCandidate) {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  const { data: applications } = await supabase
    .from('applications')
    .select(`
      *,
      offer:offers(
        id, title, description, commission_rate, fixed_salary,
        offer_type, niche, status, location, questionnaire_id,
        application_deadline, manager_id,
        manager:users!manager_id(id, full_name, avatar_url)
      )
    `)
    .eq('closer_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Mes candidatures</h1>
        <p className="text-gray-500 mt-1">
          {(applications?.length || 0)} candidature{(applications?.length || 0) > 1 ? 's' : ''} au total
        </p>
      </div>

      <CandidaturesContent applications={applications || []} user={user} />
    </div>
  );
}
