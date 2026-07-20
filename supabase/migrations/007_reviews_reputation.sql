-- Migration 007: Système de réputation enrichi + statut "completed"
-- Avis bidirectionnels avec sous-critères, badges automatiques

-- ============================================================
-- 1. Ajouter le statut "completed" aux candidatures
-- ============================================================
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check
  CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected', 'withdrawn', 'completed'));

-- ============================================================
-- 2. Enrichir la table reviews avec sous-critères
-- ============================================================

-- Sous-critères de notation (1-5 chacun)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_reactivity INT CHECK (rating_reactivity >= 1 AND rating_reactivity <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_quality INT CHECK (rating_quality >= 1 AND rating_quality <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_communication INT CHECK (rating_communication >= 1 AND rating_communication <= 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_results INT CHECK (rating_results >= 1 AND rating_results <= 5);

-- Lien vers la candidature
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES applications(id) ON DELETE SET NULL;

-- Rôle de celui qui laisse l'avis
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_role TEXT CHECK (reviewer_role IN ('candidate', 'recruiter'));

-- Mis à jour timestamp
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON reviews(reviewed_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_application ON reviews(application_id);

-- ============================================================
-- 3. RLS reviews (compléter si manquant)
-- ============================================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les avis publics
DROP POLICY IF EXISTS "Public reviews visible to all" ON reviews;
CREATE POLICY "Public reviews visible to all"
  ON reviews FOR SELECT
  USING (is_public = true);

-- Les utilisateurs voient aussi les avis qui les concernent (même privés)
DROP POLICY IF EXISTS "Users see own reviews" ON reviews;
CREATE POLICY "Users see own reviews"
  ON reviews FOR SELECT
  USING (reviewer_id = auth.uid() OR reviewed_id = auth.uid());

-- Un utilisateur authentifié peut créer un avis
DROP POLICY IF EXISTS "Authenticated users create reviews" ON reviews;
CREATE POLICY "Authenticated users create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Un utilisateur peut modifier son propre avis
DROP POLICY IF EXISTS "Users update own reviews" ON reviews;
CREATE POLICY "Users update own reviews"
  ON reviews FOR UPDATE
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

-- ============================================================
-- 4. Ajouter 'review_request' au type de notification
-- ============================================================
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
