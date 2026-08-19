'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import type { User, SubscriptionTier } from '@/types/database';
import { TIER_PRICES } from '@/types/database';
import { Card, CardContent, CardHeader, Switch } from '@/components/ui';
import {
  Save, Loader2, Trash2, Bell, Mail, MessageSquare,
  Crown, ArrowRight, CheckCircle2, Shield, Star, Trophy, Gem,
  CreditCard, Calendar, Briefcase, Settings, UserCircle, Webhook,
} from 'lucide-react';

const TIER_LABELS: Record<SubscriptionTier, { label: string; color: string; icon: typeof Shield }> = {
  free: { label: 'Gratuit', color: 'bg-gray-100 text-gray-700', icon: Shield },
  starter: { label: 'Starter', color: 'bg-blue-100 text-blue-700', icon: Star },
  pro: { label: 'Pro', color: 'bg-purple-100 text-purple-700', icon: Trophy },
  elite: { label: 'Elite', color: 'bg-amber-100 text-amber-700', icon: Crown },
  solo: { label: 'Solo', color: 'bg-green-100 text-green-700', icon: Briefcase },
  equipe: { label: 'Équipe', color: 'bg-teal-100 text-teal-700', icon: Briefcase },
  campagne: { label: 'Campagne', color: 'bg-cyan-100 text-cyan-700', icon: Briefcase },
  agency: { label: 'Agence', color: 'bg-indigo-100 text-indigo-700', icon: Gem },
};

interface SettingsContentProps {
  user: User;
}

export function SettingsContent({ user }: SettingsContentProps) {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ── Notifications state ──
  const [emailNotif, setEmailNotif] = useState(true);
  const [messageNotif, setMessageNotif] = useState(true);
  const [candidatureNotif, setCandidatureNotif] = useState(true);

  // ── UI state ──
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const isRecruiter = user.role_type === 'recruiter' || user.role_type === 'both' || user.role_type === 'admin';

  const tierConfig = TIER_LABELS[user.tier] || TIER_LABELS.free;
  const TierIcon = tierConfig.icon;

  const saveNotifications = async () => {
    setSavingNotif(true);
    await supabase.auth.updateUser({
      data: {
        notifications: {
          email: emailNotif,
          messages: messageNotif,
          candidatures: candidatureNotif,
        },
      },
    });
    setSavingNotif(false);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'SUPPRIMER') return;
    setDeleting(true);
    await supabase
      .from('users')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">Paramètres</h1>

      {/* ═══════ LIEN VERS LE PROFIL ═══════ */}
      <a
        href="/dashboard/profile"
        className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-brand-green hover:shadow-md transition-all group"
      >
        <div className="h-10 w-10 rounded-lg bg-brand-green/10 flex items-center justify-center">
          <UserCircle className="h-5 w-5 text-brand-green" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-brand-dark group-hover:text-brand-green transition-colors">Mon profil</p>
          <p className="text-sm text-gray-500">Modifier vos informations personnelles, compétences et liens</p>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-brand-green transition-colors" />
      </a>

      {/* ═══════ ABONNEMENT ═══════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-dark" />
            <h2 className="font-semibold text-brand-dark">Abonnement</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tierConfig.color}`}>
                <TierIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-brand-dark">Plan {tierConfig.label}</p>
                <p className="text-sm text-gray-500">
                  {TIER_PRICES[user.tier as keyof typeof TIER_PRICES] === 0
                    ? 'Gratuit'
                    : `${TIER_PRICES[user.tier as keyof typeof TIER_PRICES]}€/mois`}
                </p>
              </div>
            </div>
            {user.tier !== 'elite' && user.tier !== 'agency' && (
              <a
                href="/dashboard/subscription"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-amber text-white rounded-lg text-sm font-medium hover:bg-brand-amber/90 transition-colors"
              >
                <Crown className="h-4 w-4" /> Upgrader
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          {(user.tier_expires_at || user.subscription_period_end) && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              Renouvellement : {new Date(user.subscription_period_end || user.tier_expires_at || '').toLocaleDateString('fr-FR')}
            </div>
          )}
          {user.stripe_subscription_id && (
            <button
              onClick={async () => {
                const res = await fetch('/api/stripe/portal', { method: 'POST' });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-dark border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <CreditCard className="h-4 w-4" /> Gérer facturation &amp; paiement
            </button>
          )}
        </CardContent>
      </Card>

      {/* ═══════ NOTIFICATIONS ═══════ */}
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
                  {isRecruiter ? 'Recevoir les nouvelles candidatures' : 'Suivi de vos candidatures'}
                </p>
              </div>
            </div>
            <Switch checked={candidatureNotif} onChange={setCandidatureNotif} />
          </div>

          <button
            onClick={saveNotifications}
            disabled={savingNotif}
            className="flex items-center gap-2 px-4 py-2 bg-brand-dark text-white rounded-lg text-sm font-medium hover:bg-brand-dark/90 transition-colors disabled:opacity-50"
          >
            {savingNotif ? <Loader2 className="w-4 h-4 animate-spin" /> : notifSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {notifSaved ? 'Sauvegardé !' : 'Sauvegarder'}
          </button>
        </CardContent>
      </Card>

      {/* ═══════ CONNEXIONS CRM (recruteurs) ═══════ */}
      {isRecruiter && (
        <a
          href="/dashboard/settings/webhooks"
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-brand-green hover:shadow-md transition-all group"
        >
          <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <Webhook className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-brand-dark group-hover:text-brand-green transition-colors">Connexion CRM</p>
            <p className="text-sm text-gray-500">Synchroniser vos données avec GoHighLevel, HubSpot, Airtable...</p>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-brand-green transition-colors" />
        </a>
      )}

      {/* ═══════ ZONE DANGEREUSE ═══════ */}
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
