import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { Card, CardContent, Badge, Avatar, EmptyState } from '@/components/ui';
import { Users } from 'lucide-react';
import { notFound } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import CandidateActions from '@/components/offers/CandidateActions';

export default async function CandidatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole('manager');
  const supabase = await createClient();

  const { data: offer } = await supabase.from('offers').select('*').eq('id', id).eq('manager_id', user.id).single();
  if (!offer) notFound();

  const { data: applications } = await supabase
    .from('applications')
    .select('*, closer:users!closer_id(*)')
    .eq('offer_id', id)
    .order('created_at', { ascending: false });

  const pending = applications?.filter((a: any) => a.status === 'pending').length || 0;
  const accepted = applications?.filter((a: any) => a.status === 'accepted').length || 0;
  const rejected = applications?.filter((a: any) => a.status === 'rejected').length || 0;

  return (
    <div className="space-y-6">
      <div>
        <a href="/dashboard/offers" className="text-sm text-brand-green hover:underline">&larr; Retour aux offres</a>
        <h1 className="text-2xl font-bold text-brand-dark mt-2">Candidatures pour &quot;{offer.title}&quot;</h1>
        <p className="text-gray-500 mt-1">{applications?.length || 0} candidature(s) au total</p>
      </div>

      {/* Résumé des stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{pending}</p>
          <p className="text-sm text-amber-600">En attente</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{accepted}</p>
          <p className="text-sm text-green-600">Accepté(s)</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{rejected}</p>
          <p className="text-sm text-red-600">Refusé(s)</p>
        </div>
      </div>

      {applications && applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app: any) => (
            <Card key={app.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={app.closer?.avatar_url} fallback={app.closer?.full_name || ''} />
                    <div>
                      <p className="font-medium text-brand-dark">{app.closer?.full_name || app.closer?.email}</p>
                      <p className="text-sm text-gray-500">
                        Postulé {formatDistanceToNow(new Date(app.created_at), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                  </div>
                  <CandidateActions
                    applicationId={app.id}
                    currentStatus={app.status}
                    closerId={app.closer_id}
                    managerId={user.id}
                    offerTitle={offer.title}
                  />
                </div>
                {app.cover_letter && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-xs font-medium text-gray-400 mb-1">Lettre de motivation</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{app.cover_letter}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Users className="h-12 w-12" />} title="Aucune candidature" description="Aucun closer n'a encore postulé à cette offre." />
      )}
    </div>
  );
}
