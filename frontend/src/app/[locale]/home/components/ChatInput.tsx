"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { ArrowUp, Globe, Paperclip, Lightbulb, Zap, Box, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { projectService } from "@/services/projectService";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useAiModels } from "@/hooks/useAiModels";
import { ModelConfig } from "@/components/copilot/sidebar/ModelConfig";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

const EXAMPLE_PROMPTS = [
    "A futuristic fashion concept featuring bioluminescent fabrics in a cyberpunk setting",
    "A minimal sustainable coffee shop interior with warm wood tones and plenty of plants",
    "A surreal landscape with floating islands and waterfalls in a dreamlike style",
    "A professional UI design for a wellness app with soft pastel colors",
    "A high-fashion editorial shoot of a avant-garde dress made of recycled plastic"
];

export default function ChatInput() {
    const [input, setInput] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [isWebSearch, setIsWebSearch] = useState(false);

    // --- Model Selection State ---
    const [selectedChatModel, setSelectedChatModel] = useState<string>("");
    const [selectedImageModel, setSelectedImageModel] = useState<string>("");
    const [selectedVideoModel, setSelectedVideoModel] = useState<string>("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Fetch Models ---
    // 1. Fetch generic models (Image/Video are usually in generic endpoint or filtered)
    // Actually useAiModels() returns all if no type default? No, useAiModels(type)
    // Sidebar uses:
    // const { data: models } = useAiModels(); -> All?
    // Let's check hook: url = type ? ... : "/api/models". Yes returns all.
    const { data: allModels } = useAiModels();
    const modelsList = allModels || [];

    const imageModels = useMemo(() => modelsList.filter(m => m.type === 'IMAGE'), [modelsList]);
    const videoModels = useMemo(() => modelsList.filter(m => m.type === 'VIDEO'), [modelsList]);

    // 2. Fetch Chat models specifically (as sidebar does)
    const { data: chatModelsData, isLoading: chatModelsLoading, error: chatModelsError } = useAiModels("CHAT");
    const chatModels = chatModelsData || [];

    // Initialize Defaults
    useEffect(() => {
        if (chatModels?.length > 0 && !selectedChatModel) {
            setSelectedChatModel(chatModels[0].api_path);
        }
        if (imageModels?.length > 0 && !selectedImageModel) {
            setSelectedImageModel(imageModels[0].id);
        }
        if (videoModels?.length > 0 && !selectedVideoModel) {
            setSelectedVideoModel(videoModels[0].id);
        }
    }, [chatModels, imageModels, videoModels, selectedChatModel, selectedImageModel, selectedVideoModel]);

    // --- Finding Active Model Name for Button Title ---
    // Prefer showing Chat Model name as it's the "Brain"
    const activeChatModelName = chatModels.find(m => m.api_path === selectedChatModel)?.name || "Model";

    // --- Actions ---

    const handleRandomPrompt = () => {
        const random = EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)];
        setInput(random);
    };

    const handleRefine = async () => {
        if (!input.trim()) return;
        setIsRefining(true);
        try {
            const res = await fetch("/api/chat/refine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: input })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.refined_prompt) {
                    setInput(data.refined_prompt);
                }
            }
        } catch (e) {
            console.error("Refine failed", e);
        } finally {
            setIsRefining(false);
        }
    };

    const handleCreateProject = async () => {
        if (!input.trim() && !selectedImage) return;
        setIsLoading(true);

        try {
            let imageUrl = "";
            if (selectedImage) {
                // Upload image
                const formData = new FormData();
                const res = await fetch(selectedImage);
                const blob = await res.blob();
                formData.append("file", blob, "image.png");

                const uploadRes = await fetch("/api/upload/image", {
                    method: "POST",
                    body: formData,
                });

                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    imageUrl = data.url;
                }
            }

            const projectId = uuidv4();
            const projectTitle = input.trim() || "New Project";
            await projectService.createProject(projectTitle, projectId);

            // Navigate
            const params = new URLSearchParams();
            params.append("agent", "1");
            if (input.trim()) params.append("prompt", input);
            if (imageUrl) params.append("image", imageUrl);
            if (isWebSearch) params.append("web_search", "1");

            // Append Model Selections
            if (selectedChatModel) params.append("chat_model", selectedChatModel);
            if (selectedImageModel) params.append("image_model", selectedImageModel);
            if (selectedVideoModel) params.append("video_model", selectedVideoModel);

            router.push(`/flow/${projectId}?${params.toString()}`);
        } catch (error) {
            console.error("Failed to create project:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            handleCreateProject();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };


    // Typewriter effect for placeholder
    const fullPlaceholder = "让 1:1Flow研究、灵感板、打样和拍摄压缩到几分钟内完成，让团队有更多时间投入创意和优秀的提案。";
    const [placeholder, setPlaceholder] = useState("");

    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex <= fullPlaceholder.length) {
                setPlaceholder(fullPlaceholder.slice(0, currentIndex));
                currentIndex++;
            } else {
                clearInterval(interval);
            }
        }, 50); // Speed of typing

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full max-w-3xl mx-auto relative group">
            <div className="relative bg-[#F9FAFB] border border-gray-200 rounded-[32px] shadow-sm hover:shadow-md transition-all p-4 min-h-[80px] flex flex-col justify-center">
                <div className="flex items-center gap-3">
                    {/* Attachment Button */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full h-10 w-10 flex-shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip className="w-5 h-5" />
                    </Button>

                    {/* Input Area */}
                    <div className="flex-1 flex flex-col">
                        {selectedImage && (
                            <div className="relative w-16 h-16 mb-2 rounded-lg overflow-hidden border border-gray-200 group/img">
                                <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                        <textarea
                            ref={(el) => {
                                if (el) {
                                    el.style.height = 'auto';
                                    el.style.height = el.scrollHeight + 'px';
                                }
                            }}
                            className="w-full resize-none border-none focus:ring-0 focus:outline-none focus-visible:ring-0 text-base placeholder:text-gray-400 bg-transparent py-2 px-0 min-h-[24px] max-h-[120px] scrollbar-hide"
                            placeholder={placeholder}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                        />
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
                            {/* Lightbulb */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleRandomPrompt}
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full h-9 w-9"
                                title="Random Inspiration"
                            >
                                <Lightbulb className="w-5 h-5" />
                            </Button>

                            {/* Zap */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleRefine}
                                disabled={isRefining || !input.trim()}
                                className={cn("rounded-full h-9 w-9 transition-colors", isRefining ? "text-yellow-500 bg-yellow-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")}
                                title="Magic Refine"
                            >
                                {isRefining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                            </Button>

                            {/* Globe */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsWebSearch(!isWebSearch)}
                                className={cn("rounded-full h-9 w-9 transition-colors", isWebSearch ? "text-blue-500 bg-blue-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")}
                                title="Web Search"
                            >
                                <Globe className="w-5 h-5" />
                            </Button>

                            {/* Box: Full Model Config */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        // Active if ANY non-default model is selected? Hard to define non-default easily.
                                        // Just make it purple if open or customized. For now grey.
                                        className={cn("rounded-full h-9 w-9 transition-colors", "text-gray-400 hover:text-gray-600 hover:bg-gray-100")}
                                        title={`Selected: ${activeChatModelName}`}
                                    >
                                        <Box className="w-5 h-5" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[320px] p-4 bg-white/95 backdrop-blur-md border-gray-200 shadow-xl" align="end">
                                    {/* Reuse ModelConfig component */}
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
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <Button
                            size="icon"
                            className={`rounded-full h-10 w-10 transition-colors ${input.trim() || selectedImage ? 'bg-gray-400 hover:bg-gray-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            disabled={(!input.trim() && !selectedImage) || isLoading}
                            onClick={handleCreateProject}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <ArrowUp className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

