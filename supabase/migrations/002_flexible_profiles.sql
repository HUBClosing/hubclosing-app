-- ============================================================
-- Migration 002: Profils flexibles + tarification
-- HUBClosing — Passage de closer/manager vers candidate/recruiter
-- ============================================================

-- 1. Nouveaux types ENUM
-- ============================================================

-- Rôle principal : candidat (cherche des missions) ou recruteur (publie des offres)
-- On garde 'admin' et 'pending' pour la compatibilité
DO $$ BEGIN
  -- Supprimer l'ancienne contrainte CHECK sur role
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Créer le type enum pour subscription_tier
DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM (
    'free',        -- Découverte (candidat) / Essentiel (recruteur)
    'starter',     -- Starter 9€/mois (candidat uniquement)
    'business',    -- Business 49€/mois (recruteur uniquement)
    'pro',         -- Pro 19€/mois (candidat) / Scale 99€/mois (recruteur)
    'elite',       -- Élite 39€/mois (candidat uniquement)
    'agency'       -- Agence 199€/mois (recruteur uniquement)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Modifier la table users
-- ============================================================

-- Ajouter la nouvelle colonne role_type (candidate/recruiter/admin)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_type TEXT DEFAULT 'pending';

-- Migrer les données existantes
UPDATE users SET role_type = 'candidate' WHERE role IN ('closer', 'pending');
UPDATE users SET role_type = 'recruiter' WHERE role = 'manager';
UPDATE users SET role_type = 'admin' WHERE role = 'admin';

-- Ajouter contrainte sur role_type
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_type_check;
ALTER TABLE users ADD CONSTRAINT users_role_type_check
  CHECK (role_type IN ('pending', 'candidate', 'recruiter', 'admin'));

-- Compétences (tags flexibles) — remplace le système rigide de sub_role
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';

-- Tier d'abonnement
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tier_check;
ALTER TABLE users ADD CONSTRAINT users_tier_check
  CHECK (tier IN ('free', 'starter', 'business', 'pro', 'elite', 'agency'));

-- Stripe customer ID pour le paiement
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Date de fin d'abonnement
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_expires_at TIMESTAMPTZ;

-- Compteurs de limites mensuelles
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_applications_count INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_applications_reset_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_contacts_count INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_contacts_reset_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Table profil unifié (remplace closer_profiles + manager_profiles)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Infos communes
  bio TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  website_url TEXT,

  -- Candidat : compétences et disponibilité
  experience_level TEXT CHECK (experience_level IN ('junior', 'intermediaire', 'senior', 'expert')),
  specialties TEXT[] DEFAULT '{}',
  hourly_rate NUMERIC,
  commission_rate NUMERIC,
  availability BOOLEAN DEFAULT true,
  available_hours_per_week INT,
  preferred_niches TEXT[] DEFAULT '{}',

  -- Recruteur : entreprise
  company_name TEXT,
  company_size TEXT CHECK (company_size IN ('solo', 'small', 'medium', 'large')),
  industry TEXT,
  hiring_budget TEXT,

  -- Réputation (anti-churn)
  score NUMERIC DEFAULT 0,          -- Score HUBClosing sur 5
  total_reviews INT DEFAULT 0,
  total_deals_closed INT DEFAULT 0,
  total_revenue_generated NUMERIC DEFAULT 0,
  badge_level TEXT DEFAULT 'bronze' CHECK (badge_level IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),

  -- Visibilité
  is_public BOOLEAN DEFAULT true,    -- Visible dans la CVthèque
  is_featured BOOLEAN DEFAULT false, -- Mis en avant (boost payant)
  profile_views INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrer les données des anciens profils
INSERT INTO profiles (user_id, bio, linkedin_url, portfolio_url, experience_level, specialties, hourly_rate, commission_rate, availability, total_deals_closed, total_revenue_generated, score, total_reviews)
SELECT user_id, bio, linkedin_url, portfolio_url, experience_level, specialties, hourly_rate, commission_rate, availability, total_deals_closed, COALESCE(total_revenue_generated, 0), COALESCE(rating, 0), COALESCE(review_count, 0)
FROM closer_profiles
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO profiles (user_id, bio, linkedin_url, website_url, company_name, industry)
SELECT user_id, bio, linkedin_url, website_url, company_name, industry
FROM manager_profiles
ON CONFLICT (user_id) DO NOTHING;

-- 4. Table reviews (système de réputation)
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reviewed_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un recruteur ne peut noter un candidat qu'une fois par offre
  UNIQUE(reviewer_id, reviewed_id, offer_id)
);

-- 5. Table badges
-- ============================================================

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  badge_type TEXT NOT NULL,  -- 'top_closer_month', 'expert_immobilier', '10_deals', etc.
  badge_name TEXT NOT NULL,
  badge_icon TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, badge_type)
);

-- 6. Table performance_logs (tracker quotidien)
-- ============================================================

CREATE TABLE IF NOT EXISTS performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,

  calls_made INT DEFAULT 0,
  appointments_booked INT DEFAULT 0,
  deals_closed INT DEFAULT 0,
  revenue_generated NUMERIC DEFAULT 0,
  commission_earned NUMERIC DEFAULT 0,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, log_date)
);

-- 7. Table referrals (programme parrainage)
-- ============================================================

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  referral_code TEXT NOT NULL,
  commission_rate NUMERIC DEFAULT 0.20,  -- 20% récurrent
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired')),
  total_earned NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter referral_code à users
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id);

-- 8. Mettre à jour les offres pour le nouveau modèle
-- ============================================================

-- Les offres peuvent maintenant cibler des compétences spécifiques
ALTER TABLE offers ADD COLUMN IF NOT EXISTS required_skills TEXT[] DEFAULT '{}';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS experience_required TEXT;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;  -- Réservée aux abonnés
ALTER TABLE offers ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT false;  -- Mise en avant payante
ALTER TABLE offers ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMPTZ;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS niche TEXT;

-- 9. RLS Policies
-- ============================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles publics visibles par tous" ON profiles
  FOR SELECT USING (is_public = true);

CREATE POLICY "Utilisateur peut voir son propre profil" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Utilisateur peut modifier son profre profil" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Utilisateur peut créer son profil" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews publiques visibles par tous" ON reviews
  FOR SELECT USING (is_public = true);

CREATE POLICY "Utilisateur peut créer une review" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Performance logs
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateur peut voir ses propres logs" ON performance_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Utilisateur peut créer ses logs" ON performance_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateur peut modifier ses logs" ON performance_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- Badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges visibles par tous" ON user_badges
  FOR SELECT USING (true);

-- Referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateur peut voir ses parrainages" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- 10. Index pour les performances
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_public ON profiles(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_profiles_availability ON profiles(availability) WHERE availability = true;
CREATE INDEX IF NOT EXISTS idx_profiles_score ON profiles(score DESC);
CREATE INDEX IF NOT EXISTS idx_users_role_type ON users(role_type);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_skills ON users USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_offers_required_skills ON offers USING GIN(required_skills);
CREATE INDEX IF NOT EXISTS idx_offers_is_premium ON offers(is_premium);
CREATE INDEX IF NOT EXISTS idx_performance_logs_user_date ON performance_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON reviews(reviewed_id);

-- 11. Fonction pour générer un code de parrainage unique
-- ============================================================

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'HUB-' || UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_referral_code ON users;
CREATE TRIGGER set_referral_code
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- Générer les codes pour les utilisateurs existants
UPDATE users SET referral_code = 'HUB-' || UPPER(SUBSTRING(MD5(id::text || NOW()::text) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- 12. Fonction pour mettre à jour le score après une review
-- ============================================================

CREATE OR REPLACE FUNCTION update_profile_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    score = (SELECT AVG(rating)::NUMERIC(3,2) FROM reviews WHERE reviewed_id = NEW.reviewed_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE reviewed_id = NEW.reviewed_id),
    updated_at = NOW()
  WHERE user_id = NEW.reviewed_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_score_on_review ON reviews;
CREATE TRIGGER update_score_on_review
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_score();
