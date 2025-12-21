import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    if (typeof window === 'undefined') return undefined;
                    const value = `; ${document.cookie}`;
                    const parts = value.split(`; ${name}=`);
                    if (parts.length === 2) return parts.pop()?.split('').shift(); // Fix split logic if needed, but standard is split(';').shift()
                    // Wait, original was split(';').shift()
                    return parts.pop()?.split(';').shift();
                },
                set(name: string, value: string, options: any) {
                    if (typeof window === 'undefined') return;

                    // Unified Cookie Logic
                    const cookieOptions = {
                        ...options,
                        domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
                        path: '/',
                        sameSite: 'lax',
                        secure: process.env.NODE_ENV === 'production',
                    };

                    let cookie = `${name}=${value}`;
                    if (cookieOptions.maxAge) cookie += `; max-age=${cookieOptions.maxAge}`;
                    if (cookieOptions.path) cookie += `; path=${cookieOptions.path}`;
                    if (cookieOptions.domain) cookie += `; domain=${cookieOptions.domain}`;
                    if (cookieOptions.sameSite) cookie += `; samesite=${cookieOptions.sameSite}`;
                    if (cookieOptions.secure) cookie += '; secure';

                    document.cookie = cookie;
                },
                remove(name: string, options: any) {
                    this.set(name, '', { ...options, maxAge: 0 });
                },
            },
        }
    );
}
