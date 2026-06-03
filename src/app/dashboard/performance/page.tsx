import { requireUser } from '@/lib/auth';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { BarChart3, TrendingUp, Phone, CalendarCheck, DollarSign } from 'lucide-react';

export default async function PerformancePage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-brand-dark">Mes performances</h1>
          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-medium">
            Bientôt disponible
          </span>
        </div>
        <p className="text-gray-500 mt-1">
          Suivez vos métriques quotidiennes et analysez votre progression.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-brand-amber" />
            Tableau de suivi
          </h2>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto h-16 w-16 bg-brand-amber/10 rounded-2xl flex items-center justify-center mb-4">
              <TrendingUp className="h-8 w-8 text-brand-amber" />
            </div>
            <h3 className="text-lg font-semibold text-brand-dark mb-2">
              Suivi de performances
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Bientôt, vous pourrez enregistrer vos appels, rendez-vous, deals closés
              et revenus générés chaque jour. Des graphiques de progression et des objectifs
              personnalisés vous aideront à atteindre vos résultats.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" /> Appels
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarCheck className="h-4 w-4" /> Rendez-vous
              </span>
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4" /> Revenus
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
