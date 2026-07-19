-- Migration 005: Notifications in-app + statuts candidature enrichis
-- Statuts : pending (en attente), reviewing (à étudier), accepted (profil validé), rejected (non retenu), withdrawn

-- ============================================================
-- 1. Enrichir les statuts de candidature
-- ============================================================
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check
  CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected', 'withdrawn'));

-- ============================================================
-- 2. Table notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'new_application',        -- Recruteur : nouveau candidat
    'status_change',          -- Candidat : statut modifié
    'questionnaire_filled',   -- Recruteur : questionnaire rempli
    'offer_expiring',         -- Recruteur : offre bientôt expirée
    'message_received',       -- Les deux : nouveau message
    'system'                  -- Système : annonces
  )),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,                 -- URL interne de redirection (ex: /dashboard/offers/xxx/candidates/yyy)
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,  -- Données additionnelles (offer_id, application_id, etc.)
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = false;

-- ============================================================
-- 3. RLS — Row Level Security
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Chaque utilisateur ne voit que ses propres notifications
CREATE POLICY "Users read own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Chaque utilisateur peut marquer ses notifications comme lues
CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- L'insertion est faite côté serveur (API routes) via service_role
-- On autorise aussi l'insertion authentifiée pour les cas simples
CREATE POLICY "Authenticated users create notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 4. Ajouter un email_sent flag pour tracker les emails envoyés
-- ============================================================
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;
