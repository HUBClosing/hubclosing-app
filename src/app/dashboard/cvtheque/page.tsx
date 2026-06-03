import { requireUser } from '@/lib/auth';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { BookUser, Search, Filter, UserCheck } from 'lucide-react';

export default async function CvthequePage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-brand-dark">CVthèque</h1>
          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-medium">
            Bientôt disponible
          </span>
        </div>
        <p className="text-gray-500 mt-1">
          Parcourez les profils des candidats et trouvez les meilleurs talents pour vos missions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
            <BookUser className="h-5 w-5 text-brand-amber" />
            Base de candidats
          </h2>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto h-16 w-16 bg-brand-amber/10 rounded-2xl flex items-center justify-center mb-4">
              <BookUser className="h-8 w-8 text-brand-amber" />
            </div>
            <h3 className="text-lg font-semibold text-brand-dark mb-2">
              Trouvez les meilleurs closers
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Bientôt, les recruteurs pourront parcourir une base de profils qualifiés.
              Filtrez par compétences, niches, niveau d&apos;expérience et score de
              réputation. Contactez directement les candidats qui correspondent à vos
              besoins et consultez leurs statistiques de performance.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <Search className="h-4 w-4" /> Recherche
              </span>
              <span className="flex items-center gap-1.5">
                <Filter className="h-4 w-4" /> Filtres
              </span>
              <span className="flex items-center gap-1.5">
                <UserCheck className="h-4 w-4" /> Contact direct
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
