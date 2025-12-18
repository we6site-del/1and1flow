import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
    const cookieStore = await cookies();

    // OPTIMIZATION: On server-side, use direct URL to avoid "Self-Proxy Loop"
    const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const targetUrl = publicUrl.includes('supabase-proxy')
        ? 'https://bamcwwtwtvxjjcdfbmdr.supabase.co'
        : publicUrl;

    return createServerClient(
        targetUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                name: 'sb-bamcwwtwtvxjjcdfbmdr-auth-token',
            },
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, {
                                ...options,
                                ...(process.env.NODE_ENV === 'production' ? { domain: '.lunyee.cn' } : {}),
                                secure: true,
                                sameSite: 'lax'
                            })
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );
}
