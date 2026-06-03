// ============================================================
// Types HUBClosing — Modèle flexible avec tarification
// ============================================================

// --- Enums ---

/** Rôle principal : candidat cherche des missions, recruteur publie des offres */
export type RoleType = 'pending' | 'candidate' | 'recruiter' | 'admin';

/** Ancien rôle — gardé pour rétrocompatibilité pendant la migration */
export type UserRole = 'closer' | 'manager' | 'admin' | 'pending';

/** Compétences qu'un candidat peut cocher */
export type Skill = 'closing' | 'setting' | 'management' | 'hos' | 'coaching' | 'training';

/** Tier d'abonnement */
export type SubscriptionTier = 'free' | 'starter' | 'business' | 'pro' | 'elite' | 'agency';

/** Ancien plan — rétrocompatibilité */
export type SubscriptionPlan = 'free' | 'pro' | 'premium';

export type OfferStatus = 'active' | 'paused' | 'closed';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type ExperienceLevel = 'junior' | 'intermediaire' | 'senior' | 'expert';
export type BadgeLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type CompanySize = 'solo' | 'small' | 'medium' | 'large';

// --- Limites par tier ---

export const TIER_LIMITS = {
  // Candidats
  free: { applications_per_month: 3, can_see_premium: false, has_badge: false, has_matching: false, has_coaching: false, has_direct_contact: false, has_advanced_stats: false },
  starter: { applications_per_month: 15, can_see_premium: true, has_badge: false, has_matching: false, has_coaching: false, has_direct_contact: false, has_advanced_stats: false },
  pro: { applications_per_month: Infinity, can_see_premium: true, has_badge: true, has_matching: true, has_coaching: false, has_direct_contact: false, has_advanced_stats: false },
  elite: { applications_per_month: Infinity, can_see_premium: true, has_badge: true, has_matching: true, has_coaching: true, has_direct_contact: true, has_advanced_stats: true },
  // Recruteurs
  business: { active_offers: 5, contacts_per_month: 10, has_boost: 1, has_matching: false, has_analytics: false, team_members: 1 },
  agency: { active_offers: Infinity, contacts_per_month: Infinity, has_boost: Infinity, has_matching: true, has_analytics: true, team_members: Infinity },
} as const;

export const TIER_PRICES = {
  free: 0,
  starter: 9,
  pro: 19,
  elite: 39,
  business: 49,
  scale: 99,
  agency: 199,
} as const;

// --- Interfaces principales ---

export interface User {
  id: string;
  email: string;
  role: UserRole;              // Legacy — sera supprimé
  role_type: RoleType;         // Nouveau rôle principal
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  personal_email: string | null;
  years_experience: number | null;
  niches: string[] | null;
  skills: Skill[];             // Tags de compétences flexibles
  infopreneur_type: string | null;
  sub_role: string | null;     // Legacy
  subscription_plan: SubscriptionPlan; // Legacy
  tier: SubscriptionTier;      // Nouveau tier d'abonnement
  stripe_customer_id: string | null;
  tier_expires_at: string | null;
  referral_code: string | null;
  referred_by: string | null;
  monthly_applications_count: number;
  monthly_applications_reset_at: string;
  monthly_contacts_count: number;
  monthly_contacts_reset_at: string;
  is_active: boolean;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

/** Profil unifié — remplace CloserProfile + ManagerProfile */
export interface Profile {
  id: string;
  user_id: string;

  // Commun
  bio: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  website_url: string | null;

  // Candidat
  experience_level: ExperienceLevel | null;
  specialties: string[];
  hourly_rate: number | null;
  commission_rate: number | null;
  availability: boolean;
  available_hours_per_week: number | null;
  preferred_niches: string[];

  // Recruteur
  company_name: string | null;
  company_size: CompanySize | null;
  industry: string | null;
  hiring_budget: string | null;

  // Réputation
  score: number;
  total_reviews: number;
  total_deals_closed: number;
  total_revenue_generated: number;
  badge_level: BadgeLevel;

  // Visibilité
  is_public: boolean;
  is_featured: boolean;
  profile_views: number;

  created_at: string;
  updated_at: string;

  // Relations
  user?: User;
}

/** Legacy — gardé pour rétrocompatibilité */
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

/** Legacy — gardé pour rétrocompatibilité */
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

export interface Offer {
  id: string;
  manager_id: string;
  title: string;
  description: string;
  requirements: string | null;
  commission_type: string;
  commission_value: number;
  product_type: string | null;
  product_url: string | null;
  status: OfferStatus;
  max_closers: number | null;
  applications_count: number;
  required_skills: Skill[];
  experience_required: string | null;
  is_premium: boolean;
  is_boosted: boolean;
  boost_expires_at: string | null;
  niche: string | null;
  created_at: string;
  updated_at: string;
  manager?: User;
}

export interface Application {
  id: string;
  offer_id: string;
  closer_id: string;
  status: ApplicationStatus;
  cover_letter: string | null;
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
  rating: number;
  comment: string | null;
  is_public: boolean;
  created_at: string;
  reviewer?: User;
  reviewed?: User;
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

// --- Helpers ---

/** Vérifie si un utilisateur peut effectuer une action selon son tier */
export function canUserDo(user: User, action: string): boolean {
  const limits = TIER_LIMITS[user.tier as keyof typeof TIER_LIMITS];
  if (!limits) return false;

  switch (action) {
    case 'see_premium_offers':
      return 'can_see_premium' in limits && limits.can_see_premium;
    case 'apply':
      if ('applications_per_month' in limits) {
        return user.monthly_applications_count < limits.applications_per_month;
      }
      return true;
    case 'direct_contact':
      return 'has_direct_contact' in limits && limits.has_direct_contact;
    case 'access_coaching':
      return 'has_coaching' in limits && limits.has_coaching;
    case 'matching':
      return 'has_matching' in limits && limits.has_matching;
    default:
      return false;
  }
}

/** Retourne le nombre de candidatures restantes ce mois */
export function getRemainingApplications(user: User): number {
  const limits = TIER_LIMITS[user.tier as keyof typeof TIER_LIMITS];
  if (!limits || !('applications_per_month' in limits)) return 0;
  const max = limits.applications_per_month;
  if (max === Infinity) return Infinity;
  return Math.max(0, max - user.monthly_applications_count);
}

/** Retourne le tier supérieur pour l'upsell */
export function getUpgradeTier(currentTier: SubscriptionTier, roleType: RoleType): SubscriptionTier | null {
  if (roleType === 'candidate') {
    const order: SubscriptionTier[] = ['free', 'starter', 'pro', 'elite'];
    const idx = order.indexOf(currentTier);
    return idx < order.length - 1 ? order[idx + 1] : null;
  }
  if (roleType === 'recruiter') {
    const order: SubscriptionTier[] = ['free', 'business', 'pro', 'agency'];
    const idx = order.indexOf(currentTier);
    return idx < order.length - 1 ? order[idx + 1] : null;
  }
  return null;
}
