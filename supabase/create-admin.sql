-- ============================================
-- HUBClosing - Création compte ADMIN
-- À exécuter APRÈS setup.sql
-- APRÈS avoir créé un compte via l'interface /auth/register
-- ============================================

-- Option 1 : Si Céline s'est déjà inscrite via le site avec clcb.pro@gmail.com
-- Mettre à jour son rôle en admin :
UPDATE public.users
SET role = 'admin'
WHERE email = 'clcb.pro@gmail.com';

-- Vérification :
SELECT id, email, role, full_name, created_at
FROM public.users
WHERE email = 'clcb.pro@gmail.com';
