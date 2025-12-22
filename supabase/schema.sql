-- =============================================
-- MUAWIN DATABASE SCHEMA
-- =============================================
-- This file contains the complete database schema for Muawin.
-- Execute this in Supabase Dashboard > SQL Editor
-- =============================================

-- =============================================
-- 0. CLEANUP (Drop existing tables if any)
-- =============================================
-- Drop in reverse dependency order

DROP VIEW IF EXISTS public.users_with_details;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.branches CASCADE;
DROP TABLE IF EXISTS public.zones CASCADE;
DROP TYPE IF EXISTS zone_type;

-- =============================================
-- 1. ZONES TABLE
-- =============================================

-- Zones table (Zone A through Zone F)
CREATE TABLE IF NOT EXISTS public.zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE, -- 'A', 'B', 'C', 'D', 'E', 'F'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert zones
INSERT INTO public.zones (name, code) VALUES
  ('Zone A', 'A'),
  ('Zone B', 'B'),
  ('Zone C', 'C'),
  ('Zone D', 'D'),
  ('Zone E', 'E'),
  ('Zone F', 'F')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 2. BRANCHES TABLE
-- =============================================

-- Branches table (linked to zones)
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert branches for each zone
WITH zone_a AS (SELECT id FROM public.zones WHERE code = 'A'),
     zone_b AS (SELECT id FROM public.zones WHERE code = 'B'),
     zone_c AS (SELECT id FROM public.zones WHERE code = 'C'),
     zone_d AS (SELECT id FROM public.zones WHERE code = 'D'),
     zone_e AS (SELECT id FROM public.zones WHERE code = 'E'),
     zone_f AS (SELECT id FROM public.zones WHERE code = 'F')
INSERT INTO public.branches (name, zone_id) VALUES
  -- Zone A
  ('Cheezious Headquarters', (SELECT id FROM zone_a)),
  ('Cheezious I-8', (SELECT id FROM zone_a)),
  ('Cheezious F-7/1', (SELECT id FROM zone_a)),
  ('Cheezious F-7/2', (SELECT id FROM zone_a)),
  ('Cheezious G-9', (SELECT id FROM zone_a)),
  
  -- Zone B
  ('Cheezious F-10', (SELECT id FROM zone_b)),
  ('Cheezious F-11', (SELECT id FROM zone_b)),
  ('Cheezious E-11', (SELECT id FROM zone_b)),
  ('Cheezious WAH CANTT', (SELECT id FROM zone_b)),
  ('Cheezious G-13', (SELECT id FROM zone_b)),
  ('Cheezious GOLRA', (SELECT id FROM zone_b)),
  
  -- Zone C
  ('Cheezious SADDAR', (SELECT id FROM zone_c)),
  ('Cheezious Commercial 1 & 2', (SELECT id FROM zone_c)),
  ('Cheezious OLD WORKSHOP', (SELECT id FROM zone_c)),
  ('Cheezious Support Center', (SELECT id FROM zone_c)),
  
  -- Zone D
  ('Cheezious GHAURI TOWN', (SELECT id FROM zone_d)),
  ('Cheezious TRAMRI', (SELECT id FROM zone_d)),
  ('Cheezious PWD', (SELECT id FROM zone_d)),
  ('Cheezious SCHEME 3', (SELECT id FROM zone_d)),
  
  -- Zone E
  ('Cheezious ADYALA', (SELECT id FROM zone_e)),
  ('Cheezious KALMA', (SELECT id FROM zone_e)),
  ('Cheezious BAHRIA', (SELECT id FROM zone_e)),
  ('Cheezious ZARAJ GT ROAD', (SELECT id FROM zone_e)),
  ('Cheezious GIGA', (SELECT id FROM zone_e)),
  ('Cheezious Warehouse HUMAK', (SELECT id FROM zone_e)),
  
  -- Zone F
  ('Cheezious PESHAWAR', (SELECT id FROM zone_f)),
  ('Cheezious MARDAN', (SELECT id FROM zone_f))
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 3. USERS TABLE
-- =============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  -- Primary key linked to Supabase Auth
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT,
  name TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN last_name IS NOT NULL THEN first_name || ' ' || last_name
      ELSE first_name
    END
  ) STORED,
  email TEXT NOT NULL UNIQUE,
  
  -- Role & Permissions
  role TEXT NOT NULL DEFAULT 'Admin',
  
  -- Organization Hierarchy (references to zones and branches tables)
  zone_id UUID NOT NULL REFERENCES public.zones(id),
  branch_id UUID NOT NULL REFERENCES public.branches(id),
  
  -- Module Permissions (array of module names user has access to)
  registered_modules TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_branches_zone_id ON public.branches(zone_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_zone_id ON public.users(zone_id);
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON public.users(branch_id);

-- =============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Zones policies (read-only for all authenticated users)
CREATE POLICY "zones_read_all" 
  ON public.zones 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Branches policies (read-only for all authenticated users)
CREATE POLICY "branches_read_all" 
  ON public.branches 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Users policies
CREATE POLICY "users_read_own_profile" 
  ON public.users 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "admins_read_all_users" 
  ON public.users 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'Admin'
    )
  );

CREATE POLICY "admins_create_users" 
  ON public.users 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'Admin'
    )
  );

CREATE POLICY "admins_update_users" 
  ON public.users 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'Admin'
    )
  );

CREATE POLICY "users_update_own_profile" 
  ON public.users 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================
-- 6. FUNCTIONS & TRIGGERS
-- =============================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at on users table
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 7. HELPER VIEWS
-- =============================================

-- View: Users with zone and branch names (for easier querying)
CREATE OR REPLACE VIEW public.users_with_details AS
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.name,
  u.email,
  u.role,
  u.zone_id,
  z.name AS zone_name,
  z.code AS zone_code,
  u.branch_id,
  b.name AS branch_name,
  u.registered_modules,
  u.created_at,
  u.updated_at
FROM public.users u
LEFT JOIN public.zones z ON u.zone_id = z.id
LEFT JOIN public.branches b ON u.branch_id = b.id;

-- =============================================
-- SETUP COMPLETE
-- =============================================
-- Next steps:
-- 1. Create your first admin user via Supabase Auth
-- 2. Insert corresponding profile in users table
-- 3. Use the user actions in lib/actions/users.ts
-- =============================================
