-- Migration: Add CHAT type to ai_models table
-- This migration updates the type check constraint to allow CHAT type

-- Step 1: Drop the existing constraint
ALTER TABLE ai_models DROP CONSTRAINT IF EXISTS ai_models_type_check;

-- Step 2: Add the new constraint with CHAT type
ALTER TABLE ai_models ADD CONSTRAINT ai_models_type_check 
    CHECK (type IN ('IMAGE', 'VIDEO', 'CHAT'));

-- Verify the change
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'ai_models_type_check';
