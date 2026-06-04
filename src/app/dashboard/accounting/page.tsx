import { requireUser } from '@/lib/auth';
import { canUserDo } from '@/types/database';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { Receipt, Lock, Euro, FileText, PieChart } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function AccountingPage() {
  const user = await requireUser();

  // Gate: Élite uniquement
  if (!canUserDo(user, 'accounting') && user.role !== 'admin') {
    redirect('/dashboard/subscription');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Comptabilité</h1>
        <p className="text-gray-500 mt-1">Suivez vos encaissements et facturez vos clients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Euro className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-brand-dark">0€</p>
            <p className="text-sm text-gray-500">Encaissements ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-brand-dark">0</p>
            <p className="text-sm text-gray-500">Factures émises</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <PieChart className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-brand-dark">0€</p>
            <p className="text-sm text-gray-500">En attente de paiement</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
            <Receipt className="h-5 w-5 text-brand-amber" />
            Historique des encaissements
          </h2>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <Receipt className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun encaissement enregistré</p>
            <p className="text-sm text-gray-400 mt-1">
              Vos commissions et paiements reçus apparaîtront ici.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
