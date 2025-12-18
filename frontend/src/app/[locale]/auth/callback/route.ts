import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ locale: string }> }
) {
    const { locale } = await params;
    const { searchParams, origin } = new URL(request.url);

    const code = searchParams.get("code");
    // Default to locale root if no 'next' param
    const next = searchParams.get("next") ?? `/${locale}`;

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Successful login
            // Construct the forward URL
            const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
            const isLocal = process.env.NODE_ENV === 'development';

            // If behind a proxy/load balancer, we might want to respect that, 
            // but for now, let's stick to the request origin or NEXT_PUBLIC_SITE_URL
            // to avoid mismatch.

            // Clean up the 'next' param to avoid open redirect vulnerabilities
            // ensure it starts with / and doesn't contain protocol
            const safeNext = next.startsWith('/') ? next : `/${next}`;

            return NextResponse.redirect(`${origin}${safeNext}`);
        } else {
            console.error("[Auth Callback] Error exchanging code:", error);
        }
    } else {
        console.error("[Auth Callback] No code received");
    }

    // Fallback / Error
    return NextResponse.redirect(`${origin}/${locale}/auth/auth-code-error`);
}
