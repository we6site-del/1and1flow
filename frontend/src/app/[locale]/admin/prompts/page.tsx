"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useLocale } from "next-intl";
import { Plus, Search, Trash2, Edit, X, Upload, Save, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
// import Image from "next/image";

// Types
interface PromptItem {
    id: string;
    title: string;
    prompt: string;
    negative_prompt?: string;
    image_url: string;
    model_config?: any;
    category?: string;
    tags?: string[];
    is_active: boolean;
    created_at: string;
}

export default function PromptsAdminPage() {
    const locale = useLocale();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const supabase = createClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        prompt: "",
        negative_prompt: "",
        image_url: "",
        category: "",
        tags: "",
        model_config: "{}",
    });
    const [uploading, setUploading] = useState(false);

    // Fetch Prompts (Using backend API or Supabase direct)
    // Using Supabase direct for list is easier for now as RLS logic is simple
    const { data: prompts = [], isLoading } = useQuery({
        queryKey: ["admin-prompts"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("curated_prompts")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data as PromptItem[];
        }
    });

    // Create/Update Mutation
    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Prepare payload
            const payload = {
                ...data,
                admin_id: user.id,
                tags: data.tags ? data.tags.split(",").map((t: string) => t.trim()) : [],
                model_config: JSON.parse(data.model_config || "{}"),
            };

            const url = editingId ? `/api/admin/prompts/${editingId}` : "/api/admin/prompts";
            const method = editingId ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || "Failed to save prompt");
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-prompts"] });
            setIsCreateOpen(false);
            setEditingId(null);
            setFormData({
                title: "",
                prompt: "",
                negative_prompt: "",
                image_url: "",
                category: "",
                tags: "",
                model_config: "{}",
            });
            toast({ title: "Success", description: `Prompt ${editingId ? "updated" : "created"} successfully` });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const response = await fetch(`/api/admin/prompts/${id}?admin_id=${user.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || "Failed to delete prompt");
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-prompts"] });
            toast({ title: "Success", description: "Prompt deleted successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload/media", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Upload failed");

            const data = await response.json();
            setFormData(prev => ({ ...prev, image_url: data.url }));
        } catch (error) {
            toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const handleSave = () => {
        if (!formData.title || !formData.prompt || !formData.image_url) {
            toast({ title: "Error", description: "Please fill required fields", variant: "destructive" });
            return;
        }
        saveMutation.mutate(formData);
    };

    const handleEdit = (item: PromptItem) => {
        setEditingId(item.id);
        setFormData({
            title: item.title,
            prompt: item.prompt,
            negative_prompt: item.negative_prompt || "",
            image_url: item.image_url,
            category: item.category || "",
            tags: item.tags ? item.tags.join(", ") : "",
            model_config: JSON.stringify(item.model_config || {}, null, 2),
        });
        setIsCreateOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this prompt?")) {
            deleteMutation.mutate(id);
        }
    };

    // Filtered Prompts
    const filteredPrompts = prompts.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Prompt Gallery</h1>
                    <p className="text-gray-500 text-sm">Manage curated prompts for the community</p>
                </div>
                <Button onClick={() => {
                    setEditingId(null);
                    setFormData({
                        title: "",
                        prompt: "",
                        negative_prompt: "",
                        image_url: "",
                        category: "",
                        tags: "",
                        model_config: "{}",
                    });
                    setIsCreateOpen(true);
                }} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Prompt
                </Button>
            </div>

            {/* Search */}
            <div className="mb-6 relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    placeholder="Search prompts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPrompts.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                        <div className="relative aspect-square bg-gray-100">
                            {item.image_url.match(/\.(mp4|webm|mov)$/i) ? (
                                <video
                                    src={item.image_url}
                                    className="w-full h-full object-cover"
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
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button size="icon" variant="secondary" onClick={() => handleEdit(item)}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="destructive" onClick={() => handleDelete(item.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-gray-900 truncate flex-1">{item.title}</h3>
                                {item.category && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                        {item.category}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-3 font-mono">
                                {item.prompt}
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {(item.tags || []).slice(0, 3).map(tag => (
                                    <span key={tag} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Prompt" : "Add New Prompt"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-6">
                            {/* Left: Image Upload */}
                            <div className="space-y-4">
                                <Label>Preview Image</Label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg aspect-square flex flex-col items-center justify-center p-4 relative bg-gray-50">
                                    {formData.image_url ? (
                                        <div className="relative w-full h-full">
                                            {formData.image_url.match(/\.(mp4|webm|mov)$/i) ? (
                                                <video
                                                    src={formData.image_url}
                                                    className="w-full h-full object-contain rounded-lg p-2"
                                                    controls
                                                />
                                            ) : (
                                                <img
                                                    src={formData.image_url}
                                                    alt="Preview"
                                                    className="w-full h-full object-contain rounded-lg p-2"
                                                />
                                            )}
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="absolute bottom-4 right-4 z-10"
                                                onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
                                            >
                                                Change
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500 mb-2">Upload thumbnail</p>
                                            <Input
                                                type="file"
                                                accept="image/*,video/*"
                                                className="hidden"
                                                id="image-upload"
                                                onChange={handleImageUpload}
                                                disabled={uploading}
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={uploading}
                                                onClick={() => document.getElementById("image-upload")?.click()}
                                            >
                                                {uploading ? "Uploading..." : "Select File"}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Details */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input
                                        placeholder="e.g. Cyberpunk City"
                                        value={formData.title}
                                        onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Input
                                        placeholder="e.g. Photography"
                                        value={formData.category}
                                        onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tags (comma separated)</Label>
                                    <Input
                                        placeholder="cyberpunk, neon, night"
                                        value={formData.tags}
                                        onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Prompt</Label>
                            <Textarea
                                placeholder="Enter the full prompt used..."
                                className="min-h-[100px]"
                                value={formData.prompt}
                                onChange={e => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Negative Prompt (Optional)</Label>
                            <Input
                                placeholder="Low quality, blurry..."
                                value={formData.negative_prompt}
                                onChange={e => setFormData(prev => ({ ...prev, negative_prompt: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Model Config (JSON)</Label>
                            <Textarea
                                placeholder='{ "model_id": "...", "aspect_ratio": "16:9" }'
                                className="font-mono text-xs"
                                value={formData.model_config}
                                onChange={e => setFormData(prev => ({ ...prev, model_config: e.target.value }))}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={saveMutation.isPending || uploading}>
                                {saveMutation.isPending ? "Saving..." : (editingId ? "Update Prompt" : "Create Prompt")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export const dynamic = "force-dynamic";
