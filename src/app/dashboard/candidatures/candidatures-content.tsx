'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Application, User, ApplicationStatus, OfferType } from '@/types/database';
import { APPLICATION_STATUS_CONFIG } from '@/types/database';
import { Card, CardContent, Badge, Button, EmptyState } from '@/components/ui';
import {
  FileText, Clock, CheckCircle, XCircle, Eye, ArrowRight,
  Undo2, Star, MessageSquare, Briefcase, Target, Repeat,
  CalendarCheck, Clock4, Percent, MapPin, Crown, AlertTriangle,
  Inbox, Filter, ChevronDown,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================================
// Types
// ============================================================

interface CandidaturesContentProps {
  applications: (Application & { offer?: any })[];
  user: User;
}

type TabKey = 'all' | ApplicationStatus;

const TABS: { key: TabKey; label: string; icon: typeof Inbox }[] = [
  { key: 'all', label: 'Toutes', icon: Inbox },
  { key: 'pending', label: 'En attente', icon: Clock },
  { key: 'reviewing', label: 'À l\'étude', icon: Eye },
  { key: 'accepted', label: 'Acceptées', icon: CheckCircle },
  { key: 'completed', label: 'Terminées', icon: Star },
  { key: 'rejected', label: 'Refusées', icon: XCircle },
  { key: 'withdrawn', label: 'Retirées', icon: Undo2 },
];

const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  challenge: 'Challenge',
  recurring: 'Récurrent',
  mission: 'Mission',
  full_time: 'Temps plein',
  part_time: 'Temps partiel',
  commission_only: 'Commission',
};

const STATUS_BADGE_VARIANT: Record<ApplicationStatus, 'warning' | 'success' | 'error' | 'default' | 'info'> = {
  pending: 'warning',
  reviewing: 'info',
  accepted: 'success',
  rejected: 'error',
  withdrawn: 'default',
  completed: 'success',
};

// ============================================================
// Component
// ============================================================

export function CandidaturesContent({ applications, user }: CandidaturesContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState<string | null>(null);

  const filtered = activeTab === 'all'
    ? applications
    : applications.filter(a => a.status === activeTab);

  // Count per status
  const counts: Record<TabKey, number> = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewing: applications.filter(a => a.status === 'reviewing').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    completed: applications.filter(a => a.status === 'completed').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    withdrawn: applications.filter(a => a.status === 'withdrawn').length,
  };

  const handleWithdraw = async (applicationId: string) => {
    setWithdrawingId(applicationId);
    try {
      const res = await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId, status: 'withdrawn' }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Erreur lors du retrait');
      } else {
        router.refresh();
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setWithdrawingId(null);
      setConfirmWithdraw(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const count = counts[tab.key];
          if (tab.key !== 'all' && count === 0) return null; // Hide empty tabs
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-brand-dark text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Applications list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title={activeTab === 'all' ? 'Aucune candidature' : `Aucune candidature ${TABS.find(t => t.key === activeTab)?.label.toLowerCase() || ''}`}
          description={activeTab === 'all'
            ? 'Parcourez la marketplace pour postuler à des offres.'
            : 'Changez de filtre pour voir vos autres candidatures.'}
          action={activeTab === 'all' ? (
            <a href="/dashboard/marketplace" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-dark transition-colors text-sm font-medium">
              Voir la marketplace <ArrowRight className="h-4 w-4" />
            </a>
          ) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              isWithdrawing={withdrawingId === app.id}
              showConfirm={confirmWithdraw === app.id}
              onConfirmWithdraw={() => setConfirmWithdraw(app.id)}
              onCancelWithdraw={() => setConfirmWithdraw(null)}
              onWithdraw={() => handleWithdraw(app.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Application Card
// ============================================================

interface ApplicationCardProps {
  application: Application & { offer?: any };
  isWithdrawing: boolean;
  showConfirm: boolean;
  onConfirmWithdraw: () => void;
  onCancelWithdraw: () => void;
  onWithdraw: () => void;
}

function ApplicationCard({
  application: app,
  isWithdrawing,
  showConfirm,
  onConfirmWithdraw,
  onCancelWithdraw,
  onWithdraw,
}: ApplicationCardProps) {
  const offer = app.offer;
  const statusConfig = APPLICATION_STATUS_CONFIG[app.status as ApplicationStatus];
  const canWithdraw = app.status === 'pending' || app.status === 'reviewing';
  const canReview = app.status === 'completed';
  const timeAgo = formatDistanceToNow(new Date(app.created_at), { addSuffix: true, locale: fr });

  return (
    <Card>
      <CardContent className="p-0">
        {/* Status bar */}
        <div className={`px-4 py-2 flex items-center justify-between border-b ${
          app.status === 'accepted' || app.status === 'completed' ? 'bg-green-50 border-green-100' :
          app.status === 'rejected' ? 'bg-red-50 border-red-100' :
          app.status === 'reviewing' ? 'bg-blue-50 border-blue-100' :
          app.status === 'withdrawn' ? 'bg-gray-50 border-gray-100' :
          'bg-amber-50 border-amber-100'
        }`}>
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_BADGE_VARIANT[app.status as ApplicationStatus]}>
              {statusConfig?.label || app.status}
            </Badge>
            <span className="text-xs text-gray-400">{timeAgo}</span>
          </div>
          {app.updated_at && app.updated_at !== app.created_at && (
            <span className="text-xs text-gray-400">
              Mis à jour {formatDistanceToNow(new Date(app.updated_at), { addSuffix: true, locale: fr })}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Offer info */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-brand-dark text-base truncate">
                {offer?.title || 'Offre supprimée'}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                {offer?.manager?.full_name && (
                  <span>par {offer.manager.full_name}</span>
                )}
                {offer?.niche && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{offer.niche}</span>
                  </>
                )}
              </div>
            </div>

            {/* Offer status */}
            {offer?.status && offer.status !== 'active' && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                offer.status === 'closed' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
              }`}>
                Offre {offer.status === 'closed' ? 'fermée' : 'en pause'}
              </span>
            )}
          </div>

          {/* Metrics row */}
          <div className="flex items-center gap-3 flex-wrap">
            {offer?.commission_rate && (
              <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-lg font-medium">
                <Percent className="h-3 w-3" /> {offer.commission_rate}%
              </span>
            )}
            {offer?.fixed_salary && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium">
                {offer.fixed_salary.toLocaleString('fr-FR')}€ fixe
              </span>
            )}
            {offer?.offer_type && OFFER_TYPE_LABELS[offer.offer_type as OfferType] && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {OFFER_TYPE_LABELS[offer.offer_type as OfferType]}
              </span>
            )}
            {offer?.location && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3" /> {offer.location}
              </span>
            )}
          </div>

          {/* Cover letter preview */}
          {app.cover_letter && (
            <p className="text-sm text-gray-500 line-clamp-2 italic border-l-2 border-gray-200 pl-3">
              {app.cover_letter}
            </p>
          )}

          {/* Status description */}
          {statusConfig?.description && (
            <p className="text-xs text-gray-400">{statusConfig.description}</p>
          )}

          {/* Withdraw confirmation */}
          {showConfirm && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-800 font-medium">Retirer cette candidature ?</p>
                <p className="text-xs text-amber-600 mt-0.5">Cette action est irréversible. Le recruteur sera notifié.</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={onWithdraw}
                    disabled={isWithdrawing}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isWithdrawing ? 'Retrait...' : 'Confirmer le retrait'}
                  </button>
                  <button
                    onClick={onCancelWithdraw}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {/* View offer */}
            {offer?.id && (
              <a
                href={`/dashboard/marketplace/${offer.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-brand-dark bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
              >
                <Eye className="h-3.5 w-3.5" /> Voir l&apos;offre
              </a>
            )}

            {/* Withdraw */}
            {canWithdraw && !showConfirm && (
              <button
                onClick={onConfirmWithdraw}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
              >
                <Undo2 className="h-3.5 w-3.5" /> Retirer
              </button>
            )}

            {/* Leave review */}
            {canReview && app.offer_id && (
              <a
                href={`/dashboard/reviews/${app.id}/new`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-brand-amber hover:bg-brand-amber/90 rounded-lg transition-colors"
              >
                <Star className="h-3.5 w-3.5" /> Laisser un avis
              </a>
            )}

            {/* Fill questionnaire (if pending and offer has questionnaire) */}
            {(app.status === 'pending' || app.status === 'reviewing') && offer?.questionnaire_id && offer?.id && (
              <a
                href={`/dashboard/marketplace/${offer.id}/apply`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
              >
                <FileText className="h-3.5 w-3.5" /> Questionnaire
              </a>
            )}

            {/* Message recruiter (if accepted) */}
            {app.status === 'accepted' && (
              <a
                href="/dashboard/messages"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-brand-green bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Message
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
