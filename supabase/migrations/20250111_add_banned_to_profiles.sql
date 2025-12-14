-- Add banned field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS profiles_banned_idx ON public.profiles(banned) WHERE banned = true;

