"use client";

import { useAiModels } from "@/hooks/useAiModels";
import { useEffect } from "react";

export default function TestModelsPage() {
    const { data: chatModels, isLoading, error } = useAiModels("CHAT");

    useEffect(() => {
        console.log("Chat Models:", chatModels);
        console.log("Loading:", isLoading);
        console.log("Error:", error);
    }, [chatModels, isLoading, error]);

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">AI Models Debug Page</h1>

            {/* API Status */}
            <div className="mb-8 p-4 border rounded-lg bg-blue-50">
                <h2 className="text-xl font-semibold mb-4">API Status</h2>
                <button
                    onClick={async () => {
                        try {
                            const res = await fetch('/api/models?type=CHAT');
                            const data = await res.json();
                            console.log('API Response:', data);
                            alert(`Found ${data.count} models:\n${JSON.stringify(data.models, null, 2)}`);
                        } catch (err: any) {
                            alert(`Error: ${err.message}`);
                        }
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Test /api/models?type=CHAT
                </button>
            </div>

            {/* Chat Models */}
            <div className="mb-8 p-4 border rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Chat Models (CHAT)</h2>

                {isLoading && (
                    <div className="text-gray-500">Loading...</div>
                )}

                {error && (
                    <div className="text-red-500 bg-red-50 p-3 rounded">
                        Error: {error.message}
                    </div>
                )}

                {!isLoading && !error && chatModels && chatModels.length === 0 && (
                    <div className="text-amber-600 bg-amber-50 p-3 rounded">
                        No chat models found. Please:
                        <ol className="list-decimal ml-5 mt-2">
                            <li>Run the SQL migration in Supabase</li>
                            <li>Add a CHAT model in /admin/ai-models</li>
                            <li>Make sure it's set to Active</li>
                        </ol>
                    </div>
                )}

                {chatModels && chatModels.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-green-600 font-semibold mb-3">
                            ✓ Found {chatModels.length} chat model(s)
                        </div>
                        {chatModels.map((model) => (
                            <div key={model.id} className="p-3 bg-gray-50 rounded border">
                                <div className="font-medium text-lg">{model.name}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                    <div>API Path: <code className="bg-gray-200 px-1 rounded">{model.api_path}</code></div>
                                    <div>Provider: {model.provider}</div>
                                    <div>Cost: {model.cost_per_gen} credits</div>
                                    <div>Active: {model.is_active ? '✓ Yes' : '✗ No'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="p-4 border rounded-lg bg-gray-50">
                <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
                <ol className="list-decimal ml-5 space-y-2">
                    <li>If models are showing above, go to any project page</li>
                    <li>Open LovartSidebar (click the "L" button)</li>
                    <li>Click the "Config" button in the top-left</li>
                    <li>You should see your models in "The Brain" section</li>
                </ol>
            </div>
        </div>
    );
}
