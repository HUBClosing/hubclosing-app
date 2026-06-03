import { requireUser } from '@/lib/auth';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { Shield, Star, Award, MessageCircle } from 'lucide-react';

export default async function ReputationPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-brand-dark">Réputation</h1>
          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-medium">
            Bientôt disponible
          </span>
        </div>
        <p className="text-gray-500 mt-1">
          Votre score de confiance, vos badges et les avis de vos collaborations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand-amber" />
            Score de réputation
          </h2>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto h-16 w-16 bg-brand-amber/10 rounded-2xl flex items-center justify-center mb-4">
              <Award className="h-8 w-8 text-brand-amber" />
            </div>
            <h3 className="text-lg font-semibold text-brand-dark mb-2">
              Système de réputation
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Bientôt, votre profil affichera un score de réputation basé sur vos
              performances, les avis de vos partenaires et votre activité sur la
              plateforme. Débloquez des badges Bronze, Silver, Gold, Platinum et Diamond
              pour vous démarquer.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4" /> Score
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4" /> Badges
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" /> Avis
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
