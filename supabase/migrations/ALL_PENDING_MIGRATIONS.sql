-- ================================================================
-- HUBCLOSING — Migrations 005 + 006 + 007 combinées
-- À exécuter dans Supabase SQL Editor en UNE seule fois
-- Projet : gamqjsxgzsqtrwwbihnr
-- ================================================================

-- ============================================================
-- MIGRATION 005 : Notifications in-app + statuts candidature
-- ============================================================

-- 1. Enrichir les statuts de candidature
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check
  CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected', 'withdrawn'));

-- 2. Table notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'new_application',
    'status_change',
    'questionnaire_filled',
    'offer_expiring',
    'message_received',
    'system'
  )),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = false;

-- 3. RLS notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users create notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Colonne email_sent
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;

-- ============================================================
-- MIGRATION 006 : Politique de suppression notifications
-- ============================================================

CREATE POLICY "Users delete own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- MIGRATION 007 : Réputation + avis + statut "completed"
-- ============================================================

-- 1. Ajouter le statut "completed" aux candidatures
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check
  CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected', 'withdrawn', 'completed'));

-- 2. Enrichir la table reviews avec sous-critères
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_reactivity INT CHECK (rating_reactivity >= 1 AND rating_reactivity <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_quality INT CHECK (rating_quality >= 1 AND rating_quality <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_communication INT CHECK (rating_communication >= 1 AND rating_communication <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_results INT CHECK (rating_results >= 1 AND rating_results <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES applications(id) ON DELETE SET NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_role TEXT CHECK (reviewer_role IN ('candidate', 'recruiter'));
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Index reviews
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON reviews(reviewed_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_application ON reviews(application_id);

-- 3. RLS reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reviews visible to all" ON reviews;
CREATE POLICY "Public reviews visible to all"
  ON reviews FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "Users see own reviews" ON reviews;
CREATE POLICY "Users see own reviews"
  ON reviews FOR SELECT
  USING (reviewer_id = auth.uid() OR reviewed_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users create reviews" ON reviews;
CREATE POLICY "Authenticated users create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Users update own reviews" ON reviews;
CREATE POLICY "Users update own reviews"
  ON reviews FOR UPDATE
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

-- 4. Mettre à jour le CHECK des types de notification (remplace l'ancien)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'new_application',
    'status_change',
    'questionnaire_filled',
    'offer_expiring',
    'message_received',
    'review_request',
    'review_received',
    'system'
  ));

-- ================================================================
-- FIN — Toutes les migrations appliquées !
-- ================================================================
