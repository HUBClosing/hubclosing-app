import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, Badge, EmptyState } from '@/components/ui';
import { FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default async function CandidaturesPage() {
  const user = await requireRole('closer');
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from('applications')
    .select('*, offer:offers(id, title, commission_value, commission_type, status, manager:users!manager_id(full_name))')
    .eq('closer_id', user.id)
    .order('created_at', { ascending: false });

  const statusLabels: Record<string, string> = { pending: 'En attente', accepted: 'Acceptée', rejected: 'Refusée', withdrawn: 'Retirée' };
  const statusVariants: Record<string, 'warning' | 'success' | 'error' | 'default'> = { pending: 'warning', accepted: 'success', rejected: 'error', withdrawn: 'default' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Mes candidatures</h1>
        <p className="text-gray-500 mt-1">Suivez l&apos;état de vos candidatures</p>
      </div>

      {applications && applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app: any) => (
            <Card key={app.id} hover>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-brand-dark">{app.offer?.title}</h3>
                    <p className="text-sm text-gray-500">{app.offer?.manager?.full_name} &middot; {app.offer?.commission_value}% commission</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(app.created_at), { addSuffix: true, locale: fr })}</p>
                  </div>
                  <Badge variant={statusVariants[app.status]}>{statusLabels[app.status]}</Badge>
                </div>
                {app.cover_letter && <p className="mt-2 text-sm text-gray-600 line-clamp-2">{app.cover_letter}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Aucune candidature"
          description="Parcourez la marketplace pour postuler à des offres."
          action={<a href="/dashboard/marketplace" className="inline-block px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-dark transition-colors text-sm">Voir la marketplace</a>}
        />
      )}
    </div>
  );
}
