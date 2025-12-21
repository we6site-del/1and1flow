import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    // Only access document in browser environment
                    if (typeof window === 'undefined') return undefined;
                    // Use document.cookie to get cookies
                    const value = `; ${document.cookie}`;
                    const parts = value.split(`; ${name}=`);
                    if (parts.length === 2) return parts.pop()?.split(';').shift();
                },
                set(name: string, value: string, options: any) {
                    // Only access document in browser environment
                    if (typeof window === 'undefined') return;
                    // Set cookie with proper options
                    let cookie = `${name}=${value}`;
                    if (options?.maxAge) {
                        cookie += `; max-age=${options.maxAge}`;
                    }
                    if (options?.path) {
                        cookie += `; path=${options.path}`;
                    }
                    if (options?.domain) {
                        cookie += `; domain=${options.domain}`;
                    }
                    if (options?.sameSite) {
                        cookie += `; samesite=${options.sameSite}`;
                    }
                    if (options?.secure) {
                        cookie += '; secure';
                    }
                    document.cookie = cookie;
                },
                remove(name: string, options: any) {
                    // Remove cookie by setting expiry to past
                    this.set(name, '', { ...options, maxAge: 0 });
                },
            },
        }
    );
}
