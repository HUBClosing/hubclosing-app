-- ============================================
-- Migration 010: Durcissement sécurité RLS
-- ============================================

-- ─── CRITIQUE 1 : Verrouiller l'INSERT sur notifications ───
-- Avant : tout utilisateur authentifié pouvait créer une notif pour n'importe qui
-- Après : on ne peut créer que ses propres notifications (le serveur utilise service_role)
DROP POLICY IF EXISTS "Authenticated users create notifications" ON notifications;
CREATE POLICY "Users create own notifications"
  ON notifications FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ─── CRITIQUE 2 : Policy UPDATE sur messages (marquer lu) ───
-- Permet uniquement au destinataire de mettre à jour read_at
CREATE POLICY "Receiver can mark messages as read"
  ON messages FOR UPDATE
  USING (
    sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
  )
  WITH CHECK (
    sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
  );

-- ─── HIGH 1 : Restreindre SELECT sur users aux authentifiés ───
-- Avant : USING (true) — exposé même aux requêtes anonymes
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
CREATE POLICY "Authenticated users can view users"
  ON users FOR SELECT
  USING (auth.role() = 'authenticated');
