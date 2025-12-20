import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/models
 * Fetches AI models from the database
 * Query params:
 *   - type: Filter by model type (IMAGE, VIDEO, CHAT)
 */
export async function GET(request: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        // Prioritize Service Role Key to bypass RLS policies
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json(
                { error: "Supabase configuration missing" },
                { status: 500 }
            );
        }

        const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get("type");

        // Build query
        let query = supabase
            .from("ai_models")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false });

        // Filter by type if provided
        if (type) {
            query = query.eq("type", type.toUpperCase());
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching models:", error);
            return NextResponse.json(
                { error: "Failed to fetch models", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            models: data || [],
            count: data?.length || 0,
        });
    } catch (error: any) {
        console.error("Unexpected error in /api/models:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
