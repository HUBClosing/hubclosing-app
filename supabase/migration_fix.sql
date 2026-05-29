-- =====================================================
-- MIGRATION HUBCLOSING — À exécuter dans Supabase SQL Editor
-- Corrige la contrainte role, ajoute les colonnes manquantes,
-- met à jour le trigger de création d'utilisateur
-- =====================================================

-- 1. Modifier la contrainte CHECK sur role pour ajouter 'pending'
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role IN ('closer', 'manager', 'admin', 'pending'));

-- 2. Mettre le défaut du role à 'pending'
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'pending';

-- 3. Ajouter les colonnes manquantes (si elles n'existent pas déjà)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'personal_email') THEN
    ALTER TABLE public.users ADD COLUMN personal_email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'years_experience') THEN
    ALTER TABLE public.users ADD COLUMN years_experience INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'niches') THEN
    ALTER TABLE public.users ADD COLUMN niches TEXT[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'infopreneur_type') THEN
    ALTER TABLE public.users ADD COLUMN infopreneur_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'sub_role') THEN
    ALTER TABLE public.users ADD COLUMN sub_role TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') THEN
    ALTER TABLE public.users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END $$;

-- 4. Mettre à jour le trigger handle_new_user pour créer avec role 'pending'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    'pending',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Créer la table notifications (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('bug', 'suggestion', 'signalement', 'urgent', 'general')),
  sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. RLS pour notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Admins peuvent tout faire
CREATE POLICY IF NOT EXISTS "Admins full access notifications" ON public.notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- Utilisateurs authentifiés peuvent créer des notifications
CREATE POLICY IF NOT EXISTS "Users can create notifications" ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Utilisateurs peuvent voir leurs propres notifications
CREATE POLICY IF NOT EXISTS "Users can view own notifications" ON public.notifications FOR SELECT
  USING (auth.uid() = sender_id);

-- 7. S'assurer que l'admin clcb.pro@gmail.com est bien configuré
UPDATE public.users SET role = 'admin' WHERE email = 'clcb.pro@gmail.com';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
