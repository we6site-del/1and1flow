"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { NodeContainer } from "@/components/ui/NodeContainer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Zap, Play, Plus, RefreshCw, ChevronDown, Settings2, X, ArrowLeftRight, Check, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReferenceImage } from "../shapes/AiNodeShape";
import { stopEventPropagation } from "tldraw";
import { useAiModels, useModelById } from "@/hooks/useAiModels";
import { useTranslations } from "next-intl";
import { VideoSettingsPopover } from "./VideoSettingsPopover";
import { DynamicForm } from "./DynamicForm";
import { uploadImage } from "@/utils/upload";
import { useCheckCredits } from "@/hooks/useCheckCredits";

const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    stopEventPropagation(e as any);
};



interface VideoGeneratorNodeProps {
    id: string;
    selected?: boolean;
    data?: {
        prompt?: string;
        videoUrl?: string;
        model?: string;
        duration?: string;
        references?: ReferenceImage[];
        mode?: "first_last_frame" | "multi_reference";
        status?: "idle" | "generating" | "completed" | "failed";
        parameters?: Record<string, any>;
    };
    onGenerate?: (prompt: string, model: string, parameters: Record<string, any>) => void;
    onUpdateReferences?: (references: ReferenceImage[]) => void;
    onUpdateMode?: (mode: "first_last_frame" | "multi_reference") => void;
    onUpdateModel?: (modelId: string) => void;
    onUpdatePrompt?: (prompt: string) => void;
    onUpdateParameters?: (parameters: Record<string, any>) => void;
}

export function VideoGeneratorNode({ id, selected, data, onGenerate, onUpdateReferences, onUpdateMode, onUpdateModel, onUpdatePrompt, onUpdateParameters }: VideoGeneratorNodeProps) {
    const [prompt, setPrompt] = useState(data?.prompt || "");
    const [model, setModel] = useState(data?.model || ""); // This should be modelId
    const [parameters, setParameters] = useState<Record<string, any>>(data?.parameters || {});
    const [references, setReferences] = useState<ReferenceImage[]>(data?.references || []);
    const [mode, setMode] = useState<"first_last_frame" | "multi_reference">(data?.mode || "first_last_frame");
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const t = useTranslations('Nodes');

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

    // Fetch available video models
    const { data: models = [], isLoading: modelsLoading } = useAiModels("VIDEO");
    const { data: selectedModel } = useModelById(model);

    const { checkCredits } = useCheckCredits();

    const isGenerating = data?.status === "generating";

    // Initialize model if not set and models are loaded
    useEffect(() => {
        if (!model && models.length > 0) {
            const defaultModelId = models[0].id;
            setModel(defaultModelId);
            if (!data?.model) {
                onUpdateModel?.(defaultModelId);
            }
        }
    }, [model, models, data?.model, onUpdateModel]);

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

    const startFrame = references.find(r => r.type === "start_frame");
    const endFrame = references.find(r => r.type === "end_frame");
    const multiRefs = references.filter(r => r.type === "reference");

    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = useCallback(async (files: FileList | null, type?: "start_frame" | "end_frame" | "reference") => {
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file.type.startsWith('image/')) return;

        setIsUploading(true);
        try {
            // Upload to server
            const url = await uploadImage(file);

            const refType = type || (mode === "first_last_frame" ? "start_frame" : "reference");

            let updated: ReferenceImage[];
            if (refType === "start_frame") {
                updated = references.filter(r => r.type !== "start_frame");
                updated.push({ id: `ref-${Date.now()}`, url, type: "start_frame" });
            } else if (refType === "end_frame") {
                updated = references.filter(r => r.type !== "end_frame");
                updated.push({ id: `ref-${Date.now()}`, url, type: "end_frame" });
            } else {
                updated = [...references, { id: `ref-${Date.now()}`, url, type: "reference" }];
            }

            setReferences(updated);
            onUpdateReferences?.(updated);
        } catch (error) {
            console.error("Upload failed:", error);
        } finally {
            setIsUploading(false);
        }
    }, [references, mode, onUpdateReferences]);

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

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, type?: "start_frame" | "end_frame") => {
        handleFileUpload(e.target.files, type);
        e.target.value = "";
    };

    const handleModeChange = (newMode: "first_last_frame" | "multi_reference") => {
        setMode(newMode);
        onUpdateMode?.(newMode);
    };

    const handleSwapFrames = () => {
        const updated = references.map(ref => {
            if (ref.type === "start_frame") return { ...ref, type: "end_frame" as const };
            if (ref.type === "end_frame") return { ...ref, type: "start_frame" as const };
            return ref;
        });
        setReferences(updated);
        onUpdateReferences?.(updated);
    };

    const handleDownload = async () => {
        if (!data?.videoUrl) return;
        try {
            const response = await fetch(data.videoUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `video-${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error("Download failed:", e);
            window.open(data.videoUrl, '_blank');
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
            {(data?.videoUrl || isGenerating || data?.status === "failed") && (
                <div
                    className="relative w-[600px] bg-black rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-200/60 mb-2"
                    onDragStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <div className="absolute top-2 left-2 flex items-center gap-1 text-[10px] text-white/90 bg-black/60 px-2 py-1 rounded-full backdrop-blur-sm shadow-sm z-10 border border-white/10">
                        <Play className="w-3 h-3" />
                        <span>Video Generator</span>
                    </div>

                    {data?.status === "failed" ? (
                        <div className="w-full aspect-video flex flex-col items-center justify-center bg-gray-900 border border-gray-800 text-red-400">
                            <X className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">Generation Failed</span>
                            <span className="text-xs text-red-500/70 mt-1">Please try again</span>
                        </div>
                    ) : isGenerating ? (
                        <div className="relative w-full aspect-video">
                            <Skeleton className="w-full h-full bg-gray-800" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-black/80 backdrop-blur px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 border border-white/10">
                                    <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                                    <span className="text-xs font-medium text-blue-400">Generating...</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <video
                            src={data?.videoUrl}
                            controls
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
                "bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-200/60 transition-all duration-200 flex flex-col overflow-hidden w-[500px]",
                selected ? "ring-2 ring-blue-500 border-transparent" : ""
            )}>
                {/* Custom Header / Prompt Area */}
                <div className="p-4 pb-3">
                    {/* Prompt Textarea */}
                    <div className="relative">
                        <textarea
                            className="nodrag nopan w-full text-sm font-medium text-gray-600 placeholder:text-gray-300 outline-none bg-transparent resize-none min-h-[80px]"
                            placeholder=""
                            value={prompt}
                            onChange={(e) => {
                                setPrompt(e.target.value);
                                onUpdatePrompt?.(e.target.value);
                            }}
                            onPointerDown={stopPropagation}
                            onMouseDown={stopPropagation}
                            onKeyDown={(e) => {
                                // Only stop propagation for certain keys, allow normal typing
                                if (e.key === 'Escape' || (e.key === 'Enter' && e.metaKey)) {
                                    stopPropagation(e);
                                }
                            }}
                            autoFocus={false}
                        />
                        {/* Magic Refine Button */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                handleRefine();
                            }}
                            disabled={isRefining || !prompt}
                            className={cn(
                                "absolute bottom-0 right-0 p-1.5 rounded-md transition-all",
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

                {/* Reference Area (Start/End Frames or Multi Reference) */}
                {mode === "first_last_frame" ? (
                    <div className="px-4 py-3 flex gap-3 items-center">
                        <div className="relative">
                            <button
                                className="nodrag nopan w-20 h-20 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center gap-1 hover:bg-gray-100 transition-colors group relative overflow-hidden"
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e) => {
                                        const files = (e.target as HTMLInputElement).files;
                                        if (files) handleFileUpload(files, "start_frame");
                                    };
                                    !isUploading && input.click();
                                }}
                                onPointerDown={stopPropagation}
                                onMouseDown={stopPropagation}
                                disabled={isUploading}
                            >
                                {isUploading && !startFrame ? (
                                    <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                                ) : startFrame ? (
                                    <>
                                        <img src={startFrame.url} className="absolute inset-0 w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                            <X className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                                        <span className="text-[10px] text-gray-400 font-medium">{t('startFrame')}</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Swap Button */}
                        <button
                            className="nodrag nopan w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                            onClick={handleSwapFrames}
                            onPointerDown={stopPropagation}
                            onMouseDown={stopPropagation}
                            title={t('swapFrames')}
                        >
                            <ArrowLeftRight className="w-4 h-4 text-gray-400" />
                        </button>

                        <div className="relative">
                            <button
                                className="nodrag nopan w-20 h-20 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center gap-1 hover:bg-gray-100 transition-colors group relative overflow-hidden"
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e) => {
                                        const files = (e.target as HTMLInputElement).files;
                                        if (files) handleFileUpload(files, "end_frame");
                                    };
                                    !isUploading && input.click();
                                }}
                                onPointerDown={stopPropagation}
                                onMouseDown={stopPropagation}
                                disabled={isUploading}
                            >
                                {isUploading && !endFrame ? (
                                    <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                                ) : endFrame ? (
                                    <>
                                        <img src={endFrame.url} className="absolute inset-0 w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                            <X className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                                        <span className="text-[10px] text-gray-400 font-medium">{t('endFrame')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                            {multiRefs.map((ref) => (
                                <div key={ref.id} className="relative w-16 h-16 rounded-lg bg-gray-100 overflow-hidden group">
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
                            <button
                                className="w-16 h-16 rounded-lg bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.multiple = true;
                                    input.onchange = (e) => {
                                        const files = (e.target as HTMLInputElement).files;
                                        if (files) handleFileUpload(files, "reference");
                                    };
                                    !isUploading && input.click();
                                }}
                                onPointerDown={stopPropagation}
                                onMouseDown={stopPropagation}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                                ) : (
                                    <Plus className="w-5 h-5 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileInputChange(e)}
                />

                {/* Bottom Bar */}
                <div className="p-3 mt-2 flex items-center justify-between bg-gray-50/80 backdrop-blur border-t border-gray-100">
                    {/* Left: Mode Toggle */}
                    <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-100 shadow-sm">
                        <button
                            className={cn(
                                "nodrag nopan px-2 py-1 text-[10px] font-medium rounded-md transition-colors",
                                mode === "first_last_frame"
                                    ? "bg-gray-100 text-gray-700"
                                    : "text-gray-400 hover:text-gray-600"
                            )}
                            onClick={() => handleModeChange("first_last_frame")}
                            onPointerDown={stopPropagation}
                            onMouseDown={stopPropagation}
                        >
                            {t('firstLastFrame')}
                        </button>
                        <button
                            className={cn(
                                "nodrag nopan px-2 py-1 text-[10px] font-medium rounded-md transition-colors",
                                mode === "multi_reference"
                                    ? "bg-gray-100 text-gray-700"
                                    : "text-gray-400 hover:text-gray-600"
                            )}
                            onClick={() => handleModeChange("multi_reference")}
                            onPointerDown={stopPropagation}
                            onMouseDown={stopPropagation}
                        >
                            {t('multiReference')}
                        </button>
                    </div>

                    {/* Center: Model Selector */}
                    <DropdownMenu>
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
                            {models.map(opt => (
                                <DropdownMenuItem
                                    key={opt.id}
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        setModel(opt.id);
                                        onUpdateModel?.(opt.id);
                                        // Reset parameters when model changes
                                        const defaults: Record<string, any> = {};
                                        opt.parameters_schema?.forEach((param: any) => {
                                            if (param.default !== undefined) {
                                                defaults[param.key] = param.default;
                                            }
                                        });
                                        setParameters(defaults);
                                    }}
                                    className={cn(
                                        "cursor-pointer flex items-center gap-2 px-2 py-2",
                                        model === opt.id && "bg-gray-50"
                                    )}
                                >
                                    {opt.icon_url ? (
                                        <img src={opt.icon_url} className="w-5 h-5 object-contain rounded-sm bg-gray-50" alt="" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-sm bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500">
                                            {opt.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-0.5 flex-1">
                                        <span className="text-xs font-medium text-gray-700">{opt.name}</span>
                                        {/* <span className="text-[9px] text-gray-400">{opt.provider} · {opt.cost_per_gen} credits</span> */}
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-mono ml-2">{opt.cost_per_gen} credits</span>
                                    {model === opt.id && <Check className="w-3 h-3 ml-2 text-black" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Right: Settings & Generate */}
                    <div className="flex items-center gap-2">
                        {/* Video Settings Popover (Aspect Ratio, Duration, Quality) */}
                        {selectedModel?.parameters_schema && (
                            <VideoSettingsPopover
                                schema={selectedModel.parameters_schema}
                                values={parameters}
                                onChange={(key, value) => {
                                    const newParams = { ...parameters, [key]: value };
                                    setParameters(newParams);
                                    onUpdateParameters?.(newParams);
                                }}
                            />
                        )}

                        {/* Other Dynamic Parameters (if any) */}
                        {selectedModel?.parameters_schema && (
                            <DynamicForm
                                schema={selectedModel.parameters_schema.filter(p =>
                                    !['aspect_ratio', 'duration', 'resolution', 'quality'].includes(p.key)
                                )}
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
                                if (model && !isGenerating) {
                                    const cost = selectedModel?.cost_per_gen ?? 0;
                                    if (!checkCredits(cost)) return;
                                    onGenerate?.(prompt, model, parameters);
                                }
                            }}
                            onPointerDown={stopPropagation}
                            onMouseDown={stopPropagation}
                            disabled={!model || modelsLoading || isGenerating}
                        >
                            {isGenerating ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                                <Zap className="w-3 h-3 fill-white" />
                            )}
                            {isGenerating ? t('generating') : (selectedModel?.cost_per_gen || 160)}
                        </Button>
                    </div>
                </div>
            </div>
        </div >
    );
}
