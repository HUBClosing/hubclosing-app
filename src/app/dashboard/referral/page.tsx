import { requireUser } from '@/lib/auth';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { Gift, Users, Link as LinkIcon, Coins } from 'lucide-react';

export default async function ReferralPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-brand-dark">Parrainage</h1>
          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-medium">
            Bientôt disponible
          </span>
        </div>
        <p className="text-gray-500 mt-1">
          Parrainez des closers et recruteurs pour gagner des commissions récurrentes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
            <Gift className="h-5 w-5 text-brand-amber" />
            Programme de parrainage
          </h2>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto h-16 w-16 bg-brand-amber/10 rounded-2xl flex items-center justify-center mb-4">
              <Gift className="h-8 w-8 text-brand-amber" />
            </div>
            <h3 className="text-lg font-semibold text-brand-dark mb-2">
              Invitez et gagnez
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Bientôt, vous recevrez un code de parrainage unique. Partagez-le avec
              votre réseau : pour chaque inscription qui passe en abonnement payant,
              vous toucherez une commission récurrente. Suivez vos filleuls, vos gains
              et votre historique de paiements directement ici.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <LinkIcon className="h-4 w-4" /> Code unique
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" /> Filleuls
              </span>
              <span className="flex items-center gap-1.5">
                <Coins className="h-4 w-4" /> Commissions
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
