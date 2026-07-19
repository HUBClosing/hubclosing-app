-- Migration 006: Ajouter politique de suppression des notifications
-- Permet aux utilisateurs de supprimer leurs propres notifications lues

CREATE POLICY "Users delete own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());
