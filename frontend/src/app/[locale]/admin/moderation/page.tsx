"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Trash2, Ban, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default function ModerationPage() {
    // All Hooks must be called before any early returns
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [mounted, setMounted] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const supabase = createClient();
    const { data: listData, isLoading, refetch } = useQuery({
        queryKey: ["generations_moderation", statusFilter],
        queryFn: async () => {
            try {
                let query = supabase
                    .from("generations")
                    .select("*")
                    .order("created_at", { ascending: false });

                if (statusFilter !== "all") {
                    if (statusFilter === "nsfw") {
                        query = query.eq("is_nsfw", true);
                    } else if (statusFilter === "deleted") {
                        query = query.eq("is_deleted", true);
                    } else if (statusFilter === "reported") {
                        // For reported, show NSFW flagged items
                        query = query.eq("is_nsfw", true);
                    }
                }

                const { data, error } = await query;
                
                // If columns don't exist (error code 42703), return empty array
                if (error && error.code === '42703') {
                    console.warn("Moderation columns (is_nsfw, is_deleted) not found. Please run migration: 20250102_add_admin_tables.sql");
                    return { data: [] };
                }
                
                if (error) throw error;
                
                // Ensure all items have default values for moderation fields
                const dataWithDefaults = (data || []).map((item: any) => ({
                    ...item,
                    is_nsfw: item.is_nsfw ?? false,
                    is_deleted: item.is_deleted ?? false,
                    nsfw_score: item.nsfw_score ?? null,
                }));
                
                return { data: dataWithDefaults };
            } catch (error: any) {
                console.error("Error fetching moderation data:", error);
                // Return empty array on error instead of crashing
                return { data: [] };
            }
        },
    });

    // Early return after all Hooks
    if (isLoading) return <div className="p-8">Loading...</div>;

    const generations = listData?.data || [];

    const filteredGenerations = generations.filter((gen: any) => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                gen.prompt?.toLowerCase().includes(query) ||
                gen.user_id?.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const handleBlur = async (generationId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from("generations")
                .update({ is_nsfw: !currentStatus })
                .eq("id", generationId);

            if (error) {
                if (error.code === '42703') {
                    toast.error("Moderation columns not found. Please run migration: 20250102_add_admin_tables.sql");
                    return;
                }
                throw error;
            }

            toast.success(currentStatus ? "Content unblurred" : "Content blurred");
            refetch();
        } catch (error: any) {
            toast.error(`Error updating status: ${error.message || "Unknown error"}`);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            const { error } = await supabase
                .from("generations")
                .update({ is_deleted: true })
                .eq("id", deleteId);

            if (error) {
                if (error.code === '42703') {
                    toast.error("Moderation columns not found. Please run migration: 20250102_add_admin_tables.sql");
                    setDeleteId(null);
                    return;
                }
                throw error;
            }

            toast.success("Content deleted");
            refetch();
            setDeleteId(null);
        } catch (error: any) {
            toast.error(`Error deleting content: ${error.message || "Unknown error"}`);
            setDeleteId(null);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Content Moderation</h1>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Input
                            placeholder="Search by prompt or user ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Content</SelectItem>
                            <SelectItem value="nsfw">NSFW Flagged</SelectItem>
                            <SelectItem value="deleted">Deleted</SelectItem>
                            <SelectItem value="reported">Reported</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Masonry Grid */}
            {filteredGenerations.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                    <p>No content found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredGenerations.map((gen: any) => (
                        <Card key={gen.id} className="overflow-hidden">
                            <div className="relative aspect-square bg-gray-100">
                                {gen.result_url ? (
                                    <img
                                        src={gen.result_url}
                                        alt={gen.prompt || "Generation"}
                                        className={cn(
                                            "w-full h-full object-cover",
                                            gen.is_nsfw && "blur-md"
                                        )}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        No Image
                                    </div>
                                )}
                                {gen.is_nsfw && (
                                    <div className="absolute top-2 left-2">
                                        <Badge variant="destructive">NSFW</Badge>
                                    </div>
                                )}
                                {gen.is_deleted && (
                                    <div className="absolute top-2 right-2">
                                        <Badge variant="secondary">Deleted</Badge>
                                    </div>
                                )}
                            </div>
                            <CardContent className="p-4">
                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                    {gen.prompt || "No prompt"}
                                </p>
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                    <span suppressHydrationWarning>
                                        {mounted ? format(new Date(gen.created_at), "MMM d, yyyy") : gen.created_at}
                                    </span>
                                    {gen.nsfw_score && (
                                        <span>Score: {(gen.nsfw_score * 100).toFixed(0)}%</span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleBlur(gen.id, gen.is_nsfw)}
                                        className="flex-1"
                                    >
                                        {gen.is_nsfw ? (
                                            <>
                                                <Eye className="w-3 h-3 mr-1" />
                                                Unblur
                                            </>
                                        ) : (
                                            <>
                                                <EyeOff className="w-3 h-3 mr-1" />
                                                Blur
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setDeleteId(gen.id)}
                                        className="flex-1"
                                    >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Results count */}
            <div className="mt-4 text-sm text-gray-500">
                Showing {filteredGenerations.length} of {generations.length} generation(s)
            </div>

            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Content</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to mark this content as deleted?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

