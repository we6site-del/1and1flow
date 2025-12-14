"use client";

import { Switch } from "@/components/ui/switch";

import { useList, useDelete, useUpdateMany, useInvalidate } from "@refinedev/core";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { AiModelForm } from "@/components/admin/AiModelForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit, Plus, Search, Filter, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { toast } from "sonner";

export const dynamic = "force-dynamic";

export default function AiModelsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [providerFilter, setProviderFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const supabase = createClient();
    const { data: listData, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["ai_models"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("ai_models")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return { data: data || [], total: data?.length || 0 };
        },
    });

    // const invalidate = useInvalidate();
    // const { mutate: deleteModel } = useDelete();
    // const { mutate: updateMany } = useUpdateMany();

    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const allModels = listData?.data || [];

    // Filter models based on search and filters
    const filteredModels = useMemo(() => {
        return allModels.filter((model: any) => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesSearch =
                    model.name?.toLowerCase().includes(query) ||
                    model.api_path?.toLowerCase().includes(query) ||
                    model.description?.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            // Type filter
            if (typeFilter !== "all" && model.type !== typeFilter) return false;

            // Provider filter
            if (providerFilter !== "all" && model.provider !== providerFilter) return false;

            // Status filter
            if (statusFilter !== "all") {
                if (statusFilter === "active" && !model.is_active) return false;
                if (statusFilter === "inactive" && model.is_active) return false;
            }

            return true;
        });
    }, [allModels, searchQuery, typeFilter, providerFilter, statusFilter]);

    const [deleteId, setDeleteId] = useState<string | null>(null);

    if (isLoading) return <div className="p-8">Loading...</div>;

    // ... previous imports ...

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            const { error } = await supabase.from("ai_models").delete().eq("id", deleteId);
            if (error) throw error;

            refetch();
            setSelectedIds(new Set());
            toast.success("Model deleted successfully");
            setDeleteId(null);
        } catch (error: any) {
            toast.error(`Failed to delete model: ${error.message}`);
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from("ai_models")
                .update({ is_active: !currentStatus })
                .eq("id", id);

            if (error) throw error;

            toast.success(`Model ${!currentStatus ? "activated" : "deactivated"} successfully`);
            refetch();
        } catch (error: any) {
            toast.error(`Failed to update model status: ${error.message}`);
        }
    };

    const handleBulkToggle = async (isActive: boolean) => {
        if (selectedIds.size === 0) {
            toast.error("Please select at least one model");
            return;
        }

        try {
            const { error } = await supabase
                .from("ai_models")
                .update({ is_active: isActive })
                .in("id", Array.from(selectedIds));

            if (error) throw error;

            toast.success(`${selectedIds.size} model(s) ${isActive ? "activated" : "deactivated"}`);
            setSelectedIds(new Set());
            refetch();
        } catch (error: any) {
            toast.error(`Failed to update models: ${error.message}`);
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredModels.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredModels.map((m: any) => m.id)));
        }
    };

    const handleSelectOne = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">AI Models</h1>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Model
                </Button>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search by name, API path..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="IMAGE">Image</SelectItem>
                            <SelectItem value="VIDEO">Video</SelectItem>
                            <SelectItem value="CHAT">Chat</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={providerFilter} onValueChange={setProviderFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Provider" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Providers</SelectItem>
                            <SelectItem value="OPENROUTER">OpenRouter</SelectItem>
                            <SelectItem value="REPLICATE">Replicate</SelectItem>
                            <SelectItem value="FAL">Fal.ai</SelectItem>
                            <SelectItem value="CUSTOM">Custom</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
                    <span className="text-sm text-blue-700">
                        {selectedIds.size} model(s) selected
                    </span>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBulkToggle(true)}
                        >
                            Activate
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBulkToggle(false)}
                        >
                            Deactivate
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedIds(new Set())}
                        >
                            Clear Selection
                        </Button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left">
                                <button
                                    onClick={handleSelectAll}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    {selectedIds.size === filteredModels.length && filteredModels.length > 0 ? (
                                        <CheckSquare className="w-5 h-5" />
                                    ) : (
                                        <Square className="w-5 h-5" />
                                    )}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Path</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameters</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredModels.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                                    No models found. {searchQuery || typeFilter !== "all" || providerFilter !== "all" || statusFilter !== "all" ? "Try adjusting your filters." : "Create your first model."}
                                </td>
                            </tr>
                        ) : (
                            filteredModels.map((model: any) => (
                                <tr
                                    key={model.id}
                                    className={cn(
                                        "hover:bg-gray-50",
                                        selectedIds.has(model.id) && "bg-blue-50"
                                    )}
                                >
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleSelectOne(model.id)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            {selectedIds.has(model.id) ? (
                                                <CheckSquare className="w-5 h-5 text-blue-600" />
                                            ) : (
                                                <Square className="w-5 h-5" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {model.icon_url ? (
                                            <div className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                                                <img
                                                    src={model.icon_url}
                                                    alt={model.name}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                                                No Logo
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{model.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={cn(
                                            "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                                            model.type === "IMAGE" ? "bg-blue-100 text-blue-800" :
                                                model.type === "VIDEO" ? "bg-purple-100 text-purple-800" :
                                                    "bg-green-100 text-green-800"
                                        )}>
                                            {model.type}
                                        </span>
                                        {model.is_default && (
                                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                Default
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{model.provider}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={model.api_path}>{model.api_path}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{model.cost_per_gen} credits</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={model.is_active}
                                                onCheckedChange={() => handleToggle(model.id, model.is_active)}
                                            />
                                            <span className={cn(
                                                "text-xs font-medium",
                                                model.is_active ? "text-green-600" : "text-gray-500"
                                            )}>
                                                {model.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {model.parameters_schema && Array.isArray(model.parameters_schema)
                                            ? `${model.parameters_schema.length} parameter(s)`
                                            : "None"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setEditingRecord(model)}
                                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                            >
                                                <Edit className="w-4 h-4" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(model.id)}
                                                className="text-red-600 hover:text-red-900 flex items-center gap-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-gray-500">
                Showing {filteredModels.length} of {allModels.length} model(s)
            </div>

            {
                editingRecord && (
                    <AiModelForm
                        record={editingRecord}
                        onClose={() => setEditingRecord(null)}
                        onSuccess={() => {
                            setEditingRecord(null);
                            refetch();
                        }}
                    />
                )
            }

            {
                isCreateModalOpen && (
                    <AiModelForm
                        onClose={() => setIsCreateModalOpen(false)}
                        onSuccess={() => {
                            setIsCreateModalOpen(false);
                            refetch();
                        }}
                    />
                )
            }

            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Model</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this model? This action cannot be undone.
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
        </div >
    );
}
