import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                name: 'sb-bamcwwtwtvxjjcdfbmdr-auth-token',
                ...(process.env.NODE_ENV === 'production' ? { domain: '.lunyee.cn' } : {}),
                secure: true,
                sameSite: 'lax',
            },
        }
    );
}
