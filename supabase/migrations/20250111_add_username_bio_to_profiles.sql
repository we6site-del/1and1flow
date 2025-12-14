-- Add username and bio fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add unique constraint on username (optional, can be removed if you want to allow duplicates)
-- CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles(username) WHERE username IS NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username) WHERE username IS NOT NULL;

