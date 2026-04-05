-- HUBClosing - Schema de base de donnees
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('closer', 'manager', 'admin')),
  avatar_url TEXT,
  phone TEXT,
  subscription_plan TEXT NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'premium')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  is_onboarded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.closer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  bio TEXT DEFAULT '',
  experience_level TEXT NOT NULL DEFAULT 'junior' CHECK (experience_level IN ('junior', 'intermediaire', 'senior', 'expert')),
  specialties TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{francais}',
  linkedin_url TEXT,
  portfolio_url TEXT,
  hourly_rate NUMERIC(10,2),
  commission_rate NUMERIC(5,2),
  availability BOOLEAN NOT NULL DEFAULT TRUE,
  total_deals_closed INTEGER NOT NULL DEFAULT 0,
  total_revenue_generated NUMERIC(12,2) NOT NULL DEFAULT 0,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  city TEXT,
  country TEXT NOT NULL DEFAULT 'France',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.manager_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL DEFAULT '',
  bio TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  website_url TEXT,
  linkedin_url TEXT,
  team_size INTEGER,
  monthly_revenue TEXT,
  city TEXT,
  country TEXT NOT NULL DEFAULT 'France',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  offer_type TEXT NOT NULL DEFAULT 'commission_only' CHECK (offer_type IN ('full_time', 'part_time', 'mission', 'commission_only')),
  commission_rate NUMERIC(5,2),
  fixed_salary NUMERIC(10,2),
  product_type TEXT DEFAULT '',
  product_price_range TEXT DEFAULT '',
  required_experience TEXT NOT NULL DEFAULT 'junior' CHECK (required_experience IN ('junior', 'intermediaire', 'senior', 'expert')),
  required_specialties TEXT[] DEFAULT '{}',
  required_languages TEXT[] DEFAULT '{francais}',
  location TEXT NOT NULL DEFAULT 'remote',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  application_count INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  closer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  manager_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(offer_id, closer_id)
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_offers_manager ON public.offers(manager_id);
CREATE INDEX idx_offers_status ON public.offers(status);
CREATE INDEX idx_offers_created ON public.offers(created_at DESC);
CREATE INDEX idx_applications_offer ON public.applications(offer_id);
CREATE INDEX idx_applications_closer ON public.applications(closer_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX idx_closer_profiles_user ON public.closer_profiles(user_id);
CREATE INDEX idx_manager_profiles_user ON public.manager_profiles(user_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_closer_profiles_updated BEFORE UPDATE ON public.closer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_manager_profiles_updated BEFORE UPDATE ON public.manager_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_offers_updated BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_applications_updated BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION increment_application_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.offers SET application_count = application_count + 1 WHERE id = NEW.offer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_application_count AFTER INSERT ON public.applications FOR EACH ROW EXECUTE FUNCTION increment_application_count();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Closer profiles are viewable by authenticated" ON public.closer_profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Closers can update own profile" ON public.closer_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Closers can insert own profile" ON public.closer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Manager profiles are viewable by authenticated" ON public.manager_profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can update own profile" ON public.manager_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Managers can insert own profile" ON public.manager_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Offers are viewable by authenticated" ON public.offers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can create offers" ON public.offers FOR INSERT WITH CHECK (auth.uid() = manager_id);
CREATE POLICY "Managers can update own offers" ON public.offers FOR UPDATE USING (auth.uid() = manager_id);
CREATE POLICY "Managers can delete own offers" ON public.offers FOR DELETE USING (auth.uid() = manager_id);

CREATE POLICY "Closers can view own applications" ON public.applications FOR SELECT USING (auth.uid() = closer_id);
CREATE POLICY "Managers can view applications to their offers" ON public.applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.offers WHERE offers.id = applications.offer_id AND offers.manager_id = auth.uid())
);
CREATE POLICY "Closers can create applications" ON public.applications FOR INSERT WITH CHECK (auth.uid() = closer_id);
CREATE POLICY "Closers can update own applications" ON public.applications FOR UPDATE USING (auth.uid() = closer_id);
CREATE POLICY "Managers can update applications to their offers" ON public.applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.offers WHERE offers.id = applications.offer_id AND offers.manager_id = auth.uid())
);

CREATE POLICY "Admins can do everything on offers" ON public.offers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Admins can do everything on applications" ON public.applications FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Admins can do everything on closer_profiles" ON public.closer_profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Admins can do everything on manager_profiles" ON public.manager_profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Admins can do everything on messages" ON public.messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receiver can mark as read" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'closer');
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_role
  );
  IF user_role = 'closer' THEN
    INSERT INTO public.closer_profiles (user_id) VALUES (NEW.id);
  ELSIF user_role = 'manager' THEN
    INSERT INTO public.manager_profiles (user_id) VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
