
import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Message } from "ai";
import { type ChatRequestOptions } from "ai";
import { Editor } from "tldraw";
import { FabricGrid } from "../FabricGrid";
import { ColorPalette } from "../ColorPalette";
import { Sparkles, Bot, User, Copy, RotateCcw, Check } from "lucide-react";

// ... [Helper Components omitted for brevity if unchanged, but I need to include them if I replace the whole file or chunk] ...
// I will use replace_file_content on the component part.

// --- Helper Components & Logic (Extracted from LovartSidebar) ---
import { agentTools } from "@/lib/agent/tools";

const ClientActionExecutor = ({ type, args, editor }: { type: string, args: any, editor: any }) => {
    const hasExecuted = useRef(false);

    useEffect(() => {
        if (hasExecuted.current || !editor) return;

        const execute = async () => {
            const tool = agentTools[type as keyof typeof agentTools];
            if (tool) {
                try {
                    console.log(`Executing client action: ${type}`, args);
                    await tool.execute(editor, args);
                    hasExecuted.current = true;
                } catch (e) {
                    console.error(`Failed to execute client action ${type}`, e);
                }
            }
        };

        execute();
    }, [type, args, editor]);

    return (
        <div className="text-xs text-gray-400 italic mt-1 flex items-center gap-1 bg-gray-50 p-1.5 rounded-md border border-gray-100 max-w-fit">
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span>执行指令: {type}</span>
        </div>
    );
};

// Parser Logic
const parseMessageContent = (content: string, editor: any) => {
    // Regex to match tags including [IMAGE]
    const splitRegex = /((?:\[IMAGE\][\s\S]*?\[\/IMAGE\])|(?:<(?:FABRIC_GRID|COLOR_PALETTE|CLIENT_ACTION)[^>]*>[\s\S]*?<\/(?:FABRIC_GRID|COLOR_PALETTE)>|<CLIENT_ACTION[^>]*\/>))/g;
    const tokens = content.split(splitRegex);

    const elements = tokens.map((token, index) => {
        if (!token) return null;

        if (token.startsWith("[IMAGE]")) {
            const url = token.replace(/\[IMAGE\]|\[\/IMAGE\]/g, "");
            return (
                <div key={index} className="w-full my-2 rounded-lg overflow-hidden border border-gray-200">
                    <img src={url} alt="Uploaded content" className="w-full h-auto object-cover max-h-[300px]" />
                </div>
            );
        } else if (token.startsWith("<FABRIC_GRID>")) {
            try {
                const jsonStr = token.replace(/<\/?FABRIC_GRID>/g, "");
                const data = JSON.parse(jsonStr);
                return <FabricGrid key={index} images={data.images} prompt={data.prompt} />;
            } catch (e) { return null; }
        } else if (token.startsWith("<COLOR_PALETTE>")) {
            try {
                const jsonStr = token.replace(/<\/?COLOR_PALETTE>/g, "");
                const data = JSON.parse(jsonStr);
                return <ColorPalette key={index} colors={data.colors} />;
            } catch (e) { return null; }
        } else if (token.startsWith("<CLIENT_ACTION")) {
            try {
                const typeMatch = token.match(/type="([^"]+)"/);
                const argsMatch = token.match(/args='([^']+)'/);
                if (typeMatch && argsMatch) {
                    const type = typeMatch[1];
                    const args = JSON.parse(argsMatch[1]);
                    return <ClientActionExecutor key={index} type={type} args={args} editor={editor} />;
                }
                return null;
            } catch (e) { return null; }
        } else {
            if (!token.trim()) return null;
            return <div key={index} className="whitespace-pre-wrap">{token}</div>;
        }
    });

    return elements.filter(Boolean);
};


interface ChatAreaProps {
    messages: Message[];
    editor: Editor;
    isLoading: boolean;
    reload: (chatRequestOptions?: ChatRequestOptions) => Promise<string | null | undefined>;
    userAvatar?: string | null;
    modelIcon?: string | null;
}

export function ChatArea({ messages, editor, isLoading, reload, userAvatar, modelIcon }: ChatAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleCopy = (content: string, id: string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide pt-20" ref={scrollRef}>
            {/* Welcome State */}
            {messages.length === 0 && (
                <div className="mt-10 px-4">
                    <div className="flex justify-center mb-6">
                        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg shadow-black/20">
                            {modelIcon ? (
                                <img src={modelIcon} alt="Model" className="w-6 h-6 object-contain invert bg-transparent" />
                            ) : (
                                <Bot className="w-6 h-6 text-white" />
                            )}
                        </div>
                    </div>
                    <h3 className="text-center font-semibold text-gray-900 mb-2">How can I help you design?</h3>
                    <p className="text-center text-sm text-gray-500 max-w-[240px] mx-auto">
                        Ask me to generate images, create UI elements, or modify your canvas.
                    </p>
                </div>
            )}

            {/* Message List */}
            <div className="space-y-6 mb-6">
                {messages.map((m, index) => {
                    const isUser = m.role === "user";
                    const isLastAssistantMessage = !isUser && index === messages.length - 1;

                    return (
                        <div key={m.id} className={cn("flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out group", isUser ? "flex-row-reverse" : "")}>
                            {/* Avatar */}
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm mt-1 overflow-hidden",
                                isUser ? "bg-white border border-gray-100" : "bg-black text-white"
                            )}>
                                {isUser ? (
                                    userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" alt="User" /> : <User className="w-4 h-4 text-gray-600" />
                                ) : (
                                    modelIcon ? <img src={modelIcon} className="w-6 h-6 object-contain" alt="Bot" /> : <Bot className="w-4 h-4" />
                                )}
                            </div>

                            {/* Bubble Column */}
                            <div className={cn("max-w-[85%] flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
                                <div className={cn(
                                    "text-[14px] leading-relaxed",
                                    isUser
                                        ? "bg-[#1A1A1A] text-white px-4 py-3 rounded-[20px] rounded-tr-sm shadow-md"
                                        : "bg-white border border-gray-100 px-4 py-3.5 rounded-[20px] rounded-tl-sm shadow-sm text-gray-800"
                                )}>
                                    {parseMessageContent(m.content, editor)}
                                </div>

                                {/* Actions Area (Only for Assistant) */}
                                {!isUser && (
                                    <div className="flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleCopy(m.content, m.id)}
                                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                                            title="Copy"
                                        >
                                            {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>

                                        {/* Retry only on last message to avoid confusion */}
                                        {isLastAssistantMessage && reload && !isLoading && (
                                            <button
                                                onClick={() => reload()}
                                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5"
                                                title="Regenerate"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-medium">Retry</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {isLoading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white border border-gray-100 px-4 py-3 rounded-[20px] rounded-tl-sm shadow-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
