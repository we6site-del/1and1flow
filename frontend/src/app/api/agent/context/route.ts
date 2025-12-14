import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * Returns a simplified context of available models for the AI Agent
 * This is injected into the system prompt so the agent knows what models
 * are available and what parameters they support
 */
export async function GET() {
    try {
        const supabase = await createClient();
        
        const { data, error } = await supabase
            .from("ai_models")
            .select("id, name, type, cost_per_gen, parameters_schema")
            .eq("is_active", true)
            .order("type")
            .order("name");

        if (error) {
            console.error("Error fetching model context:", error);
            return NextResponse.json(
                { error: "Failed to fetch model context" },
                { status: 500 }
            );
        }

        // Format for agent consumption
        const context = {
            models: (data || []).map(model => ({
                id: model.id,
                name: model.name,
                type: model.type,
                cost: model.cost_per_gen,
                parameters: (model.parameters_schema || []).map((param: any) => ({
                    key: param.key,
                    label: param.label,
                    type: param.type,
                    options: param.options?.map((opt: any) => opt.value) || [],
                    default: param.default,
                })),
            })),
        };

        return NextResponse.json(context);
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}


