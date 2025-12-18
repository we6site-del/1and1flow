import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ locale: string }> }
) {
    const { locale } = await params;
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    let next = searchParams.get("next") ?? `/${locale}`;

    if (next && !next.startsWith(`/${locale}`) && !next.startsWith("/en") && !next.startsWith("/zh")) {
        next = `/${locale}${next.startsWith("/") ? next : `/${next}`}`;
    }

    // Define siteUrl globally
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            const isLocal = process.env.NODE_ENV === "development";
            console.log(`[Auth Callback] Success. Redirecting to: ${next}`);
            return NextResponse.redirect(`${isLocal ? origin : siteUrl}${next}`);
        } else {
            console.error("[Auth Callback] Exchange Error:", error);
        }
    } else {
        console.error("[Auth Callback] No code provided");
    }

    // Redirect to Error Page
    const errorUrl = `${siteUrl}/${locale}/auth/auth-code-error`;
    console.log(`[Auth Callback] Redirecting to error page: ${errorUrl}`);
    return NextResponse.redirect(errorUrl);
}
