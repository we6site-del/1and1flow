-- Migration: Add is_default column to ai_models table
-- This column indicates if a model is the default model for its type

-- Add is_default column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ai_models' 
    AND column_name = 'is_default'
  ) THEN
    ALTER TABLE public.ai_models ADD COLUMN is_default BOOLEAN DEFAULT false;
    
    -- Create index for faster queries
    CREATE INDEX IF NOT EXISTS ai_models_is_default_idx ON public.ai_models(is_default) WHERE is_default = true;
  END IF;
END $$;

