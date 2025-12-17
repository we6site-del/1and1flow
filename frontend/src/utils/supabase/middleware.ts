import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    // OPTIMIZATION: On server-side, use direct URL to avoid "Self-Proxy Loop" and 111/503 errors.
    // The proxy is only needed for the client (browser).
    const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const targetUrl = publicUrl.includes('supabase-proxy')
        ? 'https://bamcwwtwtvxjjcdfbmdr.supabase.co'
        : publicUrl;

    const supabase = createServerClient(
        targetUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
            global: {
                fetch: async (url, options) => {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                    try {
                        const response = await fetch(url, {
                            ...options,
                            signal: controller.signal,
                        });
                        clearTimeout(timeoutId);
                        return response;
                    } catch (error) {
                        clearTimeout(timeoutId);
                        console.error("Supabase Middleware Network Error:", error);
                        // Do NOT return a 401 here. Throwing or returning 500 is safer 
                        // to prevent false-positive logouts.
                        throw error;
                    }
                },
            },
        }
    );

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    let user = null;
    try {
        const { data } = await supabase.auth.getUser();
        user = data.user;
    } catch (error) {
        console.error("Middleware: Failed to get user", error);
        // Treat as unauthenticated if error occurs
    }

    // Check admin routes (handle both /admin and /[locale]/admin)
    const pathname = request.nextUrl.pathname;
    const isAdminRoute = pathname.includes("/admin");

    if (isAdminRoute) {
        if (!user) {
            console.log("Middleware: Admin route accessed but no user found. Redirecting to login.");
            // No user, redirect to login
            const url = request.nextUrl.clone();
            // Preserve locale if present
            const localeMatch = pathname.match(/^\/(en|zh)/);
            const locale = localeMatch ? localeMatch[1] : 'en';
            url.pathname = `/${locale}/login`;
            url.searchParams.set("redirect", pathname);
            return NextResponse.redirect(url);
        }

        // Check admin role
        const role = user.app_metadata?.role;
        console.log(`Middleware: Admin route accessed. User: ${user.email}, Role: ${role}`);

        if (role !== "admin") {
            console.log("Middleware: User is not admin. Redirecting to home.");
            // Not an admin, redirect to home
            const url = request.nextUrl.clone();
            const localeMatch = pathname.match(/^\/(en|zh)/);
            const locale = localeMatch ? localeMatch[1] : 'en';
            url.pathname = `/${locale}`;
            return NextResponse.redirect(url);
        }
    }

    // Only redirect to login for protected routes
    const isPublicRoute =
        pathname.includes("/login") ||
        pathname.includes("/auth") ||
        pathname.includes("/admin") ||
        pathname === "/" ||
        pathname.match(/^\/(en|zh)$/);

    if (!user && !isPublicRoute) {
        // Double check if we have a session cookie before redirecting
        // This prevents redirecting when Supabase request failed but user might still have cookies
        const hasSessionCookie = request.cookies.getAll().some(c => c.name.includes('sb-') && c.name.includes('-auth-token'));

        if (hasSessionCookie) {
            console.warn("Middleware: User query failed but session cookie exists. Allowing request to proceed (Potential Network Issue).");
            return supabaseResponse;
        }

        // no user and no session cookie, redirect to login
        const url = request.nextUrl.clone();
        const localeMatch = pathname.match(/^\/(en|zh)/);
        const locale = localeMatch ? localeMatch[1] : 'en';
        url.pathname = `/${locale}/login`;
        return NextResponse.redirect(url);
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
    // creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    return supabaseResponse;
}
