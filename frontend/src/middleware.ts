import createMiddleware from 'next-intl/middleware';
import { updateSession } from '@/utils/supabase/middleware';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
    // A list of all locales that are supported
    locales: ['en', 'zh'],

    // Used when no locale matches
    defaultLocale: 'en'
});

export async function middleware(request: NextRequest) {
    console.log(`[Middleware] Request: ${request.nextUrl.pathname}`);
    // First, handle Supabase session management and auth
    let supabaseResponse = NextResponse.next({
        request,
    });

    try {
        supabaseResponse = await updateSession(request);
    } catch (e) {
        console.error("[Middleware] Supabase session check failed, proceeding as unauth:", e);
        // Fallback: Proceed without auth check if Supabase is down/unreachable
        // This prevents 502/500 errors for the whole site
    }

    // If Supabase middleware redirected, return that response
    if (supabaseResponse.status === 307 || supabaseResponse.status === 308) {
        return supabaseResponse;
    }

    // Then, handle i18n routing
    const response = intlMiddleware(request);

    // Copy cookies from supabaseResponse to response (to preserve session updates)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, cookie);
    });

    return response;
}

export const config = {
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next`, `/_vercel` or `/supabase-proxy`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: ['/((?!api|_next|_vercel|supabase-proxy|.*\\..*).*)']
};
