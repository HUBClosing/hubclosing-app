-- ============================================
-- Migration 009: Enable Realtime for messaging
-- ============================================

-- Activer la réplication Realtime sur les tables messages et conversations
-- Cela permet à Supabase de diffuser les INSERT/UPDATE/DELETE en temps réel

-- Messages : diffuser INSERT (nouveaux messages) et UPDATE (read_at)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Conversations : diffuser UPDATE (last_message_at change)
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- ============================================
-- RLS pour Realtime (les policies existantes s'appliquent)
-- Supabase Realtime respecte les RLS policies.
-- On s'assure que les policies SELECT existent déjà.
-- ============================================

-- Vérifier que la policy SELECT sur messages existe (elle devrait déjà exister)
-- Si pas, en créer une :
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'messages'
    AND policyname = 'Users can read their own messages'
  ) THEN
    CREATE POLICY "Users can read their own messages"
      ON messages FOR SELECT
      USING (
        conversation_id IN (
          SELECT id FROM conversations
          WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
        )
      );
  END IF;
END$$;

-- Vérifier que la policy SELECT sur conversations existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'conversations'
    AND policyname = 'Users can read their own conversations'
  ) THEN
    CREATE POLICY "Users can read their own conversations"
      ON conversations FOR SELECT
      USING (
        participant_1 = auth.uid() OR participant_2 = auth.uid()
      );
  END IF;
END$$;

-- ============================================
-- Index pour accélérer les requêtes de messages non lus
-- ============================================

-- Index composé pour compter rapidement les messages non lus par conversation
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages (conversation_id, sender_id, read_at)
  WHERE read_at IS NULL;

-- Index pour trier les conversations par dernière activité
CREATE INDEX IF NOT EXISTS idx_conversations_last_message
  ON conversations (last_message_at DESC NULLS LAST);
