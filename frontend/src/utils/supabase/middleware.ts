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

    // 🛡️ Route Protection Logic (Safe Implementation)

    // 1. Define strictly protected page routes
    const isProtectedPage =
        path.includes('/home') ||
        path.includes('/flow') ||
        path.includes('/projects') ||
        path.includes('/admin');

    // 2. Define API/Static routes that MUST NEVER be redirected
    const isApiOrStatic =
        path.startsWith('/api') ||
        path.startsWith('/_next') ||
        path.startsWith('/static') ||
        path.includes('.'); // File extensions (e.g. css, js, eco)

    // 3. Define Auth route
    const isAuthPage = path.includes('/login');

    // 🚀 Redirect Logic

    // Case A: Unauthenticated User accessing Protected Page
    // ONLY redirect if it's a protected PAGE and NOT an API/Static resource
    if (!user && isProtectedPage && !isApiOrStatic) {
        // Extract locale or default to 'zh'
        const localeMatch = path.match(/^\/(en|zh)\//);
        const locale = localeMatch ? localeMatch[1] : 'zh';

        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/login`;
        return NextResponse.redirect(url);
    }

    // Case B: Authenticated User accessing Login Page
    if (user && isAuthPage && !isApiOrStatic) {
        const localeMatch = path.match(/^\/(en|zh)\//);
        const locale = localeMatch ? localeMatch[1] : 'zh';

        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/home`;
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
