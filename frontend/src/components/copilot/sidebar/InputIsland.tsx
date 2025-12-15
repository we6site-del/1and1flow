
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, AtSign, Globe, Zap, Image as ImageIcon, X, ArrowUp, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
// import { TooltipButton } from "../LovartSidebar"; // Removed to fix build error
// Recreating TooltipButton for isolation
const IconButton = ({ icon: Icon, label, onClick, isActive }: { icon: any, label: string, onClick?: () => void, isActive?: boolean }) => (
    <div className="relative group">
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
                "h-8 w-8 rounded-lg transition-colors",
                isActive ? "text-blue-600 bg-blue-50 hover:bg-blue-100" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            )}
            onClick={onClick}
        >
            <Icon className="w-4 h-4" />
        </Button>
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-md font-medium">
            {label}
        </div>
    </div>
);

interface InputIslandProps {
    input: string;
    setInput: (val: string) => void;
    onSend: (e?: React.FormEvent) => void;
    isLoading: boolean;
    selectedImage: string | null;
    onImageSelect: (file: File) => void;
    onClearImage: () => void;
    webSearchEnabled: boolean;
    onToggleWebSearch: () => void;
    children?: React.ReactNode; // For extra slots like model selector trigger
}

export function InputIsland({
    input,
    setInput,
    onSend,
    isLoading,
    selectedImage,
    onImageSelect,
    onClearImage,
    webSearchEnabled,
    onToggleWebSearch,
    children
}: InputIslandProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImageSelect(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="p-4 bg-white/80 backdrop-blur-md rounded-t-3xl border-t border-white/50 shadow-[-4px_0_20px_rgba(0,0,0,0.03)]">
            {/* Input Container */}
            <form
                onSubmit={onSend}
                className="bg-white border border-gray-200 rounded-[24px] shadow-sm p-3 focus-within:ring-2 focus-within:ring-black/5 focus-within:border-gray-300 transition-all hover:shadow-md"
            >
                {/* Image Preview */}
                {selectedImage && (
                    <div className="relative w-16 h-16 mb-2 rounded-xl overflow-hidden border border-gray-100 group">
                        <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={onClearImage}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}

                <textarea
                    className="w-full resize-none border-none focus:ring-0 text-[14px] placeholder:text-gray-400 min-h-[44px] max-h-[120px] py-2 px-1 bg-transparent leading-relaxed"
                    placeholder="Ask me anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                />

                <div className="flex items-center justify-between mt-2 pl-1">
                    <div className="flex items-center gap-1">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <IconButton
                            icon={Paperclip}
                            label="Upload Image"
                            onClick={() => fileInputRef.current?.click()}
                        />
                        <IconButton
                            icon={Globe}
                            label={webSearchEnabled ? "Web Search On" : "Web Search Off"}
                            onClick={onToggleWebSearch}
                            isActive={webSearchEnabled}
                        />
                        {/* Slot for Model Selector Trigger or other tools */}
                        {children}
                    </div>

                    <Button
                        type="submit"
                        size="icon"
                        disabled={(!input.trim() && !selectedImage) || isLoading}
                        className={cn(
                            "h-9 w-9 rounded-full transition-all shadow-sm",
                            (input.trim() || selectedImage) && !isLoading
                                ? "bg-black hover:bg-gray-800 text-white hover:scale-105 active:scale-95"
                                : "bg-gray-100 text-gray-300 hover:bg-gray-100 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <ArrowUp className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </form>

            <div className="mt-2 text-[10px] text-gray-400 text-center flex items-center justify-center gap-2 opacity-60">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> AI can make mistakes.</span>
            </div>
        </div>
    );
}
