-- Add slug column to generations table
ALTER TABLE generations ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_generations_slug ON generations(slug);
