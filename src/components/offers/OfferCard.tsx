'use client';

import type { Offer, User } from '@/types/database';
import { Lock, MapPin, Clock, Percent, Banknote, Eye, Zap, Crown, ArrowRight, Timer, AlertTriangle, Users } from 'lucide-react';
import { formatDistanceToNow, differenceInDays, differenceInHours, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { canUserDo, isOfferPremium } from '@/types/database';

interface OfferCardProps {
  offer: Offer;
  user: User;
  locked?: boolean;
}

const nicheColors: Record<string, string> = {
  'Immobilier': 'bg-blue-100 text-blue-700',
  'Bourse / Trading': 'bg-purple-100 text-purple-700',
  'Crypto / Blockchain': 'bg-orange-100 text-orange-700',
  'Coaching / Développement personnel': 'bg-green-100 text-green-700',
  'E-commerce / Dropshipping': 'bg-pink-100 text-pink-700',
  'Marketing digital': 'bg-cyan-100 text-cyan-700',
  'Santé / Bien-être': 'bg-emerald-100 text-emerald-700',
  'Finance / Investissement': 'bg-indigo-100 text-indigo-700',
  'Formation professionnelle': 'bg-amber-100 text-amber-700',
};

export function OfferCard({ offer, user, locked = false }: OfferCardProps) {
  const isPremium = isOfferPremium(offer);
  const isLocked = locked || (isPremium && !canUserDo(user, 'see_premium_offers'));
  const timeAgo = formatDistanceToNow(new Date(offer.created_at), { addSuffix: true, locale: fr });
  const nicheColor = nicheColors[offer.niche || ''] || 'bg-gray-100 text-gray-700';

  // Vues dynamiques : base BDD + bonus progressif basé sur le temps
  const hoursLive = Math.max(0, differenceInHours(new Date(), new Date(offer.created_at)));
  const viewBoost = Math.floor(hoursLive * (offer.is_boosted ? 1.8 : 0.7) + Math.sin(hoursLive * 0.3) * 5);
  const displayViews = (offer.views_count || 0) + viewBoost;

  return (
    <div className={`relative bg-white rounded-xl border overflow-hidden transition-all hover:shadow-md ${
      offer.is_boosted ? 'border-brand-amber shadow-sm ring-1 ring-brand-amber/20' : 'border-gray-200'
    }`}>
      {/* Boosted badge */}
      {offer.is_boosted && (
        <div className="bg-brand-amber text-white text-xs font-medium px-3 py-1 flex items-center gap-1 justify-center">
          <Zap className="h-3 w-3" /> Offre mise en avant
        </div>
      )}

      <div className="p-4">
        {/* Top: niche + time */}
        <div className="flex items-center justify-between mb-3">
          {offer.niche && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${nicheColor}`}>
              {offer.niche}
            </span>
          )}
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="h-3 w-3" /> {timeAgo}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-brand-dark text-base leading-tight mb-2">
          {isLocked ? blurTitle(offer.title) : offer.title}
        </h3>

        {/* Recruteur */}
        {offer.manager && !isLocked && (
          <p className="text-xs text-gray-500 mb-3">par {offer.manager.full_name || 'Recruteur'}</p>
        )}
        {isLocked && (
          <p className="text-xs text-gray-400 mb-3">par ••••••••</p>
        )}

        {/* Key metrics bar */}
        <div className="flex items-center gap-3 mb-3">
          {offer.commission_rate && (
            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1.5 rounded-lg">
              <Percent className="h-3.5 w-3.5" />
              <span className="text-sm font-semibold">{offer.commission_rate}%</span>
            </div>
          )}
          {offer.fixed_salary && (
            <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-lg">
              <Banknote className="h-3.5 w-3.5" />
              <span className="text-sm font-semibold">{offer.fixed_salary.toLocaleString()}€</span>
            </div>
          )}
          {offer.product_price_range && !isLocked && (
            <div className="text-xs text-gray-500">
              Produit : {offer.product_price_range}
            </div>
          )}
        </div>

        {/* Teaser description */}
        <p className={`text-sm text-gray-600 mb-3 line-clamp-2 ${isLocked ? 'select-none' : ''}`}>
          {isLocked ? blurDescription(offer.description) : offer.description}
        </p>

        {/* Tags */}
        {!isLocked && offer.required_skills && offer.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {offer.required_skills.map((skill) => (
              <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                {skill}
              </span>
            ))}
            {offer.required_experience && (
              <span className="text-xs bg-brand-amber/10 text-brand-amber px-2 py-0.5 rounded-full capitalize">
                {offer.required_experience}
              </span>
            )}
          </div>
        )}

        {/* Location + views */}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
          {offer.location && (
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {offer.location}</span>
          )}
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {displayViews} vues</span>
        </div>

        {/* Deadline + places */}
        {!isLocked && <DeadlineBadge offer={offer} />}

        {/* Premium badge */}
        {isPremium && !isLocked && (
          <div className="flex items-center gap-1.5 text-xs text-brand-amber bg-brand-amber/10 px-2.5 py-1 rounded-lg mb-3 w-fit">
            <Crown className="h-3.5 w-3.5" /> Offre Premium
          </div>
        )}

        {/* CTA */}
        {isLocked ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
            <Lock className="h-5 w-5 text-gray-400 mx-auto mb-1.5" />
            <p className="text-xs text-gray-500 mb-2">Offre réservée aux abonnés</p>
            <a
              href="/dashboard/subscription"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-amber hover:bg-brand-amber/90 px-4 py-2 rounded-lg transition-colors"
            >
              <Lock className="h-3 w-3" /> Débloquer les offres Premium
            </a>
          </div>
        ) : (
          <a
            href={`/dashboard/marketplace/${offer.id}`}
            className="flex items-center justify-center gap-2 w-full text-sm font-medium text-brand-dark bg-gray-50 hover:bg-gray-100 border border-gray-200 px-4 py-2.5 rounded-lg transition-colors"
          >
            Voir les détails <ArrowRight className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}

/** Badge deadline + places restantes */
function DeadlineBadge({ offer }: { offer: Offer }) {
  const hasDeadline = !!offer.application_deadline;
  const hasMaxApplicants = !!offer.max_applicants;

  if (!hasDeadline && !hasMaxApplicants) return null;

  const now = new Date();
  const deadline = hasDeadline ? new Date(offer.application_deadline!) : null;
  const isExpired = deadline ? deadline < now : false;
  const daysLeft = deadline ? differenceInDays(deadline, now) : null;
  const hoursLeft = deadline ? differenceInHours(deadline, now) : null;

  // Couleur selon urgence
  const isUrgent = daysLeft !== null && daysLeft <= 3;
  const isSoon = daysLeft !== null && daysLeft <= 7;

  const bgColor = isExpired ? 'bg-red-50 border-red-200' :
    isUrgent ? 'bg-orange-50 border-orange-200' :
    isSoon ? 'bg-amber-50 border-amber-200' :
    'bg-blue-50 border-blue-200';

  const textColor = isExpired ? 'text-red-700' :
    isUrgent ? 'text-orange-700' :
    isSoon ? 'text-amber-700' :
    'text-blue-700';

  const iconColor = isExpired ? 'text-red-500' :
    isUrgent ? 'text-orange-500' :
    isSoon ? 'text-amber-500' :
    'text-blue-500';

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg border mb-3 ${bgColor}`}>
      {isExpired ? (
        <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} />
      ) : (
        <Timer className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} />
      )}
      <div className={`flex-1 text-xs font-medium ${textColor}`}>
        {isExpired ? (
          'Candidatures fermées'
        ) : hoursLeft !== null && hoursLeft < 24 ? (
          `Plus que ${hoursLeft}h pour candidater`
        ) : daysLeft !== null ? (
          `Plus que ${daysLeft} jour${daysLeft > 1 ? 's' : ''} pour candidater`
        ) : null}
        {hasDeadline && !isExpired && deadline && (
          <span className="font-normal text-xs opacity-75 ml-1">
            — Fin le {format(deadline, 'd MMM', { locale: fr })}
          </span>
        )}
      </div>
      {hasMaxApplicants && (
        <span className={`flex items-center gap-1 text-xs ${textColor} opacity-80`}>
          <Users className="h-3 w-3" />
          {offer.max_applicants} places
        </span>
      )}
    </div>
  );
}

/** Masque partiellement le titre pour les offres verrouillées */
function blurTitle(title: string): string {
  const words = title.split(' ');
  if (words.length <= 3) return words[0] + ' •••••• ••••';
  return words.slice(0, 3).join(' ') + ' •••••• ••••';
}

/** Masque la description pour les offres verrouillées — montre juste le début */
function blurDescription(desc: string): string {
  const firstSentence = desc.split(/[.\n]/)[0];
  if (firstSentence.length > 80) return firstSentence.substring(0, 80) + '... 🔒';
  return firstSentence + '... 🔒';
}
