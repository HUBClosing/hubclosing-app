import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CvthequeContent } from './cvtheque-content';

export default async function CvthequePage() {
  const user = await requireUser();

  // Seuls les recruteurs (ou both en mode recruteur) et admins voient cette page
  const isRecruiter =
    user.role_type === 'recruiter' ||
    (user.role_type === 'both' && user.active_role === 'recruiter') ||
    user.role === 'manager' ||
    user.role_type === 'admin';

  if (!isRecruiter) {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  // Récupérer tous les candidats avec profil public + données portfolio agrégées
  const { data: profiles } = await supabase
    .from('profiles')
    .select(`
      *,
      user:users!user_id(
        id, full_name, avatar_url, email, skills, niches,
        years_experience, role_type, active_role, tier, is_active, created_at
      )
    `)
    .eq('is_public', true)
    .order('score', { ascending: false });

  // Filtrer : garder uniquement les candidats actifs
  const candidates = (profiles || []).filter((p: any) => {
    const u = p.user;
    if (!u || !u.is_active) return false;
    return (
      u.role_type === 'candidate' ||
      u.role_type === 'both' ||
      u.role_type === 'admin'
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">CVthèque</h1>
        <p className="text-gray-500 mt-1">
          {candidates.length} profil{candidates.length > 1 ? 's' : ''} de candidats disponibles
        </p>
      </div>

      <CvthequeContent candidates={candidates} user={user} />
    </div>
  );
}
