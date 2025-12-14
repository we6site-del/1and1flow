"use client";

import { useState } from "react";
// import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Copy, Check, MousePointer2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface GalleryItem {
    id: string;
    title: string;
    prompt: string;
    image_url: string;
    negative_prompt?: string;
    model_config?: any;
    category?: string;
    tags?: string[];
}

interface GalleryCardProps {
    item: GalleryItem;
    onSelect: (item: GalleryItem) => void;
}

export function GalleryCard({ item, onSelect }: GalleryCardProps) {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(item.prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ description: "Prompt copied to clipboard" });
    };

    return (
        <div className="group relative break-inside-avoid mb-4 rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800 transition-all duration-300 hover:shadow-lg cursor-pointer transform hover:-translate-y-1">
            {/* Media */}
            <div className="relative w-full">
                {item.image_url.match(/\.(mp4|webm|mov)$/i) ? (
                    <video
                        src={item.image_url}
                        className="w-full h-auto object-cover"
                        loop
                        muted
                        playsInline
                        autoPlay
                        onMouseOver={e => e.currentTarget.play()}
                        onMouseOut={e => e.currentTarget.pause()}
                    />
                ) : (
                    <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                )}

                {/* Overlay (Visible on Hover) */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />

                <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="flex justify-between items-center gap-2">
                        <span className="text-white font-medium text-xs truncate flex-1 shadow-black/50 drop-shadow-md">
                            {item.title}
                        </span>
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-7 w-7 rounded-full bg-white/90 hover:bg-white text-black shadow-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(item);
                            }}
                        >
                            <MousePointer2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
