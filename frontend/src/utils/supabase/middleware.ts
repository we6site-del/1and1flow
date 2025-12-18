import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) => {
                        // 确保 Cookie 在生产环境中正确配置域名
                        const cookieOptions = {
                            ...options,
                            domain: process.env.NODE_ENV === 'production'
                                ? '.lunyee.cn'
                                : undefined,
                            sameSite: 'lax' as const,
                            secure: process.env.NODE_ENV === 'production',
                        };
                        supabaseResponse.cookies.set(name, value, cookieOptions);
                    });
                },
            },
        }
    );

    // IMPORTANT: DO NOT REMOVE auth.getUser()
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;

    // Define protected routes
    // We check if the path contains these segments to handle localized routes (e.g. /en/home, /zh/flow)
    const isProtectedRoute =
        path.includes('/home') ||
        path.includes('/flow') ||
        path.includes('/projects');

    // Define auth route
    const isAuthRoute = path.includes('/login');

    // 1. Unauthenticated users trying to access protected routes -> Redirect to Login
    if (!user && isProtectedRoute) {
        // Get the locale from the request path if present, defaulting to 'en'
        // Simple regex to extract locale: /en/..., /zh/...
        const localeMatch = path.match(/^\/(en|zh)\//);
        const locale = localeMatch ? localeMatch[1] : 'zh'; // Default to zh if not found or root

        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/login`;
        return NextResponse.redirect(url);
    }

    // 2. Authenticated users trying to access login page -> Redirect to Home
    if (user && isAuthRoute) {
        const localeMatch = path.match(/^\/(en|zh)\//);
        const locale = localeMatch ? localeMatch[1] : 'zh';

        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/home`;
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
