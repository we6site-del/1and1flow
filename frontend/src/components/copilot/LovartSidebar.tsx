
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react";
import { useEditor, stopEventPropagation } from "tldraw";
import { useAiModels } from "@/hooks/useAiModels";
import { useAppUser } from "@/hooks/useAppUser";
import { agentTools } from "@/lib/agent/tools";

// New Components
import { SidebarContainer } from "./sidebar/SidebarContainer";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { ChatArea } from "./sidebar/ChatArea";
import { InputIsland } from "./sidebar/InputIsland";
import { ModelConfig } from "./sidebar/ModelConfig";
import { useCheckCredits } from "@/hooks/useCheckCredits";

interface LovartSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    initialPrompt?: string;
    initialImage?: string;
    projectId?: string;
    initialWebSearch?: boolean;
    initialChatModel?: string;
    initialImageModel?: string;
    initialVideoModel?: string;
}

export default function LovartSidebar({ isOpen, onToggle, initialPrompt, initialImage, projectId, initialWebSearch, initialChatModel, initialImageModel, initialVideoModel }: LovartSidebarProps) {
    const editor = useEditor();
    const [webSearchEnabled, setWebSearchEnabled] = useState(initialWebSearch || false);
    const [input, setInput] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const hasInitialSent = useRef(false);

    // Derived state for history key
    const historyKey = projectId ? `lovart_chat_history_${projectId}` : "lovart_chat_history_default";

    // --- Model Management (Brain vs Hands) ---
    const { data: models } = useAiModels();
    const modelsList = models || [];

    // Tools (Hands)
    const imageModels = useMemo(() => modelsList.filter(m => m.type === 'IMAGE'), [modelsList]);
    const videoModels = useMemo(() => modelsList.filter(m => m.type === 'VIDEO'), [modelsList]);

    // Brain (Chat) - Fetch from database
    const { data: fetchedChatModels, isLoading: chatModelsLoading, error: chatModelsError } = useAiModels("CHAT");
    const chatModels = fetchedChatModels || [];

    // Selection State
    const [selectedChatModel, setSelectedChatModel] = useState<string>(initialChatModel || "");
    const [selectedImageModel, setSelectedImageModel] = useState<string>(initialImageModel || "");
    const [selectedVideoModel, setSelectedVideoModel] = useState<string>(initialVideoModel || "");

    // Parameter State
    const [imageModelParams, setImageModelParams] = useState<Record<string, any>>({});
    const [videoModelParams, setVideoModelParams] = useState<Record<string, any>>({});

    // Initialize Defaults
    useEffect(() => {
        if (chatModels?.length > 0 && !selectedChatModel) {
            // Select first active model
            setSelectedChatModel(chatModels[0].api_path);
        }
        if (imageModels?.length > 0 && !selectedImageModel) setSelectedImageModel(imageModels[0].id);
        if (videoModels?.length > 0 && !selectedVideoModel) setSelectedVideoModel(videoModels[0].id);
    }, [chatModels, imageModels, videoModels, selectedChatModel, selectedImageModel, selectedVideoModel]);

    // --- User Data ---
    const { profile } = useAppUser();
    const userAvatar = profile?.avatar_url;

    // --- Chat Logic ---
    // Calculate model icon
    const activeChatModelDisplay = useMemo(() => {
        return chatModels.find(m => m.api_path === selectedChatModel);
    }, [chatModels, selectedChatModel]);

    const { messages, append, isLoading, setMessages, reload } = useChat({
        api: "/api/chat",
        body: {
            model: selectedChatModel,            // The Brain
            preferredImageModel: selectedImageModel, // The Hand (Image)
            preferredVideoModel: selectedVideoModel,  // The Hand (Video)
            imageModelParams,
            videoModelParams
        },
        onError: (error) => {
            console.error("Chat API Error:", error);
            // Optional: Toast error
        },
        onToolCall: async ({ toolCall }) => {
            const tool = agentTools[toolCall.toolName as keyof typeof agentTools];
            if (tool) {
                try {
                    const args = toolCall.args as any;
                    await tool.execute(editor, args);
                    console.log(`Tool ${toolCall.toolName} executed`);
                } catch (error: any) {
                    console.error(`Tool execution error for ${toolCall.toolName}:`, error);
                }
            }
        },
    });

    // --- History Persistence ---
    useEffect(() => {
        const savedHistory = localStorage.getItem(historyKey);
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory);
                if (Array.isArray(parsed)) setMessages(parsed);
            } catch (e) {
                console.error("Failed to load chat history", e);
            }
        }
    }, [projectId, historyKey, setMessages]);

    useEffect(() => {
        if (messages.length > 0) {
            // Optimization: Remove heavy Base64 images from localStorage persistence
            const messagesToSave = messages.map(m => {
                let content = m.content;
                if (typeof content === 'string' && content.includes("[IMAGE]")) {
                    // Replace base64 data with a placeholder to save space
                    // Pattern: [IMAGE]data:image...[/IMAGE]
                    content = content.replace(/\[IMAGE\]data:image\/[^;]+;base64,[^\[]+\[\/IMAGE\]/g, "[IMAGE](Image not saved in history)[/IMAGE]");
                }
                return { ...m, content };
            });

            try {
                localStorage.setItem(historyKey, JSON.stringify(messagesToSave));
            } catch (e) {
                console.error("Failed to save chat history (quota exceeded)", e);
                // If it still fails, maybe clear old history? 
                // localStorage.removeItem(historyKey);
            }
        }
    }, [messages, historyKey]);

    // --- Initial Prompt Handling ---
    useEffect(() => {
        if (hasInitialSent.current) return;
        if (initialPrompt || initialImage) {
            hasInitialSent.current = true;
            let content = initialPrompt || "";
            if (initialImage) content += `\n[IMAGE]${initialImage}[/IMAGE]`;
            append({ role: "user", content });
        }
    }, [initialPrompt, initialImage, append]);

    // --- Actions ---
    const handleClearHistory = () => {
        if (confirm("Clear chat history?")) {
            setMessages([]);
            localStorage.removeItem(historyKey);
        }
    };

    const handleShare = () => {
        const text = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
        navigator.clipboard.writeText(text);
        alert("Chat copied to clipboard");
    };

    const captureViewport = async () => {
        if (!editor) return null;
        try {
            const shapes = editor.getCurrentPageShapes();
            if (shapes.length === 0) return null;
            const ids = shapes.map(s => s.id);
            const result = await editor.toImage(ids, { format: 'png', background: true, padding: 32 });
            if (!result || !result.blob) return null;
            return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(result.blob);
            });
        } catch (e) { return null; }
    };

    const { checkCredits } = useCheckCredits();

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!input.trim() && !selectedImage) || isLoading) return;

        // Check Credits
        const cost = activeChatModelDisplay?.cost_per_gen ?? 0;
        // If cost is 0, we still might want to check if they are 'banned' or negative? 
        // But logic usually is: if (credits < cost). If cost 0, credits < 0 is false (unless debt).
        // Let's assume strict check.
        if (cost > 0 && !checkCredits(cost)) return;

        const messageContent = input.trim();
        setInput("");
        const currentImage = selectedImage;
        setSelectedImage(null);

        let finalContent = messageContent;
        if (currentImage) {
            finalContent = `${messageContent}\n[IMAGE]${currentImage}[/IMAGE]`;
        }
        if (webSearchEnabled) {
            finalContent += "\n(Please use web_search tool if needed)";
        }

        append({ role: "user", content: finalContent });
    };

    const handleImageSelect = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => setSelectedImage(reader.result as string);
        reader.readAsDataURL(file);
    };

    return (
        <>
            {/* Minimal Trigger Button */}
            {!isOpen && (
                <Button
                    onClick={onToggle}
                    variant="ghost"
                    size="icon"
                    className="fixed top-6 right-6 z-[2000] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100 hover:bg-gray-50 rounded-full h-12 w-12 transition-all hover:scale-110 active:scale-95 group"
                    onPointerDown={stopEventPropagation}
                >
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-white font-bold text-xs group-hover:rotate-12 transition-transform">L</div>
                </Button>
            )}

            <SidebarContainer isOpen={isOpen}>
                <SidebarHeader
                    onClose={onToggle}
                    onClearHistory={handleClearHistory}
                    onShare={handleShare}
                    modelConfigContent={
                        <ModelConfig
                            chatModels={chatModels}
                            imageModels={imageModels}
                            videoModels={videoModels}
                            selectedChatModel={selectedChatModel}
                            onChatModelChange={setSelectedChatModel}
                            selectedImageModel={selectedImageModel}
                            onImageModelChange={setSelectedImageModel}
                            selectedVideoModel={selectedVideoModel}
                            onVideoModelChange={setSelectedVideoModel}
                            chatModelsLoading={chatModelsLoading}
                            chatModelsError={chatModelsError}
                            // Params
                            imageModelParams={imageModelParams}
                            onImageModelParamsChange={setImageModelParams}
                            videoModelParams={videoModelParams}
                            onVideoModelParamsChange={setVideoModelParams}
                        />
                    }
                />

                <ChatArea
                    messages={messages}
                    editor={editor}
                    isLoading={isLoading}
                    reload={reload}
                    userAvatar={userAvatar}
                    modelIcon={activeChatModelDisplay?.icon_url}
                />

                <InputIsland
                    input={input}
                    setInput={setInput}
                    onSend={handleSendMessage}
                    isLoading={isLoading}
                    selectedImage={selectedImage}
                    onImageSelect={handleImageSelect}
                    onClearImage={() => setSelectedImage(null)}
                    webSearchEnabled={webSearchEnabled}
                    onToggleWebSearch={() => setWebSearchEnabled(!webSearchEnabled)}
                />
            </SidebarContainer>
        </>
    );
}
