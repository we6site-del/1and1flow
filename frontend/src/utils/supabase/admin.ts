/**
 * Admin Service Role Client
 * 
 * ⚠️ WARNING: This client uses the SERVICE_ROLE_KEY which bypasses RLS.
 * Only use this in Server Components or Server Actions, NEVER in Client Components.
 * 
 * This client is used for admin operations that need to bypass Row Level Security.
 */

import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Creates a Supabase client with service role key.
 * This client bypasses Row Level Security (RLS) and should only be used server-side.
 * 
 * @returns Supabase client with admin privileges
 */
export function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}

