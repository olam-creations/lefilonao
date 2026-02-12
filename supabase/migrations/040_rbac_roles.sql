-- Migration 040: Role-Based Access Control (RBAC)
-- Adds 'role' to user_settings and syncs it to Supabase Auth metadata for JWT availability.

-- 1. Create Role Enum
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('free', 'pro', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add Role column to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'free';

-- 3. Update handle_new_user trigger to include default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (
    user_email,
    user_id,
    display_name,
    first_name,
    company,
    default_cpv,
    default_regions,
    plan,
    role
  )
  VALUES (
    new.email,
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'company_name', ''),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(new.raw_user_meta_data->'sectors', '[]'::jsonb))),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(new.raw_user_meta_data->'regions', '[]'::jsonb))),
    CASE 
      WHEN new.email IN ('kleinschmidt.jonas@gmail.com', 'dev@lefilonao.com') THEN 'pro' 
      ELSE 'free' 
    END,
    CASE 
      WHEN new.email = 'dev@lefilonao.com' THEN 'admin'::public.user_role 
      WHEN new.email = 'kleinschmidt.jonas@gmail.com' THEN 'pro'::public.user_role
      ELSE 'free'::public.user_role 
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to sync role from user_settings back to auth.users (app_metadata)
-- This makes the role available in the JWT token itself!
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', new.role)
  WHERE id = new.user_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach Sync Trigger
DROP TRIGGER IF EXISTS on_user_settings_role_update ON public.user_settings;
CREATE TRIGGER on_user_settings_role_update
  AFTER INSERT OR UPDATE OF role ON public.user_settings
  FOR EACH ROW EXECUTE PROCEDURE public.sync_user_role();

-- 6. Set Jonas as Admin (if exists)
UPDATE public.user_settings 
SET role = 'admin', plan = 'pro' 
WHERE user_email = 'kleinschmidt.jonas@gmail.com';
