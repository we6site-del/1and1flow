"use client";

import { useAiModels } from "@/hooks/useAiModels";
import { useEffect } from "react";

export default function TestModelsPage() {
    const { data: chatModels, isLoading, error } = useAiModels("CHAT");
    const { data: imageModels } = useAiModels("IMAGE");
    const { data: videoModels } = useAiModels("VIDEO");

    useEffect(() => {
        console.log("Chat Models:", chatModels);
        console.log("Image Models:", imageModels);
        console.log("Video Models:", videoModels);
        console.log("Loading:", isLoading);
        console.log("Error:", error);
    }, [chatModels, imageModels, videoModels, isLoading, error]);

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">AI Models Debug Page</h1>

            {/* Chat Models */}
            <div className="mb-8 p-4 border rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Chat Models (CHAT)</h2>
                {isLoading && <p className="text-gray-500">Loading...</p>}
                {error && <p className="text-red-500">Error: {error.message}</p>}
                {chatModels && chatModels.length === 0 && (
                    <p className="text-amber-600">No chat models found. Add models in /admin/ai-models</p>
                )}
                {chatModels && chatModels.length > 0 && (
                    <div className="space-y-2">
                        {chatModels.map((model) => (
                            <div key={model.id} className="p-3 bg-gray-50 rounded">
                                <div className="font-medium">{model.name}</div>
                                <div className="text-sm text-gray-600">API Path: {model.api_path}</div>
                                <div className="text-sm text-gray-600">Provider: {model.provider}</div>
                                <div className="text-sm text-gray-600">Cost: {model.cost_per_gen} credits</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Image Models */}
            <div className="mb-8 p-4 border rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Image Models (IMAGE)</h2>
                {imageModels && imageModels.length === 0 && <p className="text-gray-500">No image models</p>}
                {imageModels && imageModels.length > 0 && (
                    <div className="text-sm text-gray-600">Count: {imageModels.length}</div>
                )}
            </div>

            {/* Video Models */}
            <div className="mb-8 p-4 border rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Video Models (VIDEO)</h2>
                {videoModels && videoModels.length === 0 && <p className="text-gray-500">No video models</p>}
                {videoModels && videoModels.length > 0 && (
                    <div className="text-sm text-gray-600">Count: {videoModels.length}</div>
                )}
            </div>

            {/* API Test */}
            <div className="p-4 border rounded-lg bg-blue-50">
                <h2 className="text-xl font-semibold mb-4">API Test</h2>
                <button
                    onClick={async () => {
                        const res = await fetch('/api/models?type=CHAT');
                        const data = await res.json();
                        console.log('API Response:', data);
                        alert(JSON.stringify(data, null, 2));
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Test /api/models?type=CHAT
                </button>
            </div>
        </div>
    );
}
