-- Migration 008: Colonnes Stripe sur la table users
-- Exécuter dans Supabase SQL Editor

-- Ajouter les colonnes Stripe
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ;

-- Index pour lookup rapide par stripe_customer_id (utilisé dans les webhooks)
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Index pour lookup par stripe_subscription_id
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Commentaires
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe Customer ID (cus_xxx)';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe Subscription ID (sub_xxx)';
COMMENT ON COLUMN users.subscription_status IS 'Statut abonnement Stripe: active, past_due, canceled, incomplete, trialing, inactive';
COMMENT ON COLUMN users.subscription_period_end IS 'Fin de la période d''abonnement en cours';
