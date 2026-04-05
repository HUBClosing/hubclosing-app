-- ============================================
-- HUBClosing - Configuration Supabase complète
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================

-- 1. TABLE USERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'closer' CHECK (role IN ('closer', 'manager', 'admin')),
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  subscription_plan TEXT NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'premium')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABLE CLOSER_PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS public.closer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  bio TEXT,
  experience_level TEXT DEFAULT 'junior' CHECK (experience_level IN ('junior', 'intermediaire', 'senior', 'expert')),
  specialties TEXT[] DEFAULT '{}',
  linkedin_url TEXT,
  portfolio_url TEXT,
  hourly_rate NUMERIC,
  commission_rate NUMERIC,
  availability BOOLEAN DEFAULT true,
  total_deals_closed INTEGER DEFAULT 0,
  success_rate NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABLE MANAGER_PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS public.manager_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT,
  bio TEXT,
  website_url TEXT,
  linkedin_url TEXT,
  industry TEXT,
  team_size INTEGER,
  total_offers_posted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLE OFFERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  commission_type TEXT NOT NULL DEFAULT 'percentage',
  commission_value NUMERIC NOT NULL DEFAULT 0,
  product_type TEXT,
  product_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  max_closers INTEGER,
  applications_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABLE APPLICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  closer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  cover_letter TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(offer_id, closer_id)
);

-- 6. TABLE CONVERSATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TABLE MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. TABLE EVENTS (coaching, webinaires, événements)
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'coaching' CHECK (event_type IN ('coaching', 'webinaire', 'atelier', 'networking')),
  host_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  is_online BOOLEAN DEFAULT true,
  meeting_url TEXT,
  max_participants INTEGER,
  price NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. TABLE EVENT_REGISTRATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- USERS: tout le monde peut lire, seul l'utilisateur peut modifier son profil
CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own record" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own record" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can do everything on users
CREATE POLICY "Admins full access on users" ON public.users FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- CLOSER PROFILES
CREATE POLICY "Closer profiles viewable by everyone" ON public.closer_profiles FOR SELECT USING (true);
CREATE POLICY "Closers can manage own profile" ON public.closer_profiles FOR ALL USING (auth.uid() = user_id);

-- MANAGER PROFILES
CREATE POLICY "Manager profiles viewable by everyone" ON public.manager_profiles FOR SELECT USING (true);
CREATE POLICY "Managers can manage own profile" ON public.manager_profiles FOR ALL USING (auth.uid() = user_id);

-- OFFERS: visibles par tous, modifiables par le manager propriétaire ou admin
CREATE POLICY "Offers viewable by everyone" ON public.offers FOR SELECT USING (true);
CREATE POLICY "Managers can insert offers" ON public.offers FOR INSERT WITH CHECK (auth.uid() = manager_id);
CREATE POLICY "Managers can update own offers" ON public.offers FOR UPDATE USING (auth.uid() = manager_id);
CREATE POLICY "Managers can delete own offers" ON public.offers FOR DELETE USING (auth.uid() = manager_id);
CREATE POLICY "Admins full access on offers" ON public.offers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- APPLICATIONS
CREATE POLICY "Closers can view own applications" ON public.applications FOR SELECT USING (auth.uid() = closer_id);
CREATE POLICY "Managers can view applications to their offers" ON public.applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.offers WHERE id = offer_id AND manager_id = auth.uid())
);
CREATE POLICY "Closers can insert applications" ON public.applications FOR INSERT WITH CHECK (auth.uid() = closer_id);
CREATE POLICY "Closers can update own applications" ON public.applications FOR UPDATE USING (auth.uid() = closer_id);
CREATE POLICY "Managers can update applications to their offers" ON public.applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.offers WHERE id = offer_id AND manager_id = auth.uid())
);
CREATE POLICY "Admins full access on applications" ON public.applications FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- CONVERSATIONS
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (
  auth.uid() = participant_1 OR auth.uid() = participant_2
);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (
  auth.uid() = participant_1 OR auth.uid() = participant_2
);

-- MESSAGES
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND (participant_1 = auth.uid() OR participant_2 = auth.uid()))
);
CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND (participant_1 = auth.uid() OR participant_2 = auth.uid()))
);

-- EVENTS: visibles par tous, gérés par admin/host
CREATE POLICY "Events viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Hosts can manage own events" ON public.events FOR ALL USING (auth.uid() = host_id);

-- EVENT REGISTRATIONS
CREATE POLICY "Users can view own registrations" ON public.event_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can register to events" ON public.event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel own registration" ON public.event_registrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins full access on registrations" ON public.event_registrations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- TRIGGER: Auto-create user profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'closer'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  -- Auto-create role-specific profile
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'closer') = 'closer' THEN
    INSERT INTO public.closer_profiles (user_id) VALUES (NEW.id);
  ELSIF NEW.raw_user_meta_data->>'role' = 'manager' THEN
    INSERT INTO public.manager_profiles (user_id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIGGER: Update applications_count on offers
-- ============================================
CREATE OR REPLACE FUNCTION public.update_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.offers SET applications_count = applications_count + 1 WHERE id = NEW.offer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.offers SET applications_count = applications_count - 1 WHERE id = OLD.offer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_application_change ON public.applications;
CREATE TRIGGER on_application_change
  AFTER INSERT OR DELETE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_applications_count();

-- ============================================
-- TRIGGER: Update last_message_at on conversations
-- ============================================
CREATE OR REPLACE FUNCTION public.update_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_last_message();

-- ============================================
-- INDEXES pour performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_offers_manager_id ON public.offers(manager_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers(status);
CREATE INDEX IF NOT EXISTS idx_applications_closer_id ON public.applications(closer_id);
CREATE INDEX IF NOT EXISTS idx_applications_offer_id ON public.applications(offer_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(participant_1, participant_2);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON public.event_registrations(user_id);
