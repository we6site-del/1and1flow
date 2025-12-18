"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { NodeContainer } from "@/components/ui/NodeContainer";
import { Button } from "@/components/ui/button";
import { Zap, Image as ImageIcon, Plus, RefreshCw, ChevronDown, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReferenceImage } from "../shapes/AiNodeShape";
import { stopEventPropagation } from "tldraw";
import { DynamicForm } from "./DynamicForm";
import { useAiModels, useModelById } from "@/hooks/useAiModels";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { uploadImage } from "@/utils/upload";
import { useCheckCredits } from "@/hooks/useCheckCredits";

const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    stopEventPropagation(e as any);
};

interface ImageGeneratorNodeProps {
    id: string;
    selected?: boolean;
    data?: {
        prompt?: string;
        imageUrl?: string;
        modelId?: string; // Changed from model string to modelId
        model?: string; // Keep for backward compatibility
        parameters?: Record<string, any>; // Dynamic parameters
        aspectRatio?: string; // Keep for backward compatibility
        references?: ReferenceImage[];
        status?: "idle" | "generating" | "completed" | "failed";
    };
    onGenerate?: (prompt: string, modelId: string, parameters: Record<string, any>) => void;
    onUpdateReferences?: (references: ReferenceImage[]) => void;
    onUpdateModel?: (modelId: string) => void;
    onUpdatePrompt?: (prompt: string) => void;
    onUpdateParameters?: (parameters: Record<string, any>) => void;
}

export function ImageGeneratorNode({ id, selected, data, onGenerate, onUpdateReferences, onUpdateModel, onUpdatePrompt, onUpdateParameters }: ImageGeneratorNodeProps) {
    const [prompt, setPrompt] = useState(data?.prompt || "");
    const [modelId, setModelId] = useState<string>(data?.modelId || data?.model || "");
    const [parameters, setParameters] = useState<Record<string, any>>(data?.parameters || {});
    const [references, setReferences] = useState<ReferenceImage[]>(data?.references || []);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const t = useTranslations('Nodes');

    // Fetch available models
    const { data: models = [], isLoading: modelsLoading } = useAiModels("IMAGE");
    const { data: selectedModel } = useModelById(modelId);

    const { checkCredits } = useCheckCredits();

    const isGenerating = data?.status === "generating";

    // Initialize modelId if not set and models are loaded
    useEffect(() => {
        if (!modelId && models.length > 0) {
            const defaultModelId = models[0].id;
            setModelId(defaultModelId);
            // Only update parent if we are setting a default and it wasn't set
            if (!data?.modelId && !data?.model) {
                onUpdateModel?.(defaultModelId);
            }
        }
    }, [modelId, models, data?.modelId, data?.model, onUpdateModel]);

    // Initialize parameters from schema defaults when model changes
    useEffect(() => {
        if (selectedModel?.parameters_schema && Object.keys(parameters).length === 0) {
            const defaults: Record<string, any> = {};
            selectedModel.parameters_schema.forEach((param: any) => {
                if (param.default !== undefined) {
                    defaults[param.key] = param.default;
                }
            });
            setParameters(defaults);
        }
    }, [selectedModel, parameters]);

    // Sync parameters from data prop to local state
    useEffect(() => {
        if (data?.parameters) {
            setParameters(prev => {
                // Only update if different to avoid loops/unnecessary renders
                if (JSON.stringify(prev) !== JSON.stringify(data.parameters)) {
                    return data.parameters!;
                }
                return prev;
            });
        }
    }, [data?.parameters]);

    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const newReferences: ReferenceImage[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) continue;

                // Upload to server
                const url = await uploadImage(file);

                newReferences.push({
                    id: `ref-${Date.now()}-${i}`,
                    url,
                    type: "reference",
                });
            }

            const updated = [...references, ...newReferences];
            setReferences(updated);
            onUpdateReferences?.(updated);
        } catch (error) {
            console.error("Upload failed:", error);
            // Optionally show error toast here
        } finally {
            setIsUploading(false);
        }
    }, [references, onUpdateReferences]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files);
    };

    const handleRemoveReference = (refId: string) => {
        const updated = references.filter(r => r.id !== refId);
        setReferences(updated);
        onUpdateReferences?.(updated);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileUpload(e.target.files);
        e.target.value = "";
    };

    const [isRefining, setIsRefining] = useState(false);

    const handleRefine = async () => {
        if (!prompt || isRefining) return;
        setIsRefining(true);
        try {
            const res = await fetch("/api/chat/refine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });
            const data = await res.json();
            if (data.refined_prompt) {
                setPrompt(data.refined_prompt);
                onUpdatePrompt?.(data.refined_prompt);
            }
        } catch (e) {
            console.error("Refine failed", e);
        } finally {
            setIsRefining(false);
        }
    };

    return (
        <div
            className="flex flex-col items-center gap-4 pointer-events-auto w-full"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Result Above (Floating) */}
            {(data?.imageUrl || isGenerating || data?.status === "failed") && (
                <div
                    className="relative w-[400px] bg-white rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-200/60 mb-2"
                    onDragStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <div className="absolute top-2 left-2 flex items-center gap-1 text-[10px] text-black/70 bg-white/80 px-2 py-1 rounded-full backdrop-blur-sm shadow-sm z-10">
                        <ImageIcon className="w-3 h-3" />
                        <span>Image Generator</span>
                    </div>

                    {data?.status === "failed" ? (
                        <div className="w-full aspect-square flex flex-col items-center justify-center bg-red-50 text-red-500">
                            <X className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">Generation Failed</span>
                            <span className="text-xs text-red-400 mt-1">Please try again</span>
                        </div>
                    ) : isGenerating ? (
                        <div className="relative w-full aspect-square">
                            <Skeleton className="w-full h-full" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2">
                                    <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                                    <span className="text-xs font-medium text-blue-600">Generating...</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <img
                            src={data?.imageUrl}
                            alt="Generated"
                            className="w-full h-auto object-cover select-none"
                            draggable={false}
                            onDragStart={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                        />
                    )}
                </div>
            )}

            {/* Main Node Card */}
            <div className={cn(
                "bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-200/60 transition-all duration-200 flex flex-col overflow-hidden w-[400px]",
                selected ? "ring-2 ring-blue-500 border-transparent" : ""
            )}>
                {/* Custom Header / Prompt Area */}
                <div className="p-4 pb-3">
                    {/* Reference Images Preview */}
                    {references.length > 0 && (
                        <div className="flex gap-2 mb-3 flex-wrap">
                            {references.map((ref) => (
                                <div key={ref.id} className="relative w-10 h-10 rounded-lg bg-gray-100 overflow-hidden group">
                                    <img src={ref.url} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => handleRemoveReference(ref.id)}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                        onPointerDown={stopPropagation}
                                        onMouseDown={stopPropagation}
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            ))}
                            {references.length < 3 && (
                                <button
                                    className="w-10 h-10 rounded-lg bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                    onClick={() => !isUploading && fileInputRef.current?.click()}
                                    onPointerDown={stopPropagation}
                                    onMouseDown={stopPropagation}
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                                    ) : (
                                        <Plus className="w-4 h-4 text-gray-400" />
                                    )}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Prompt Textarea */}
                    <div className="relative">
                        <textarea
                            className="nodrag nopan w-full text-sm font-medium text-gray-700 placeholder:text-gray-400 outline-none bg-gray-50/50 p-2 rounded-lg resize-none min-h-[80px] border border-transparent focus:border-gray-200 transition-all pr-8"
                            placeholder={t('promptPlaceholder')}
                            value={prompt}
                            onChange={(e) => {
                                setPrompt(e.target.value);
                                onUpdatePrompt?.(e.target.value);
                            }}
                            onClick={(e) => {
                                stopPropagation(e);
                            }}
                            onPointerDown={stopPropagation}
                            onMouseDown={stopPropagation}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape' || (e.key === 'Enter' && e.metaKey)) {
                                    e.stopPropagation();
                                }
                            }}
                        />

                        {/* Magic Refine Button */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                handleRefine();
                            }}
                            disabled={isRefining || !prompt}
                            className={cn(
                                "absolute bottom-1 right-1 p-1.5 rounded-md transition-all",
                                "hover:bg-purple-100 text-purple-400 hover:text-purple-600",
                                isRefining ? "animate-pulse" : ""
                            )}
                            onPointerDown={stopPropagation}
                            title="Magic Refine Prompt"
                        >
                            {isRefining ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Zap className="w-3.5 h-3.5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileInputChange}
                />

                {/* Bottom Bar */}
                < div className="p-3 flex items-center justify-between bg-gray-50/80 backdrop-blur border-t border-gray-100" >
                    {/* Left: Model Selector */}
                    < DropdownMenu >
                        <DropdownMenuTrigger asChild>
                            <button
                                className="nodrag nopan flex items-center gap-2 text-[10px] font-medium text-gray-700 hover:bg-gray-100 px-2 py-1.5 rounded-md transition-colors border border-transparent hover:border-gray-200"
                                onPointerDown={stopPropagation}
                                onMouseDown={stopPropagation}
                                onClick={stopPropagation}
                            >
                                {modelsLoading ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : selectedModel?.icon_url ? (
                                    <img src={selectedModel.icon_url} className="w-4 h-4 object-contain rounded-sm" alt="" />
                                ) : selectedModel?.name ? (
                                    <div className="w-4 h-4 rounded-sm bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500 flex-shrink-0">
                                        {selectedModel.name.substring(0, 2).toUpperCase()}
                                    </div>
                                ) : models.length > 0 && models[0]?.icon_url ? (
                                    <img src={models[0].icon_url} className="w-4 h-4 object-contain rounded-sm" alt="" />
                                ) : models.length > 0 ? (
                                    <div className="w-4 h-4 rounded-sm bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500 flex-shrink-0">
                                        {models[0].name.substring(0, 2).toUpperCase()}
                                    </div>
                                ) : (
                                    <div className="w-4 h-4 rounded-sm bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500 flex-shrink-0">
                                        ?
                                    </div>
                                )}
                                <span>{selectedModel?.name || (models.length > 0 ? models[0].name : "Select Model")}</span>
                                <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="start"
                            className="w-56 p-1 bg-white/95 backdrop-blur-sm border-gray-100 shadow-md"
                            onPointerDown={stopPropagation}
                            onMouseDown={stopPropagation}
                        >
                            {models.map(model => (
                                <DropdownMenuItem
                                    key={model.id}
                                    onSelect={(e) => {
                                        e.preventDefault(); // Prevent closing immediately if needed, or just standard behavior
                                        setModelId(model.id);
                                        onUpdateModel?.(model.id);
                                        // Reset parameters when model changes
                                        const defaults: Record<string, any> = {};
                                        model.parameters_schema?.forEach((param: any) => {
                                            if (param.default !== undefined) {
                                                defaults[param.key] = param.default;
                                            }
                                        });
                                        setParameters(defaults);
                                    }}
                                    className={cn(
                                        "cursor-pointer flex items-center gap-2 px-2 py-2",
                                        modelId === model.id && "bg-gray-50"
                                    )}
                                >
                                    {model.icon_url ? (
                                        <img src={model.icon_url} className="w-5 h-5 object-contain rounded-sm bg-gray-50" alt="" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-sm bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500">
                                            {model.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-0.5 flex-1">
                                        <span className="text-xs font-medium text-gray-700">{model.name}</span>
                                        {/* <span className="text-[9px] text-gray-400">{model.provider} · {model.cost_per_gen} credits</span> */}
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-mono ml-2">{model.cost_per_gen} credits</span>
                                    {modelId === model.id && <Check className="w-3 h-3 ml-2 text-black" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu >

                    <div className="flex items-center gap-2">
                        {/* Image Upload Icon */}
                        <button
                            className="nodrag nopan w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                            onPointerDown={stopPropagation}
                            onMouseDown={stopPropagation}
                            title={t('uploadReference')}
                        >
                            <ImageIcon className="w-4 h-4" />
                        </button>

                        {/* Dynamic Parameters Form */}
                        {selectedModel?.parameters_schema && selectedModel.parameters_schema.length > 0 && (
                            <DynamicForm
                                schema={selectedModel.parameters_schema}
                                values={parameters}
                                onChange={(key, value) => {
                                    const newParams = { ...parameters, [key]: value };
                                    setParameters(newParams);
                                    onUpdateParameters?.(newParams);
                                }}
                            />
                        )}

                        {/* Generate Button */}
                        <Button
                            size="sm"
                            className={cn(
                                "nodrag nopan h-7 text-[10px] text-white px-3 rounded-md shadow-sm gap-1 transition-all",
                                isGenerating
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-black hover:bg-gray-900"
                            )}
                            onClick={(e) => {
                                stopPropagation(e);
                                if (modelId && !isGenerating) {
                                    const cost = selectedModel?.cost_per_gen ?? 0;
                                    if (!checkCredits(cost)) return;
                                    onGenerate?.(prompt, modelId, parameters);
                                }
                            }}
                            onPointerDown={stopPropagation}
                            onMouseDown={stopPropagation}
                            disabled={!modelId || modelsLoading || isGenerating}
                        >
                            {isGenerating ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                                <Zap className="w-3 h-3 fill-white" />
                            )}
                            {isGenerating ? t('generating') : (selectedModel?.cost_per_gen || 0)}
                        </Button>
                    </div>
                </div>
            </div>
        </div >
    );
}
