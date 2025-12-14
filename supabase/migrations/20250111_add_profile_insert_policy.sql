-- Add INSERT policy for profiles table
-- This allows users to create their own profile if it doesn't exist

-- Check if policy already exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile" ON public.profiles
        FOR INSERT
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

