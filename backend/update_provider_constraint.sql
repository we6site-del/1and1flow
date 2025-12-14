-- Drop the existing constraint
ALTER TABLE ai_models DROP CONSTRAINT IF EXISTS ai_models_provider_check;

-- Re-add the constraint with OPENROUTER included
ALTER TABLE ai_models ADD CONSTRAINT ai_models_provider_check 
    CHECK (provider IN ('REPLICATE', 'FAL', 'CUSTOM', 'OPENROUTER'));
