import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ locale: string }> }
) {
    const { locale } = await params;
    const { searchParams, origin } = new URL(request.url);

    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? `/${locale}`;

    console.log('[Auth Callback] Received request:', {
        code: code?.substring(0, 10) + '...',
        origin,
        next,
        env: process.env.NODE_ENV
    });

    if (code) {
        try {
            const supabase = await createClient();
            console.log('[Auth Callback] Supabase client created, exchanging code...');

            const { data, error } = await supabase.auth.exchangeCodeForSession(code);

            if (!error && data.session) {
                console.log('[Auth Callback] Session created successfully for user:', data.user?.email);

                // Clean up the 'next' param to avoid open redirect vulnerabilities
                const safeNext = next.startsWith('/') ? next : `/${next}`;
                const redirectUrl = `${origin}${safeNext}`;

                console.log('[Auth Callback] Redirecting to:', redirectUrl);
                return NextResponse.redirect(redirectUrl);
            } else {
                console.error("[Auth Callback] Error exchanging code:", {
                    message: error?.message,
                    status: error?.status,
                    name: error?.name
                });

                return NextResponse.redirect(
                    `${origin}/${locale}/auth/auth-code-error?error=${encodeURIComponent(error?.message || 'Unknown error')}`
                );
            }
        } catch (err) {
            console.error("[Auth Callback] Exception caught:", err);
            const errorMessage = err instanceof Error ? err.message : 'Server error';

            return NextResponse.redirect(
                `${origin}/${locale}/auth/auth-code-error?error=${encodeURIComponent(errorMessage)}`
            );
        }
    } else {
        console.error("[Auth Callback] No code received in query params");
    }

    // Fallback / Error
    return NextResponse.redirect(`${origin}/${locale}/auth/auth-code-error`);
}
