-- =============================================================
-- Migration 011 : Call Stats Tracking + Coaching Bookings
-- =============================================================

-- ─── Table call_stats ────────────────────────────────────────
-- Chaque ligne = les stats d'un closer pour un event donné
CREATE TABLE IF NOT EXISTS call_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Event info
  event_type TEXT NOT NULL CHECK (event_type IN ('challenge', 'webinaire', 've')),
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,

  -- Stats brutes
  total_calls INTEGER NOT NULL DEFAULT 0 CHECK (total_calls >= 0),
  ns_count INTEGER NOT NULL DEFAULT 0 CHECK (ns_count >= 0),
  cancelled_count INTEGER NOT NULL DEFAULT 0 CHECK (cancelled_count >= 0),
  total_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_revenue >= 0),

  -- Métriques calculées (dénormalisées pour performance)
  effective_calls INTEGER GENERATED ALWAYS AS (total_calls - ns_count - cancelled_count) STORED,
  cash_per_call NUMERIC(12, 2) GENERATED ALWAYS AS (
    CASE
      WHEN (total_calls - ns_count - cancelled_count) > 0
      THEN total_revenue / (total_calls - ns_count - cancelled_count)
      ELSE 0
    END
  ) STORED,

  -- Notes optionnelles
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_call_stats_user ON call_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_call_stats_date ON call_stats(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_call_stats_user_date ON call_stats(user_id, event_date DESC);

-- ─── Table coaching_bookings ─────────────────────────────────
-- Réservations de coaching individuel (payant)
CREATE TABLE IF NOT EXISTS coaching_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Infos booking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),

  -- Fiche pré-RDV
  current_cash_per_call NUMERIC(12, 2),
  main_challenge TEXT,        -- "Quel est ton plus gros challenge en closing ?"
  experience_months INTEGER,  -- "Depuis combien de mois tu closes ?"
  niche TEXT,                 -- "Dans quelle niche tu travailles ?"
  goals TEXT,                 -- "Qu'est-ce que tu veux améliorer ?"
  availability TEXT,          -- "Tes disponibilités cette semaine ?"

  -- Paiement
  price NUMERIC(8, 2) DEFAULT 0,
  stripe_payment_id TEXT,
  paid_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coaching_user ON coaching_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_status ON coaching_bookings(status);

-- ─── RLS ─────────────────────────────────────────────────────
ALTER TABLE call_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_bookings ENABLE ROW LEVEL SECURITY;

-- call_stats : chaque user voit/modifie ses propres stats
CREATE POLICY "Users read own call_stats"
  ON call_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own call_stats"
  ON call_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own call_stats"
  ON call_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own call_stats"
  ON call_stats FOR DELETE
  USING (auth.uid() = user_id);

-- Les profils publics : tout le monde peut voir les stats (pour médailles)
CREATE POLICY "Public read call_stats"
  ON call_stats FOR SELECT
  USING (true);

-- coaching_bookings : user voit ses propres bookings
CREATE POLICY "Users read own coaching_bookings"
  ON coaching_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own coaching_bookings"
  ON coaching_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role (admin) peut tout voir via getSupabaseAdmin()
