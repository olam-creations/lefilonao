-- Migration 039: Refactor Auth to use Supabase Auth (SOTA)
-- This migration transitions from custom HMAC auth to Supabase Native Auth.

-- 1. Clean slate (Dev only!) - Remove existing users to avoid conflicts
TRUNCATE TABLE user_settings CASCADE;

-- 2. Alter table structure
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  DROP COLUMN IF EXISTS password_hash;

-- 3. Create Trigger Function to auto-create user_settings on signup
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
    plan
  )
  VALUES (
    new.email,
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'company_name', ''),
    -- Cast JSON array to TEXT[]
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(new.raw_user_meta_data->'sectors', '[]'::jsonb))),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(new.raw_user_meta_data->'regions', '[]'::jsonb))),
    'free' -- Default plan
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Update RLS Policies for user_settings
-- Enable RLS (already enabled but good to be sure)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;

-- Create new policies using Supabase Auth
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- 6. Grant access to authenticated users
GRANT SELECT, UPDATE ON public.user_settings TO authenticated;
GRANT SELECT, UPDATE ON public.user_settings TO service_role;
