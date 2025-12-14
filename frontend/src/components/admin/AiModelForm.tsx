"use client";

import { useCreate, useUpdate } from "@refinedev/core";
import { useState, useEffect } from "react";
import { MonacoJsonEditor } from "@/components/admin/MonacoJsonEditor";
import { SchemaPreview } from "@/components/admin/SchemaPreview";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { validateParametersSchema } from "@/lib/validations/ai-model-schema";
import { Upload, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface AiModelFormProps {
    record?: any;
    onClose: () => void;
    onSuccess: () => void;
}

export function AiModelForm({ record, onClose, onSuccess }: AiModelFormProps) {
    const [parametersSchema, setParametersSchema] = useState<string>("[]");
    const [schemaError, setSchemaError] = useState<string>("");
    const [isSchemaValid, setIsSchemaValid] = useState<boolean>(true);
    const [formData, setFormData] = useState({
        name: "",
        type: "IMAGE",
        provider: "FAL",
        api_path: "",
        cost_per_gen: 0,
        is_active: true,
        is_default: false,
        description: "",
        icon_url: "",
    });
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);

    const { mutate: createModel } = useCreate({
        resource: "ai_models",
        mutationOptions: {
            onSuccess: () => {
                toast.success("Model created successfully");
                setIsLoading(false);
                onSuccess();
            },
            onError: (error: any) => {
                toast.error(error?.message || "Failed to create model");
                setIsLoading(false);
            },
        },
    });

    const { mutate: updateModel } = useUpdate({
        resource: "ai_models",
        mutationOptions: {
            onSuccess: () => {
                toast.success("Model updated successfully");
                setIsLoading(false);
                onSuccess();
            },
            onError: (error: any) => {
                toast.error(error?.message || "Failed to update model");
                setIsLoading(false);
            },
        },
    });

    useEffect(() => {
        if (record) {
            // Ensure provider and type are uppercase
            const provider = (record.provider || "FAL").toUpperCase();
            const type = (record.type || "IMAGE").toUpperCase();

            // Validate provider
            const validProviders = ['REPLICATE', 'FAL', 'CUSTOM', 'OPENROUTER'];
            const validProvider = validProviders.includes(provider) ? provider : 'FAL';

            // Validate type
            const validTypes = ['IMAGE', 'VIDEO', 'CHAT'];
            const validType = validTypes.includes(type) ? type : 'IMAGE';

            setFormData({
                name: record.name || "",
                type: validType,
                provider: validProvider,
                api_path: record.api_path || "",
                cost_per_gen: record.cost_per_gen || 0,
                is_active: record.is_active ?? true,
                is_default: record.is_default ?? false,
                description: record.description || "",
                icon_url: record.icon_url || "",
            });
            setLogoPreview(record.icon_url || null);
            setParametersSchema(
                JSON.stringify(record.parameters_schema || [], null, 2)
            );
        }
    }, [record]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.name || !formData.api_path || !formData.provider || !formData.type) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Validate provider value matches database constraint
        const validProviders = ['REPLICATE', 'FAL', 'CUSTOM', 'OPENROUTER'];
        if (!validProviders.includes(formData.provider)) {
            toast.error(`Provider must be one of: ${validProviders.join(', ')}`);
            return;
        }

        // Validate type value matches database constraint
        const validTypes = ['IMAGE', 'VIDEO', 'CHAT'];
        if (!validTypes.includes(formData.type)) {
            toast.error(`Type must be one of: ${validTypes.join(', ')}`);
            return;
        }

        // Validate JSON schema using Zod
        const validation = validateParametersSchema(parametersSchema);
        if (!validation.success) {
            setSchemaError(validation.error || "Invalid schema");
            toast.error(`Schema validation failed: ${validation.error}`);
            return;
        }

        setSchemaError("");

        // Ensure provider and type are uppercase to match database constraint
        // Build payload with only fields that exist in the database
        const payload: any = {
            name: formData.name,
            type: formData.type.toUpperCase() as 'IMAGE' | 'VIDEO' | 'CHAT',
            provider: formData.provider.toUpperCase() as 'REPLICATE' | 'FAL' | 'CUSTOM' | 'OPENROUTER',
            api_path: formData.api_path,
            cost_per_gen: formData.cost_per_gen,
            is_active: formData.is_active,
            parameters_schema: validation.data,
            description: formData.description || null,
            icon_url: formData.icon_url || null,
        };

        // Only include is_default if it's defined (column may not exist in older databases)
        // The migration will add this column, but we handle gracefully if it doesn't exist yet
        if (formData.hasOwnProperty('is_default') && formData.is_default !== undefined) {
            payload.is_default = formData.is_default;
        }

        setIsLoading(true);
        if (record) {
            // Update existing model
            updateModel({
                resource: "ai_models",
                id: record.id,
                values: payload,
            });
        } else {
            // Create new model
            createModel({
                resource: "ai_models",
                values: payload,
            });
        }
    };

    const handleSchemaValidationChange = (isValid: boolean, error?: string) => {
        setIsSchemaValid(isValid);
        setSchemaError(error || "");
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file");
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Image size must be less than 2MB");
            return;
        }

        setUploadingLogo(true);

        try {
            // Convert to base64 for preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Upload to backend - use different variable name to avoid conflict with formData state
            const uploadFormData = new FormData();
            uploadFormData.append("file", file);

            const response = await fetch("/api/upload/avatar", {
                method: "POST",
                body: uploadFormData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Upload failed");
            }

            const data = await response.json();
            // Use functional update to ensure we get the latest formData state
            setFormData((prevFormData) => ({ ...prevFormData, icon_url: data.url }));
            toast.success("Logo uploaded successfully");
        } catch (error: any) {
            console.error("Logo upload error:", error);
            toast.error(`Failed to upload logo: ${error.message || "Unknown error"}`);
            setLogoPreview(null);
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleRemoveLogo = () => {
        setLogoPreview(null);
        // Use functional update to ensure we get the latest formData state
        setFormData((prevFormData) => ({ ...prevFormData, icon_url: "" }));
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{record ? "Edit AI Model" : "Create AI Model"}</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="schema">Schema Editor</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Model Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name || ""}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Nano Banana Pro"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="type">Type *</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="IMAGE">Image</SelectItem>
                                            <SelectItem value="VIDEO">Video</SelectItem>
                                            <SelectItem value="CHAT">Chat</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="provider">Provider *</Label>
                                    <Select
                                        value={formData.provider}
                                        onValueChange={(value) => setFormData({ ...formData, provider: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="REPLICATE">Replicate</SelectItem>
                                            <SelectItem value="FAL">Fal.ai</SelectItem>
                                            <SelectItem value="OPENROUTER">OpenRouter</SelectItem>
                                            <SelectItem value="CUSTOM">Custom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="api_path">API Path *</Label>
                                <Input
                                    id="api_path"
                                    value={formData.api_path || ""}
                                    onChange={(e) => setFormData({ ...formData, api_path: e.target.value })}
                                    placeholder="e.g., kling-ai/kling-video-v2"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="cost_per_gen">Cost per Generation (credits) *</Label>
                                <Input
                                    id="cost_per_gen"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={formData.cost_per_gen ?? 0}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const numValue = value === "" ? 0 : parseInt(value, 10);
                                        setFormData({ ...formData, cost_per_gen: isNaN(numValue) ? 0 : numValue });
                                    }}
                                    placeholder="0"
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                                <Label htmlFor="is_active">Active</Label>
                            </div>

                            <div className="flex items-center gap-2">
                                <Switch
                                    id="is_default"
                                    checked={formData.is_default}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                                />
                                <Label htmlFor="is_default">Default Model</Label>
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description || ""}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    placeholder="Model description"
                                />
                            </div>

                            <div>
                                <Label htmlFor="icon_url">Model Logo</Label>
                                <div className="space-y-2">
                                    {logoPreview || formData.icon_url ? (
                                        <div className="relative inline-block">
                                            <div className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                                                <img
                                                    src={logoPreview || formData.icon_url}
                                                    alt="Model logo"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveLogo}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                                            <Upload className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                    <div>
                                        <Input
                                            id="logo_upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            disabled={uploadingLogo}
                                            className="hidden"
                                        />
                                        <Label
                                            htmlFor="logo_upload"
                                            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
                                        >
                                            <Upload className="w-4 h-4" />
                                            {uploadingLogo ? "Uploading..." : logoPreview || formData.icon_url ? "Change Logo" : "Upload Logo"}
                                        </Label>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Recommended: 64x64px or larger, max 2MB
                                        </p>
                                    </div>
                                    <Input
                                        id="icon_url"
                                        type="text"
                                        value={formData.icon_url || ""}
                                        onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                                        placeholder="Or enter logo URL directly"
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading || !isSchemaValid}>
                                    {isLoading ? "Saving..." : record ? "Update" : "Create"}
                                </Button>
                            </div>
                        </form>
                    </TabsContent>

                    <TabsContent value="schema">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <MonacoJsonEditor
                                    value={parametersSchema}
                                    onChange={setParametersSchema}
                                    height="500px"
                                    onValidationChange={handleSchemaValidationChange}
                                />
                                {schemaError && (
                                    <p className="text-sm text-red-500 mt-1">{schemaError}</p>
                                )}
                            </div>
                            <div>
                                <SchemaPreview
                                    schemaJson={parametersSchema}
                                    className="h-[500px] overflow-y-auto"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isLoading || !isSchemaValid}
                            >
                                {isLoading ? "Saving..." : record ? "Update" : "Create"}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
