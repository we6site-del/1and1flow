import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            // Ensure cookies work across the domain in production
                            const cookieOptions = {
                                ...options,
                                domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
                                sameSite: 'lax' as const,
                                secure: process.env.NODE_ENV === 'production',
                            };
                            cookieStore.set(name, value, cookieOptions);
                        });
                    } catch (error) {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                        console.error('[Supabase Server] Cookie set error:', error);
                    }
                },
            },
        }
    );
}
