-- Migration 004: Système de questionnaires recruteur
-- Le recruteur crée un questionnaire personnalisé (texte, QCM, oui/non)
-- Le candidat le remplit après avoir postulé
-- Les réponses sont centralisées pour le recruteur

-- ============================================================
-- 1. Table questionnaires (un questionnaire par recruteur, réutilisable)
-- ============================================================
CREATE TABLE IF NOT EXISTS questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour retrouver rapidement les questionnaires d'un recruteur
CREATE INDEX IF NOT EXISTS idx_questionnaires_recruiter ON questionnaires(recruiter_id);

-- ============================================================
-- 2. Table questionnaire_questions (les questions d'un questionnaire)
-- ============================================================
CREATE TABLE IF NOT EXISTS questionnaire_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('text', 'mcq', 'yesno')),
  options JSONB DEFAULT '[]'::jsonb,  -- Pour QCM : ["Option A", "Option B", ...]
  is_required BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_questionnaire ON questionnaire_questions(questionnaire_id);

-- ============================================================
-- 3. Table questionnaire_responses (les réponses des candidats)
-- ============================================================
CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questionnaire_questions(id) ON DELETE CASCADE,
  answer_text TEXT,           -- Pour texte libre et oui/non
  answer_options JSONB,       -- Pour QCM : options sélectionnées
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(application_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_responses_application ON questionnaire_responses(application_id);
CREATE INDEX IF NOT EXISTS idx_responses_question ON questionnaire_responses(question_id);

-- ============================================================
-- 4. Lier les offres aux questionnaires
-- ============================================================
ALTER TABLE offers ADD COLUMN IF NOT EXISTS questionnaire_id UUID REFERENCES questionnaires(id) ON DELETE SET NULL;

-- ============================================================
-- 5. RLS — Row Level Security
-- ============================================================

ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- Questionnaires : le recruteur voit/gère les siens
CREATE POLICY "Recruiters manage own questionnaires"
  ON questionnaires FOR ALL
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

-- Questionnaires : les candidats peuvent lire les questionnaires liés à des offres actives
CREATE POLICY "Candidates can read questionnaires for active offers"
  ON questionnaires FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM offers
      WHERE offers.questionnaire_id = questionnaires.id
        AND offers.status = 'active'
    )
  );

-- Questions : le recruteur gère les questions de ses questionnaires
CREATE POLICY "Recruiters manage own questions"
  ON questionnaire_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM questionnaires
      WHERE questionnaires.id = questionnaire_questions.questionnaire_id
        AND questionnaires.recruiter_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM questionnaires
      WHERE questionnaires.id = questionnaire_questions.questionnaire_id
        AND questionnaires.recruiter_id = auth.uid()
    )
  );

-- Questions : les candidats peuvent lire les questions des questionnaires d'offres actives
CREATE POLICY "Candidates can read questions for active offers"
  ON questionnaire_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM questionnaires
      JOIN offers ON offers.questionnaire_id = questionnaires.id
      WHERE questionnaires.id = questionnaire_questions.questionnaire_id
        AND offers.status = 'active'
    )
  );

-- Réponses : le candidat crée ses propres réponses
CREATE POLICY "Candidates create own responses"
  ON questionnaire_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = questionnaire_responses.application_id
        AND applications.closer_id = auth.uid()
    )
  );

-- Réponses : le candidat peut lire ses propres réponses
CREATE POLICY "Candidates read own responses"
  ON questionnaire_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = questionnaire_responses.application_id
        AND applications.closer_id = auth.uid()
    )
  );

-- Réponses : le recruteur peut lire les réponses à ses offres
CREATE POLICY "Recruiters read responses to their offers"
  ON questionnaire_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      JOIN offers ON offers.id = applications.offer_id
      WHERE applications.id = questionnaire_responses.application_id
        AND offers.manager_id = auth.uid()
    )
  );
