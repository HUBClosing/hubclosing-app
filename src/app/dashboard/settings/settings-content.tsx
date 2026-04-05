'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import type { User } from '@/types/database';
import { Card, CardContent, CardHeader, Button, Switch } from '@/components/ui';
import { Save, Loader2, Trash2, Bell, Mail, MessageSquare } from 'lucide-react';

interface SettingsContentProps {
  user: User;
}

export function SettingsContent({ user }: SettingsContentProps) {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [emailNotif, setEmailNotif] = useState(true);
  const [messageNotif, setMessageNotif] = useState(true);
  const [candidatureNotif, setCandidatureNotif] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const saveNotifications = async () => {
    setSaving(true);
    // Sauvegarde dans les metadata utilisateur Supabase
    await supabase.auth.updateUser({
      data: {
        notifications: {
          email: emailNotif,
          messages: messageNotif,
          candidatures: candidatureNotif,
        },
      },
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'SUPPRIMER') return;
    setDeleting(true);

    // Désactiver le compte (soft delete)
    await supabase.from('users').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', user.id);

    // Déconnecter
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">Paramètres</h1>

      {/* Infos Compte */}
      <Card>
        <CardHeader><h2 className="font-semibold text-brand-dark">Compte</h2></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Rôle</p>
              <p className="text-sm text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Abonnement</p>
              <p className="text-sm text-gray-500 capitalize">{user.subscription_plan}</p>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
              {user.subscription_plan === 'free' ? 'Gratuit' : user.subscription_plan}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-dark" />
            <h2 className="font-semibold text-brand-dark">Notifications</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-medium text-sm">Notifications par email</p>
                <p className="text-xs text-gray-500">Recevoir des emails pour les mises à jour importantes</p>
              </div>
            </div>
            <Switch checked={emailNotif} onChange={setEmailNotif} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-medium text-sm">Nouveaux messages</p>
                <p className="text-xs text-gray-500">Être notifié à chaque nouveau message reçu</p>
              </div>
            </div>
            <Switch checked={messageNotif} onChange={setMessageNotif} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-medium text-sm">Candidatures</p>
                <p className="text-xs text-gray-500">
                  {user.role === 'manager' ? 'Recevoir les nouvelles candidatures' : 'Suivi de vos candidatures'}
                </p>
              </div>
            </div>
            <Switch checked={candidatureNotif} onChange={setCandidatureNotif} />
          </div>

          <button
            onClick={saveNotifications}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-brand-dark text-white rounded-lg text-sm font-medium hover:bg-brand-dark/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? 'Sauvegardé !' : 'Sauvegarder'}
          </button>
        </CardContent>
      </Card>

      {/* Zone dangereuse */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-red-600 flex items-center gap-2">
            <Trash2 className="w-5 h-5" /> Zone dangereuse
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            La suppression de votre compte est irréversible. Toutes vos données, offres et candidatures seront perdues.
          </p>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Tapez <span className="font-bold text-red-600">SUPPRIMER</span> pour confirmer
            </label>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
            />
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== 'SUPPRIMER' || deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Supprimer définitivement mon compte
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
