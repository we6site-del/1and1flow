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
    // 1. Update Supabase Session
    // This allows refreshing the session cookie if needed
    const supabaseResponse = await updateSession(request);

    // 2. Run i18n Middleware
    const response = intlMiddleware(request);

    // 3. Merge Cookies
    // We must ensure that any cookie updates from Supabase (like session refresh)
    // are passed down to the final response returned by i18n middleware.
    supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, cookie);
    });

    return response;
}

export const config = {
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next`, `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
