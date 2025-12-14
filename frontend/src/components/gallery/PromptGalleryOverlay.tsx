"use client";

import { useEffect, useState } from "react";
import Masonry from "react-masonry-css";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Search, Filter, Copy, ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { GalleryCard, GalleryItem } from "./GalleryCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PromptGalleryOverlayProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (item: GalleryItem) => void;
}

export function PromptGalleryOverlay({ open, onOpenChange, onSelect }: PromptGalleryOverlayProps) {
    const supabase = createClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

    // Fetch Categories
    const { data: categories = [] } = useQuery({
        queryKey: ["prompt-categories"],
        queryFn: async () => {
            const { data } = await supabase
                .from("curated_prompts")
                .select("category")
                .eq("is_active", true); // Or use API /api/prompts/categories if preferred
            // Unique categories
            if (!data) return [];
            return Array.from(new Set(data.map((i: any) => i.category).filter(Boolean)));
        },
        enabled: open,
    });

    // Fetch Prompts
    // In a real app we might use infinite scroll. For now, fetch top 100.
    const { data: prompts = [], isLoading, isError, error } = useQuery({
        queryKey: ["gallery-prompts", selectedCategory],
        queryFn: async () => {
            console.log("Fetching prompts...", process.env.NEXT_PUBLIC_SUPABASE_URL ? "URL Set" : "URL Missing");
            let query = supabase
                .from("curated_prompts")
                .select("*")
                .eq("is_active", true)
                .order("created_at", { ascending: false })
                .limit(100);

            if (selectedCategory) {
                query = query.eq("category", selectedCategory);
            }

            const { data, error } = await query;
            console.log("Supabase Response:", { dataLength: data?.length, error });
            if (error) {
                console.error("Supabase Error:", error);
                throw error;
            }
            return data as GalleryItem[];
        },
        enabled: open,
    });

    console.log("Gallery State:", { isLoading, isError, promptsCount: prompts.length });

    // Client-side search filtering (for speed with 100 items)
    const filteredPrompts = prompts.filter(p => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return p.title.toLowerCase().includes(q) ||
            p.prompt.toLowerCase().includes(q) ||
            (p.tags && p.tags.some(t => t.toLowerCase().includes(q)));
    });

    const breakpointColumnsObj = {
        default: 5,
        1536: 4, // 2xl
        1280: 3, // xl
        1024: 3, // lg
        768: 2,  // md
        640: 1   // sm
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed inset-0 z-[2001] flex flex-col bg-white data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:inset-4 sm:rounded-3xl sm:border sm:border-gray-200 overflow-hidden shadow-2xl focus:outline-none">

                    {/* Header */}
                    <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:px-6 bg-white/80 backdrop-blur-md z-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Dialog.Title className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block">
                                    Prompt Gallery
                                </Dialog.Title>
                                {/* Category Pills */}
                                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className={cn(
                                            "px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap",
                                            selectedCategory === null
                                                ? "bg-black text-white"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        )}
                                    >
                                        All
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={cn(
                                                "px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap",
                                                selectedCategory === cat
                                                    ? "bg-black text-white"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative w-full max-w-[200px] hidden sm:block">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                    <Input
                                        placeholder="Search..."
                                        className="pl-9 h-9 bg-gray-100 border-none rounded-full text-sm focus-visible:ring-1"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full hover:bg-gray-100">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
                        <div className="max-w-[1920px] mx-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                                </div>
                            ) : isError ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <div className="bg-red-50 p-4 rounded-full mb-4">
                                        <Filter className="w-8 h-8 text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">Gallery Unavailable</h3>
                                    <p className="text-gray-500 max-w-sm mt-2 text-sm">
                                        {/* @ts-ignore */}
                                        Error: {(error as any)?.message || "Unknown error"}
                                    </p>
                                </div>
                            ) : filteredPrompts.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">
                                    <p>No prompts found matching your criteria.</p>
                                </div>
                            ) : (
                                <Masonry
                                    breakpointCols={breakpointColumnsObj}
                                    className="flex w-auto -ml-4"
                                    columnClassName="pl-4 bg-clip-padding"
                                >
                                    {filteredPrompts.map(item => (
                                        <div key={item.id} onClick={() => setSelectedItem(item)}>
                                            <GalleryCard
                                                item={item}
                                                onSelect={() => setSelectedItem(item)}
                                            />
                                        </div>
                                    ))}
                                </Masonry>
                            )}
                        </div>
                    </div>

                    {/* Detail Dialog */}
                    <GalleryDetailDialog
                        item={selectedItem}
                        open={!!selectedItem}
                        onOpenChange={(open) => !open && setSelectedItem(null)}
                        onUse={onSelect}
                    />

                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

// Sub-component for Details

function GalleryDetailDialog({ item, open, onOpenChange, onUse }: { item: GalleryItem | null, open: boolean, onOpenChange: (o: boolean) => void, onUse: (i: GalleryItem) => void }) {
    if (!item) return null;

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-[2002] animate-in fade-in duration-200" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-[2003] w-full max-w-5xl translate-x-[-50%] translate-y-[-50%] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] duration-200 px-4">
                    <div className="bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[85vh]">
                        {/* Image Side */}
                        <div className="flex-1 bg-black/5 relative min-h-[300px] md:min-h-[500px] flex items-center justify-center p-4">
                            {item.image_url.match(/\.(mp4|webm|mov)$/i) ? (
                                <video
                                    src={item.image_url}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                                    controls
                                    autoPlay
                                    loop
                                />
                            ) : (
                                <img
                                    src={item.image_url}
                                    alt={item.title}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                                />
                            )}
                        </div>

                        {/* Details Side */}
                        <div className="w-full md:w-[400px] flex flex-col border-l border-gray-100 bg-white">
                            {/* Header */}
                            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                                <div>
                                    <Dialog.Title className="text-lg font-semibold text-gray-900 mb-1">
                                        {item.title}
                                    </Dialog.Title>
                                    <div className="flex gap-2 text-xs text-gray-500">
                                        <span>{item.category || "Uncategorized"}</span>
                                        {item.model_config?.model_id && (
                                            <>
                                                <span>•</span>
                                                <span className="font-mono">{item.model_config.model_id}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full -mr-2 -mt-2">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt</label>
                                    <p className="text-sm text-gray-700 leading-relaxed font-light whitespace-pre-wrap">
                                        {item.prompt}
                                    </p>
                                </div>

                                {item.negative_prompt && (
                                    <div className="space-y-3">
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Negative Prompt</label>
                                        <p className="text-sm text-gray-500 font-light whitespace-pre-wrap">
                                            {item.negative_prompt}
                                        </p>
                                    </div>
                                )}

                                {item.tags && item.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {item.tags.map(tag => (
                                            <span key={tag} className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 bg-gray-50/50 border-t border-gray-100 space-y-3">
                                <Button className="w-full h-11 rounded-xl text-base shadow-sm" onClick={() => { onUse(item); onOpenChange(false); }}>
                                    <ArrowUpRight className="w-4 h-4 mr-2" />
                                    Use in Canvas
                                </Button>
                                <Button variant="outline" className="w-full h-11 rounded-xl border-gray-200" onClick={() => navigator.clipboard.writeText(item.prompt)}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy Prompt
                                </Button>
                            </div>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
