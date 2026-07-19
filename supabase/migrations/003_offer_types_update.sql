-- Migration 003: Ajouter les nouveaux types de contrat (challenge, recurring)
-- Les anciens types (full_time, part_time, commission_only) restent valides pour rétrocompatibilité

-- Supprimer l'ancien CHECK constraint
ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_offer_type_check;

-- Recréer avec les nouveaux types
ALTER TABLE offers ADD CONSTRAINT offers_offer_type_check
  CHECK (offer_type IN ('challenge', 'recurring', 'mission', 'full_time', 'part_time', 'commission_only'));
