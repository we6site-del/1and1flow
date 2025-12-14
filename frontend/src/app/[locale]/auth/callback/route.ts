import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ locale: string }> }
) {
    const { locale } = await params;
    const { searchParams, origin, pathname } = new URL(request.url);
    const code = searchParams.get("code");
    let next = searchParams.get("next") ?? `/${locale}`;

    // Ensure next path includes locale if it doesn't already
    if (next && !next.startsWith(`/${locale}`) && !next.startsWith("/en") && !next.startsWith("/zh")) {
        next = `/${locale}${next.startsWith("/") ? next : `/${next}`}`;
    }

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === "development";
            console.log(`[Auth Callback] Success. Redirecting to: ${next}`);
            if (isLocalEnv) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return NextResponse.redirect(`${origin}${next}`);
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`);
            } else {
                return NextResponse.redirect(`${origin}${next}`);
            }
        } else {
            console.error("[Auth Callback] Exchange code error:", error);
        }
    } else {
        console.error("[Auth Callback] No code provided");
    }

    // return the user to an error page with instructions
    console.log(`[Auth Callback] Redirecting to error page: ${origin}/${locale}/auth/auth-code-error`);
    return NextResponse.redirect(`${origin}/${locale}/auth/auth-code-error`);
}
