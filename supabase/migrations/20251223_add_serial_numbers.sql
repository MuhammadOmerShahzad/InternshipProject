-- Migration: Add serial_number column to files table
-- Created: 2025-12-23
-- Purpose: Implement persistent sequential serial numbers per module/submodule

-- Add serial_number column
ALTER TABLE public.files 
ADD COLUMN IF NOT EXISTS serial_number INTEGER NOT NULL DEFAULT 0;

-- Backfill serial numbers for existing files based on creation order
-- This ensures existing files get sequential numbers per module/submodule
WITH numbered_files AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY module_slug, submodule_slug 
      ORDER BY created_at ASC
    ) as new_serial
  FROM public.files
  WHERE serial_number = 0
)
UPDATE public.files
SET serial_number = numbered_files.new_serial
FROM numbered_files
WHERE files.id = numbered_files.id;

-- Create unique index to prevent duplicate serial numbers within same module/submodule
CREATE UNIQUE INDEX IF NOT EXISTS idx_files_serial_per_module 
ON public.files(module_slug, submodule_slug, serial_number);

-- Add comment for documentation
COMMENT ON COLUMN public.files.serial_number IS 'Sequential number per module/submodule combination, used in file paths';
