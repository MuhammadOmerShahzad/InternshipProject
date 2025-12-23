-- Migration: Fix user registered_modules for search functionality
-- Created: 2025-12-23
-- Purpose: Ensure all users have registered_modules populated

-- Update users with empty or null registered_modules to have all available modules
UPDATE public.users
SET registered_modules = ARRAY[
  'licenses',
  'approvals',
  'vehicles',
  'taxation',
  'certificates',
  'health-safety-environment'
]
WHERE registered_modules IS NULL OR registered_modules = '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.users.registered_modules IS 'Array of module slugs the user has access to. Required for global search functionality.';
