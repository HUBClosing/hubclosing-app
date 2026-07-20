import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { Card, CardContent, Badge, Button, Avatar } from '@/components/ui';
import { notFound } from 'next/navigation';
import {
  DollarSign, Users, Clock, ExternalLink, MapPin, Percent,
  Banknote, Briefcase, Target, Repeat, CalendarCheck, Clock4,
  ArrowLeft, Crown, Zap, Timer, AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { OfferType } from '@/types/database';
import { isOfferPremium, APPLICATION_STATUS_CONFIG } from '@/types/database';

const OFFER_TYPE_LABELS: Record<OfferType, { label: string; color: string; icon: typeof Target }> = {
  challenge: { label: 'Challenge', color: 'bg-violet-100 text-violet-700', icon: Target },
  recurring: { label: 'Récurrent', color: 'bg-teal-100 text-teal-700', icon: Repeat },
  mission: { label: 'Mission', color: 'bg-sky-100 text-sky-700', icon: Briefcase },
  full_time: { label: 'Temps plein', color: 'bg-indigo-100 text-indigo-700', icon: CalendarCheck },
  part_time: { label: 'Temps partiel', color: 'bg-amber-100 text-amber-700', icon: Clock4 },
  commission_only: { label: 'Commission seule', color: 'bg-emerald-100 text-emerald-700', icon: Percent },
};

export default async function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: offer } = await supabase
    .from('offers')
    .select('*, manager:users!manager_id(id, full_name, avatar_url, role_type)')
    .eq('id', id)
    .single();

  if (!offer) notFound();

  const { data: existingApp } = await supabase
    .from('applications')
    .select('id, status')
    .eq('offer_id', id)
    .eq('closer_id', user.id)
    .maybeSingle();

  const isPremium = isOfferPremium(offer);
  const timeAgo = formatDistanceToNow(new Date(offer.created_at), { addSuffix: true, locale: fr });
  const typeConfig = offer.offer_type ? OFFER_TYPE_LABELS[offer.offer_type as OfferType] : null;
  const TypeIcon = typeConfig?.icon || Briefcase;

  // Deadline info
  const deadline = offer.application_deadline ? new Date(offer.application_deadline) : null;
  const daysLeft = deadline ? differenceInDays(deadline, new Date()) : null;

  // Show apply button for candidates who haven't applied yet
  const canApply = (user.role_type === 'candidate' || user.role_type === 'both')
    && user.active_role === 'candidate'
    && offer.status === 'active'
    && !existingApp;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <a href="/dashboard/marketplace" className="text-sm text-brand-green hover:underline flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Retour à la marketplace
        </a>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {typeConfig && (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${typeConfig.color}`}>
                    <TypeIcon className="h-3 w-3" />
                    {typeConfig.label}
                  </span>
                )}
                {isPremium && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 bg-brand-amber/10 text-brand-amber">
                    <Crown className="h-3 w-3" /> Premium
                  </span>
                )}
                {offer.is_boosted && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 bg-brand-amber text-white">
                    <Zap className="h-3 w-3" /> Mise en avant
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-brand-dark">{offer.title}</h1>
              <div className="flex items-center gap-3">
                <Avatar src={offer.manager?.avatar_url} fallback={offer.manager?.full_name || ''} size="sm" />
                <span className="text-gray-600">{offer.manager?.full_name || 'Recruteur'}</span>
              </div>
            </div>
            <Badge variant={offer.status === 'active' ? 'success' : 'warning'}>
              {offer.status === 'active' ? 'Active' : offer.status === 'paused' ? 'En pause' : 'Fermée'}
            </Badge>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {offer.commission_rate && (
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <Percent className="h-5 w-5 mx-auto text-green-600 mb-1" />
                <p className="text-xs text-gray-500">Commission</p>
                <p className="font-bold text-green-700">{offer.commission_rate}%</p>
              </div>
            )}
            {offer.fixed_salary && (
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <Banknote className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                <p className="text-xs text-gray-500">Fixe</p>
                <p className="font-bold text-blue-700">{offer.fixed_salary.toLocaleString('fr-FR')}€</p>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Users className="h-5 w-5 mx-auto text-brand-green mb-1" />
              <p className="text-xs text-gray-500">Candidatures</p>
              <p className="font-semibold">{offer.application_count || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Clock className="h-5 w-5 mx-auto text-brand-green mb-1" />
              <p className="text-xs text-gray-500">Publié</p>
              <p className="font-semibold text-sm">{timeAgo}</p>
            </div>
          </div>

          {/* Deadline + places */}
          {(deadline || offer.max_applicants) && (
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              daysLeft !== null && daysLeft <= 3
                ? 'bg-orange-50 border-orange-200'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <Timer className={`h-4 w-4 shrink-0 ${
                daysLeft !== null && daysLeft <= 3 ? 'text-orange-500' : 'text-blue-500'
              }`} />
              <div className="flex-1 text-sm">
                {deadline && (
                  <span className={daysLeft !== null && daysLeft <= 3 ? 'text-orange-700 font-medium' : 'text-blue-700'}>
                    Date limite : {format(deadline, 'd MMMM yyyy', { locale: fr })}
                    {daysLeft !== null && daysLeft >= 0 && (
                      <span className="font-normal opacity-75"> ({daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''})</span>
                    )}
                    {daysLeft !== null && daysLeft < 0 && (
                      <span className="text-red-600 font-medium"> (expiré)</span>
                    )}
                  </span>
                )}
              </div>
              {offer.max_applicants && (
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {offer.max_applicants} places max
                </span>
              )}
            </div>
          )}

          {/* Details section */}
          <div className="space-y-4">
            {/* Niche + location + product */}
            <div className="flex flex-wrap gap-2">
              {offer.niche && (
                <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium">
                  {offer.niche}
                </span>
              )}
              {offer.location && (
                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {offer.location}
                </span>
              )}
              {offer.product_price_range && (
                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                  Produit : {offer.product_price_range}
                </span>
              )}
            </div>

            {/* Skills + experience */}
            {(offer.required_skills?.length > 0 || offer.required_experience) && (
              <div className="flex flex-wrap gap-2">
                {offer.required_skills?.map((skill: string) => (
                  <span key={skill} className="text-xs bg-brand-green/10 text-brand-green px-2.5 py-1 rounded-full capitalize font-medium">
                    {skill}
                  </span>
                ))}
                {offer.required_experience && (
                  <span className="text-xs bg-brand-amber/10 text-brand-amber px-2.5 py-1 rounded-full capitalize font-medium">
                    {offer.required_experience}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-brand-dark mb-2">Description</h3>
            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{offer.description}</p>
          </div>

          {/* CTA */}
          {(user.role_type === 'candidate' || user.role_type === 'both') && user.active_role === 'candidate' && offer.status === 'active' && (
            <div className="pt-4 border-t">
              {existingApp ? (
                <div className="text-center space-y-1">
                  <Badge variant={
                    existingApp.status === 'accepted' || existingApp.status === 'completed' ? 'success' :
                    existingApp.status === 'rejected' ? 'error' : 'warning'
                  }>
                    {APPLICATION_STATUS_CONFIG[existingApp.status as keyof typeof APPLICATION_STATUS_CONFIG]?.label || existingApp.status}
                  </Badge>
                  <p className="text-xs text-gray-400">
                    {APPLICATION_STATUS_CONFIG[existingApp.status as keyof typeof APPLICATION_STATUS_CONFIG]?.description}
                  </p>
                </div>
              ) : (
                <a href={`/dashboard/marketplace/${offer.id}/apply`} className="block">
                  <Button className="w-full">Postuler à cette offre</Button>
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
