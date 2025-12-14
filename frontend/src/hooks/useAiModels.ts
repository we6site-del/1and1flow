import { useQuery } from "@tanstack/react-query";

export type AiModel = {
    id: string;
    name: string;
    type: "IMAGE" | "VIDEO" | "CHAT";
    provider: "REPLICATE" | "FAL" | "CUSTOM" | "OPENROUTER";
    api_path: string;
    cost_per_gen: number;
    is_active: boolean;
    parameters_schema: any[];
    description?: string;
    icon_url?: string;
    created_at: string;
    updated_at: string;
};

export function useAiModels(type?: "IMAGE" | "VIDEO" | "CHAT") {
    return useQuery<AiModel[]>({
        queryKey: ["ai-models", type],
        queryFn: async () => {
            const url = type
                ? `/api/models?type=${type}`
                : "/api/models";
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Failed to fetch models");
            }
            const data = await response.json();
            return data.models || [];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes - models don't change often
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
}

export function useModelById(modelId: string) {
    return useQuery<AiModel | null>({
        queryKey: ["ai-model", modelId],
        queryFn: async () => {
            const response = await fetch("/api/models");
            if (!response.ok) {
                throw new Error("Failed to fetch models");
            }
            const data = await response.json();
            return data.models?.find((m: AiModel) => m.id === modelId) || null;
        },
        enabled: !!modelId,
        staleTime: 5 * 60 * 1000,
    });
}


