export type UserRole = 'closer' | 'manager' | 'admin';
export type SubscriptionPlan = 'free' | 'pro' | 'premium';
export type OfferStatus = 'active' | 'paused' | 'closed';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type ExperienceLevel = 'junior' | 'intermediaire' | 'senior' | 'expert';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  subscription_plan: SubscriptionPlan;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
