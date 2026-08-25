// ============================================================
// Types HUBClosing — Modèle flexible avec tarification
// ============================================================

// --- Enums ---

/** Rôle principal : candidat, recruteur, les deux, ou admin */
export type RoleType = 'pending' | 'candidate' | 'recruiter' | 'both' | 'admin';

/** Rôle actif dans le dashboard (pour les utilisateurs double-rôle) */
export type ActiveRole = 'candidate' | 'recruiter';

/** Ancien rôle — gardé pour rétrocompatibilité pendant la migration */
export type UserRole = 'closer' | 'manager' | 'admin' | 'pending';

/** Compétences qu'un candidat peut cocher */
export type Skill = 'closing' | 'setting' | 'management' | 'hos' | 'coaching' | 'training';

/** Tier d'abonnement (candidats: free→starter→pro→elite, recruteurs: solo→equipe→campagne→agence) */
export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'elite' | 'solo' | 'equipe' | 'campagne' | 'agency';

/** Pack recruteur (sous-ensemble de SubscriptionTier) */
export type RecruiterPack = 'solo' | 'equipe' | 'campagne' | 'agency';

/** Add-ons recruteur achetables à l'unité */
export type RecruiterAddon = 'deblocage_1' | 'deblocage_5' | 'boost' | 'annonce_sup';

/** Tiers one-time (paiement unique) vs subscription */
export const ONE_TIME_TIERS = new Set<string>(['solo', 'equipe', 'campagne', 'deblocage_1', 'deblocage_5', 'boost', 'annonce_sup']);
export const SUBSCRIPTION_TIERS = new Set<string>(['starter', 'pro', 'elite', 'agency']);

/** Ancien plan — rétrocompatibilité */
export type SubscriptionPlan = 'free' | 'pro' | 'premium';

export type OfferStatus = 'active' | 'paused' | 'closed';
export type ApplicationStatus = 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'withdrawn' | 'completed';
export type ExperienceLevel = 'junior' | 'intermediaire' | 'senior' | 'expert';
export type BadgeLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type CompanySize = 'solo' | 'small' | 'medium' | 'large';
export type StripeSubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing' | 'inactive';

// --- Limites par tier ---

export const TIER_LIMITS = {
// --- Candidats (chaque tier inclut tout le tier inférieur) ---
free: {
// Candidat
applications_per_month: 3,
can_see_premium: false,
has_tracker: false,
has_cv_performance: false,
has_reputation_score: false,
has_badge: false,
has_matching: false,
has_masterclass: false,
has_replays: false,
has_upskill: false,
has_accounting: false,
has_direct_contact: false,
// Recruteur — accès gratuit limité
annonces: 1, offer_duration_days: 30, deblocages_included: 3,
boosts_included: 0, has_smart_sourcing: true, has_questionnaire: false,
has_guarantee: false, has_analytics: false, is_subscription: false,
},
starter: {
applications_per_month: 6,
can_see_premium: false,
has_tracker: true,
has_cv_performance: true,
has_reputation_score: true,
has_badge: false,
has_matching: false,
has_masterclass: false,
has_replays: false,
has_upskill: false,
has_accounting: false,
has_direct_contact: false,
},
pro: {
applications_per_month: 15,
can_see_premium: true,
has_tracker: true,
has_cv_performance: true,
has_reputation_score: true,
has_badge: true,
has_matching: true,
has_masterclass: true,
has_replays: true,
has_upskill: false,
has_accounting: false,
has_direct_contact: false,
},
elite: {
applications_per_month: Infinity,
can_see_premium: true,
has_tracker: true,
has_cv_performance: true,
has_reputation_score: true,
has_badge: true,
has_matching: true,
has_masterclass: true,
has_replays: true,
has_upskill: true,
has_accounting: true,
has_direct_contact: true,
},
// --- Recruteurs — Packs all-in-one ---
solo: {
annonces: 1, offer_duration_days: 60, deblocages_included: 5,
boosts_included: 1, has_smart_sourcing: true, has_questionnaire: true,
has_guarantee: true, has_analytics: false, is_subscription: false,
},
equipe: {
annonces: 1, offer_duration_days: 90, deblocages_included: 10,
boosts_included: 2, has_smart_sourcing: true, has_questionnaire: true,
has_guarantee: true, has_analytics: false, is_subscription: false,
},
campagne: {
annonces: 1, offer_duration_days: 120, deblocages_included: 20,
boosts_included: 5, has_smart_sourcing: true, has_questionnaire: true,
has_guarantee: true, has_analytics: true, is_subscription: false,
},
agency: {
annonces: Infinity, offer_duration_days: Infinity, deblocages_included: 50,
boosts_included: 10, has_smart_sourcing: true, has_questionnaire: true,
has_guarantee: true, has_analytics: true, is_subscription: true,
},
} as const;

export const TIER_PRICES = {
free: 0,
starter: 9,
pro: 19,
elite: 39,
// Recruteurs — packs
solo: 49,
equipe: 79,
campagne: 129,
agency: 199,
} as const;

/** Prix des add-ons recruteur (one-time) */
export const RECRUITER_ADDON_PRICES = {
deblocage_1: 12,
deblocage_5: 49,
boost: 9,
annonce_sup: 29,
} as const;

/** Crédits ajoutés par chaque add-on */
export const RECRUITER_ADDON_CREDITS: Record<RecruiterAddon, { deblocages: number; boosts: number; annonces: number }> = {
deblocage_1: { deblocages: 1, boosts: 0, annonces: 0 },
deblocage_5: { deblocages: 5, boosts: 0, annonces: 0 },
boost: { deblocages: 0, boosts: 1, annonces: 0 },
annonce_sup: { deblocages: 0, boosts: 0, annonces: 1 },
};

// --- Interfaces principales ---

export interface User {
id: string;
email: string;
role: UserRole;
role_type: RoleType;
active_role: ActiveRole;
full_name: string | null;
avatar_url: string | null;
phone: string | null;
personal_email: string | null;
years_experience: number | null;
niches: string[] | null;
skills: Skill[];
infopreneur_type: string | null;
training_center: string | null;
is_employed: boolean;
languages: string[];
loom_url: string | null;
sub_role: string | null;
subscription_plan: SubscriptionPlan;
tier: SubscriptionTier;
stripe_customer_id: string | null;
stripe_subscription_id: string | null;
subscription_status: StripeSubscriptionStatus;
subscription_period_end: string | null;
tier_expires_at: string | null;
referral_code: string | null;
referred_by: string | null;
monthly_applications_count: number;
monthly_applications_reset_at: string;
monthly_contacts_count: number;
monthly_contacts_reset_at: string;
recruiter_annonces_remaining: number;
recruiter_deblocages_remaining: number;
recruiter_boosts_remaining: number;
recruiter_pack_purchased_at: string | null;
notif_offers: 'all' | 'filtered' | 'none';
notif_offer_niches: string[];
notif_offer_types: string[];
is_active: boolean;
is_onboarded: boolean;
created_at: string;
updated_at: string;
}

export const TRAINING_CENTER_OPTIONS = [
'Aucune formation',
'Closers Group',
'Best Closer',
'CGM ELITE',
'Closer Mastery',
'Navy Sales',
'Sales Influence',
'Striker',
'Ossama Rhamri',
'Cole Gordon',
'Momentum',
'Mon Closer',
'Closer Evolution',
] as const;

export const EVENT_TYPE_OPTIONS = [
'Webinaire',
'Masterclass',
'Call 1-to-1',
'Workshop',
'Lancement',
'Séminaire',
'Autre',
] as const;

export interface PerformanceRecord {
id: string;
user_id: string;
event_name: string;
event_type: string;
event_date: string;
calls_scheduled: number;
calls_completed: number;
revenue_collected: number;
revenue_invoiced: number;
no_shows: number;
cancellations: number;
hos_name: string;
hos_email: string | null;
is_verified: boolean;
verified_at: string | null;
verified_by: string | null;
verifier_name: string | null;
validation_token: string | null;
validation_token_expires_at: string | null;
notes: string | null;
created_at: string;
updated_at: string;
}

export interface Profile {
id: string;
user_id: string;
bio: string | null;
linkedin_url: string | null;
portfolio_url: string | null;
website_url: string | null;
experience_level: ExperienceLevel | null;
specialties: string[];
hourly_rate: number | null;
commission_rate: number | null;
availability: boolean;
available_hours_per_week: number | null;
preferred_niches: string[];
company_name: string | null;
company_size: CompanySize | null;
industry: string | null;
hiring_budget: string | null;
score: number;
total_reviews: number;
total_deals_closed: number;
total_revenue_generated: number;
badge_level: BadgeLevel;
is_public: boolean;
is_featured: boolean;
profile_views: number;
created_at: string;
updated_at: string;
user?: User;
}

export interface CloserProfile {
id: string;
user_id: string;
bio: string | null;
experience_level: ExperienceLevel;
specialties: string[];
linkedin_url: string | null;
portfolio_url: string | null;
hourly_rate: number | null;
commission_rate: number | null;
availability: boolean;
total_deals_closed: number;
success_rate: number | null;
created_at: string;
updated_at: string;
}

export interface ManagerProfile {
id: string;
user_id: string;
company_name: string | null;
bio: string | null;
website_url: string | null;
linkedin_url: string | null;
industry: string | null;
team_size: number | null;
total_offers_posted: number;
created_at: string;
updated_at: string;
}

export type OfferType = 'challenge' | 'recurring' | 'mission' | 'full_time' | 'part_time' | 'commission_only';

export interface Offer {
id: string;
manager_id: string;
title: string;
description: string;
offer_type: OfferType;
commission_rate: number | null;
fixed_salary: number | null;
product_type: string | null;
product_price_range: string | null;
required_experience: ExperienceLevel | null;
required_specialties: string[];
required_languages: string[];
location: string | null;
status: OfferStatus;
application_count: number;
views_count: number;
required_skills: Skill[];
experience_required: string | null;
is_premium: boolean;
is_boosted: boolean;
boost_expires_at: string | null;
niche: string | null;
questionnaire_id: string | null;
application_deadline: string | null;
max_applicants: number | null;
created_at: string;
updated_at: string;
manager?: User;
questionnaire?: Questionnaire;
}

export interface Application {
id: string;
offer_id: string;
closer_id: string;
status: ApplicationStatus;
cover_letter: string | null;
validated_at: string | null;
created_at: string;
updated_at: string;
offer?: Offer;
closer?: User;
}

export interface Review {
id: string;
reviewer_id: string;
reviewed_id: string;
offer_id: string | null;
application_id: string | null;
rating: number;
rating_reactivity: number | null;
rating_quality: number | null;
rating_communication: number | null;
rating_results: number | null;
reviewer_role: 'candidate' | 'recruiter' | null;
comment: string | null;
is_public: boolean;
created_at: string;
updated_at: string;
reviewer?: User;
reviewed?: User;
offer?: Offer;
}

export const REVIEW_CRITERIA = [
{ key: 'rating_reactivity', label: 'Réactivité', icon: '⚡', description: 'Rapidité de réponse et disponibilité' },
{ key: 'rating_quality', label: 'Qualité', icon: '💎', description: 'Qualité du travail ou de l\'offre' },
{ key: 'rating_communication', label: 'Communication', icon: '💬', description: 'Clarté et transparence des échanges' },
{ key: 'rating_results', label: 'Résultats', icon: '📈', description: 'Atteinte des objectifs fixés' },
] as const;

export type ReviewCriteriaKey = typeof REVIEW_CRITERIA[number]['key'];

export const BADGE_THRESHOLDS: Record<BadgeLevel, { min: number; max: number; label: string; color: string; bgColor: string }> = {
bronze: { min: 0, max: 30, label: 'Bronze', color: 'text-amber-700', bgColor: 'bg-amber-100' },
silver: { min: 31, max: 50, label: 'Silver', color: 'text-gray-500', bgColor: 'bg-gray-100' },
gold: { min: 51, max: 70, label: 'Gold', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
platinum: { min: 71, max: 90, label: 'Platinum', color: 'text-blue-600', bgColor: 'bg-blue-100' },
diamond: { min: 91, max: 100, label: 'Diamond', color: 'text-purple-600', bgColor: 'bg-purple-100' },
};

export function getBadgeForScore(score: number): BadgeLevel {
if (score >= 91) return 'diamond';
if (score >= 71) return 'platinum';
if (score >= 51) return 'gold';
if (score >= 31) return 'silver';
return 'bronze';
}

export interface UserBadge {
id: string;
user_id: string;
badge_type: string;
badge_name: string;
badge_icon: string | null;
earned_at: string;
}

export interface PerformanceLog {
id: string;
user_id: string;
log_date: string;
calls_made: number;
appointments_booked: number;
deals_closed: number;
revenue_generated: number;
commission_earned: number;
notes: string | null;
created_at: string;
updated_at: string;
}

export interface PortfolioEntry {
id: string;
user_id: string;
offer_name: string;
niche: string | null;
product_price: number | null;
revenue_closed: number;
calls_made: number;
appointments_booked: number;
deals_closed: number;
cash_per_call: number;
conversion_rate_gross: number | null;
conversion_rate_net: number | null;
start_date: string | null;
end_date: string | null;
is_current: boolean;
notes: string | null;
created_at: string;
updated_at: string;
}

export type VideoType = 'presentation' | 'call_recording' | 'testimonial';

export interface PortfolioVideo {
id: string;
user_id: string;
video_type: VideoType;
title: string;
url: string;
description: string | null;
offer_name: string | null;
is_public: boolean;
sort_order: number;
created_at: string;
}

export interface Referral {
id: string;
referrer_id: string;
referred_id: string;
referral_code: string;
commission_rate: number;
status: 'pending' | 'active' | 'expired';
total_earned: number;
created_at: string;
referrer?: User;
referred?: User;
}

export interface Message {
id: string;
conversation_id: string;
sender_id: string;
content: string;
read_at: string | null;
created_at: string;
}

// --- Questionnaires ---

export type QuestionType = 'text' | 'mcq' | 'yesno';

export interface Questionnaire {
id: string;
recruiter_id: string;
title: string;
description: string | null;
created_at: string;
updated_at: string;
questions?: QuestionnaireQuestion[];
}

export interface QuestionnaireQuestion {
id: string;
questionnaire_id: string;
question_text: string;
question_type: QuestionType;
options: string[];
is_required: boolean;
sort_order: number;
created_at: string;
}

export interface QuestionnaireResponse {
id: string;
application_id: string;
question_id: string;
answer_text: string | null;
answer_options: string[] | null;
created_at: string;
question?: QuestionnaireQuestion;
}

// --- Notifications ---

export type NotificationType =
| 'new_application'
| 'status_change'
| 'questionnaire_filled'
| 'offer_expiring'
| 'message_received'
| 'review_request'
| 'review_received'
| 'new_offer'
| 'system';

export interface Notification {
id: string;
user_id: string;
type: NotificationType;
title: string;
body: string | null;
link: string | null;
is_read: boolean;
email_sent: boolean;
metadata: Record<string, unknown>;
created_at: string;
}

export const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, {
label: string;
color: string;
bgColor: string;
description: string;
}> = {
pending: {
label: 'En attente',
color: 'text-amber-700',
bgColor: 'bg-amber-100',
description: 'Candidature reçue, en attente de traitement',
},
reviewing: {
label: 'À étudier',
color: 'text-blue-700',
bgColor: 'bg-blue-100',
description: 'Profil en cours d\'examen par le recruteur',
},
accepted: {
label: 'Profil validé',
color: 'text-green-700',
bgColor: 'bg-green-100',
description: 'Le recruteur a validé ce profil',
},
rejected: {
label: 'Non retenu',
color: 'text-red-700',
bgColor: 'bg-red-100',
description: 'Le profil n\'a pas été retenu pour cette offre',
},
withdrawn: {
label: 'Retiré',
color: 'text-gray-600',
bgColor: 'bg-gray-100',
description: 'Le candidat a retiré sa candidature',
},
completed: {
label: 'Terminé',
color: 'text-purple-700',
bgColor: 'bg-purple-100',
description: 'Collaboration terminée — en attente d\'avis',
},
};

export interface Conversation {
id: string;
participant_1: string;
participant_2: string;
last_message_at: string | null;
created_at: string;
participant_1_user?: User;
participant_2_user?: User;
messages?: Message[];
}

export type EventType = 'coaching' | 'webinaire' | 'atelier' | 'networking';
export type EventStatus = 'upcoming' | 'live' | 'completed' | 'cancelled';
export type RegistrationStatus = 'registered' | 'attended' | 'cancelled';

export interface Event {
id: string;
title: string;
description: string | null;
event_type: EventType;
host_id: string | null;
start_date: string;
end_date: string | null;
location: string | null;
is_online: boolean;
meeting_url: string | null;
max_participants: number | null;
price: number;
status: EventStatus;
created_at: string;
updated_at: string;
host?: User;
}

export interface EventRegistration {
id: string;
event_id: string;
user_id: string;
status: RegistrationStatus;
created_at: string;
event?: Event;
}

// --- Call Stats & Coaching ---

export type CallEventType = 'challenge' | 'webinaire' | 've';

export interface CallStat {
id: string;
user_id: string;
event_type: CallEventType;
event_name: string;
event_date: string;
total_calls: number;
ns_count: number;
cancelled_count: number;
total_revenue: number;
effective_calls: number;
cash_per_call: number;
notes: string | null;
created_at: string;
updated_at: string;
}

export interface CallStatsAggregated {
total_events: number;
total_calls: number;
total_effective_calls: number;
total_revenue: number;
average_cash_per_call: number;
best_cash_per_call: number;
medal: MedalLevel;
}

export type MedalLevel = 'none' | 'bronze' | 'silver' | 'gold' | 'diamond';

export const MEDAL_CONFIG: Record<MedalLevel, {
label: string;
icon: string;
minCashPerCall: number;
color: string;
bgColor: string;
description: string;
}> = {
none: { label: 'Débutant', icon: '🎯', minCashPerCall: 0, color: 'text-gray-500', bgColor: 'bg-gray-100', description: 'Continue à tracker tes calls !' },
bronze: { label: 'Bronze', icon: '🥉', minCashPerCall: 300, color: 'text-amber-700', bgColor: 'bg-amber-100', description: 'Tu es sur la bonne voie' },
silver: { label: 'Silver', icon: '🥈', minCashPerCall: 600, color: 'text-gray-500', bgColor: 'bg-gray-200', description: 'Bon closer, continue !' },
gold: { label: 'Gold', icon: '🥇', minCashPerCall: 1000, color: 'text-yellow-600', bgColor: 'bg-yellow-100', description: 'Top closer — +1000€/call !' },
diamond: { label: 'Diamond', icon: '💎', minCashPerCall: 2000, color: 'text-purple-600', bgColor: 'bg-purple-100', description: 'Élite — Machine à closer' },
};

export function getMedalForCashPerCall(cashPerCall: number): MedalLevel {
if (cashPerCall >= 2000) return 'diamond';
if (cashPerCall >= 1000) return 'gold';
if (cashPerCall >= 600) return 'silver';
if (cashPerCall >= 300) return 'bronze';
return 'none';
}

export type CoachingBookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface CoachingBooking {
id: string;
user_id: string;
status: CoachingBookingStatus;
current_cash_per_call: number | null;
main_challenge: string | null;
experience_months: number | null;
niche: string | null;
goals: string | null;
availability: string | null;
price: number;
stripe_payment_id: string | null;
paid_at: string | null;
created_at: string;
updated_at: string;
user?: User;
}

// --- Helpers ---

export function canUserDo(user: User, action: string): boolean {
const limits = TIER_LIMITS[user.tier as keyof typeof TIER_LIMITS];
if (!limits) return false;

const featureMap: Record<string, string> = {
'see_premium_offers': 'can_see_premium',
'tracker': 'has_tracker',
'cv_performance': 'has_cv_performance',
'reputation_score': 'has_reputation_score',
'badge': 'has_badge',
'matching': 'has_matching',
'masterclass': 'has_masterclass',
'replays': 'has_replays',
'upskill': 'has_upskill',
'accounting': 'has_accounting',
'direct_contact': 'has_direct_contact',
'access_coaching': 'has_upskill',
};

if (action === 'apply') {
if ('applications_per_month' in limits) {
return user.monthly_applications_count < limits.applications_per_month;
}
return true;
}

const key = featureMap[action];
if (key && key in limits) {
return (limits as Record<string, unknown>)[key] === true;
}

return false;
}

export function isOfferPremium(offer: Offer): boolean {
if (offer.is_premium) return true;

const hasHighCommission = (offer.commission_rate || 0) >= 12;

let hasHighPrice = false;
if (offer.product_price_range) {
const match = offer.product_price_range.match(/(\d[\d\s]*)/g);
if (match) {
const maxPrice = Math.max(...match.map(s => parseInt(s.replace(/\s/g, '')) || 0));
hasHighPrice = maxPrice >= 5000;
}
}

return hasHighCommission && hasHighPrice;
}

export function getRemainingApplications(user: User): number {
const limits = TIER_LIMITS[user.tier as keyof typeof TIER_LIMITS];
if (!limits || !('applications_per_month' in limits)) return 0;
const max = limits.applications_per_month;
if (max === Infinity) return Infinity;
return Math.max(0, max - user.monthly_applications_count);
}

export function getRemainingContacts(user: User): number {
const limits = TIER_LIMITS[user.tier as keyof typeof TIER_LIMITS];
if (!limits || !('contacts_per_month' in limits)) return 0;
const max = (limits as { contacts_per_month: number }).contacts_per_month;
if (max === Infinity) return Infinity;
return Math.max(0, max - user.monthly_contacts_count);
}

export function getUpgradeTier(currentTier: SubscriptionTier, roleType: RoleType): SubscriptionTier | null {
if (roleType === 'candidate') {
const order: SubscriptionTier[] = ['free', 'starter', 'pro', 'elite'];
const idx = order.indexOf(currentTier);
return idx < order.length - 1 ? order[idx + 1] : null;
}
if (roleType === 'recruiter') {
const order: SubscriptionTier[] = ['free', 'solo', 'equipe', 'campagne', 'agency'];
const idx = order.indexOf(currentTier);
return idx < order.length - 1 ? order[idx + 1] : null;
}
return null;
}

// --- Matching IA ---

export type MatchingFicheStatus = 'active' | 'archived';
export type MatchingResultStatus = 'pending' | 'liked' | 'passed' | 'contacted';

export interface MatchingFiche {
id: string;
recruiter_id: string;
title: string;
niche: string | null;
required_skills: string[];
offer_type: string | null;
experience_level: string | null;
min_years_experience: number | null;
languages: string[];
min_commission_rate: number | null;
max_commission_rate: number | null;
location: string | null;
availability_required: boolean;
min_hours_per_week: number | null;
is_employed_preferred: boolean | null;
min_cash_per_call: number | null;
min_deals_closed: number | null;
min_revenue_generated: number | null;
min_reputation_score: number | null;
min_badge_level: string | null;
medal_required: string | null;
loom_required: boolean;
training_centers: string[];
status: MatchingFicheStatus;
notes: string | null;
created_at: string;
updated_at: string;
recruiter?: User;
results?: MatchingResult[];
results_count?: number;
}

export interface MatchingResult {
id: string;
fiche_id: string;
candidate_id: string;
score: number;
score_details: MatchingScoreDetails;
status: MatchingResultStatus;
candidate_status: string;
created_at: string;
updated_at: string;
candidate?: User;
fiche?: MatchingFiche;
profile?: Profile;
}

export interface MatchingScoreDetails {
niche: number;
skills: number;
experience: number;
years: number;
languages: number;
commission: number;
availability: number;
location: number;
reputation: number;
performance: number;
loom: number;
training: number;
reviews: number;
revenue: number;
total: number;
}

export const MATCHING_WEIGHTS = {
niche: 15,
skills: 15,
experience: 10,
years: 5,
languages: 10,
commission: 5,
availability: 10,
location: 5,
reputation: 8,
performance: 7,
loom: 3,
training: 3,
reviews: 2,
revenue: 2,
} as const;

export const MATCHING_NICHES = [
'Coaching',
'Formation',
'SaaS',
'E-commerce',
'Immobilier',
'Finance',
'Assurance',
'Santé',
'Bien-être',
'Marketing Digital',
'Développement personnel',
'Consulting',
'Agence',
'Trading',
'Crypto',
'Infoproduit',
'High Ticket',
'B2B',
'B2C',
] as const;

export const MATCHING_LANGUAGES = [
'Français',
'Anglais',
'Espagnol',
'Allemand',
'Arabe',
'Portugais',
'Italien',
'Néerlandais',
'Russe',
'Chinois',
] as const;

export const OFFER_TYPE_LABELS: Record<string, string> = {
challenge: 'Challenge',
recurring: 'Récurrent',
mission: 'Mission ponctuelle',
full_time: 'CDI / Temps plein',
part_time: 'Temps partiel',
commission_only: 'Commission only',
};

export const EXPERIENCE_LABELS: Record<string, string> = {
junior: 'Junior (0-1 an)',
intermediaire: 'Intermédiaire (1-3 ans)',
senior: 'Senior (3-5 ans)',
expert: 'Expert (5+ ans)',
};

// --- CRM Événements Recruteur ---

export type CrmEventType = 'challenge' | 've' | 'webinaire';
export type CrmEventStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type EventAssignmentStatus = 'invited' | 'assigned' | 'active' | 'completed' | 'removed';

/** Labels types d'événements CRM */
export const CRM_EVENT_TYPE_LABELS: Record<CrmEventType, string> = {
  challenge: 'Challenge',
  ve: 'Vente Événementielle',
  webinaire: 'Webinaire',
};

/** Labels statuts événements CRM */
export const CRM_EVENT_STATUS_LABELS: Record<CrmEventStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Brouillon', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  active: { label: 'En cours', color: 'text-green-700', bgColor: 'bg-green-100' },
  completed: { label: 'Terminé', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  cancelled: { label: 'Annulé', color: 'text-red-700', bgColor: 'bg-red-100' },
};

/** Labels statuts assignation */
export const ASSIGNMENT_STATUS_LABELS: Record<EventAssignmentStatus, { label: string; color: string; bgColor: string }> = {
  invited: { label: 'Invité', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  assigned: { label: 'Assigné', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  active: { label: 'Actif', color: 'text-green-700', bgColor: 'bg-green-100' },
  completed: { label: 'Terminé', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  removed: { label: 'Retiré', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

/** Événement CRM recruteur */
export interface RecruiterEvent {
  id: string;
  recruiter_id: string;
  offer_id: string | null;
  title: string;
  event_type: CrmEventType;
  start_date: string;
  end_date: string | null;
  description: string | null;
  status: CrmEventStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  offer?: Offer;
  assignments?: EventAssignment[];
  assignments_count?: number;
}

/** Assignation d'un closer à un événement */
export interface EventAssignment {
  id: string;
  event_id: string;
  closer_id: string | null;
  closer_name: string;
  closer_email: string | null;
  status: EventAssignmentStatus;
  invited_at: string | null;
  joined_at: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  closer?: User;
  event?: RecruiterEvent;
  performances?: EventPerformance[];
}

/** Performance d'un closer sur un événement */
export interface EventPerformance {
  id: string;
  event_id: string;
  assignment_id: string;
  closer_id: string | null;
  performance_date: string;
  calls_scheduled: number;
  calls_completed: number;
  revenue_collected: number;
  revenue_invoiced: number;
  no_shows: number;
  cancellations: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Agrégation performances par closer */
export interface CloserEventStats {
  closer_id: string | null;
  closer_name: string;
  total_calls_scheduled: number;
  total_calls_completed: number;
  total_revenue_collected: number;
  total_revenue_invoiced: number;
  total_no_shows: number;
  total_cancellations: number;
  effective_calls: number;
  cash_per_call: number;
  conversion_rate: number;
  entries_count: number;
}

/** Agrégation performances par événement */
export interface EventAggregatedStats {
  event_id: string;
  title: string;
  event_type: CrmEventType;
  status: CrmEventStatus;
  closers_count: number;
  total_calls_scheduled: number;
  total_calls_completed: number;
  total_revenue_collected: number;
  total_revenue_invoiced: number;
  total_no_shows: number;
  total_cancellations: number;
  avg_cash_per_call: number;
}

// =============================================
// WEBHOOKS — Intégration CRM externe
// =============================================

/** Types d'événements webhook */
export type WebhookEventType =
  | 'event.created'
  | 'event.updated'
  | 'event.deleted'
  | 'assignment.created'
  | 'assignment.removed'
  | 'performance.created'
  | 'performance.updated'
  | 'performance.deleted'
  | 'invitation.sent';

export const WEBHOOK_EVENT_LABELS: Record<WebhookEventType, string> = {
  'event.created': 'Événement créé',
  'event.updated': 'Événement modifié',
  'event.deleted': 'Événement supprimé',
  'assignment.created': 'Closer assigné',
  'assignment.removed': 'Closer retiré',
  'performance.created': 'Performance saisie',
  'performance.updated': 'Performance modifiée',
  'performance.deleted': 'Performance supprimée',
  'invitation.sent': 'Invitation envoyée',
};

export const ALL_WEBHOOK_EVENTS: WebhookEventType[] = [
  'event.created', 'event.updated', 'event.deleted',
  'assignment.created', 'assignment.removed',
  'performance.created', 'performance.updated', 'performance.deleted',
  'invitation.sent',
];

/** Endpoint webhook configuré par un recruteur */
export interface WebhookEndpoint {
  id: string;
  user_id: string;
  url: string;
  secret: string;
  description: string | null;
  events: WebhookEventType[];
  active: boolean;
  last_triggered_at: string | null;
  last_status_code: number | null;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

/** Log d'un envoi webhook */
export interface WebhookLog {
  id: string;
  endpoint_id: string;
  event_type: WebhookEventType;
  payload: Record<string, unknown>;
  status_code: number | null;
  response_body: string | null;
  success: boolean;
  error_message: string | null;
  sent_at: string;
}

/** Payload standard envoyé aux webhooks */
export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
  metadata: {
    recruiter_id: string;
    source: 'hubclosing';
    version: '1.0';
  };
}
