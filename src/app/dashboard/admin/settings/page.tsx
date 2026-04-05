import { requireAdmin } from '@/lib/auth';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { Shield, Database, Globe, Mail } from 'lucide-react';

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">Configuration</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand-green" />
              <h2 className="font-semibold text-brand-dark">Sécurité</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>Authentification Supabase active</p>
            <p>Row Level Security (RLS) activé sur toutes les tables</p>
            <p>Middleware de protection des routes actif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-brand-green" />
              <h2 className="font-semibold text-brand-dark">Base de données</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>PostgreSQL via Supabase</p>
            <p>6 tables principales</p>
            <p>23+ politiques RLS configurées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-brand-green" />
              <h2 className="font-semibold text-brand-dark">Plateforme</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>Next.js 14 avec App Router</p>
            <p>Déploiement : Vercel / Netlify</p>
            <p>TypeScript + Tailwind CSS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-brand-green" />
              <h2 className="font-semibold text-brand-dark">Notifications</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>Emails transactionnels via Supabase Auth</p>
            <p>Templates personnalisables dans Supabase</p>
            <p>Notifications in-app (à venir)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
