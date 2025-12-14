"use client";

import {
    BaseBoxShapeUtil,
    HTMLContainer,
    TLBaseShape,
    T,
    stopEventPropagation,
    useEditor,
    useValue,
} from "tldraw";
import { ImageGeneratorNode } from "@/components/canvas/nodes/ImageGeneratorNode";
import { VideoGeneratorNode } from "@/components/canvas/nodes/VideoGeneratorNode";
import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useProject } from "@/contexts/ProjectContext";

export type ReferenceImage = {
    id: string;
    url: string;
    type: "start_frame" | "end_frame" | "reference";
};

export type IAiNodeShape = TLBaseShape<
    "ai-node",
    {
        w: number;
        h: number;
        nodeType: "image" | "video";
        prompt: string;
        imageUrl: string;
        videoUrl: string;
        modelId: string; // Changed from model string to modelId UUID
        model?: string; // Keep for backward compatibility
        parameters?: Record<string, any>; // Dynamic parameters from schema - optional in props but always set in onBeforeCreate
        aspectRatio?: string; // Keep for backward compatibility
        duration?: string; // Keep for backward compatibility
        status: "idle" | "generating" | "completed" | "failed";
        references?: ReferenceImage[]; // Optional in props but always set in onBeforeCreate
        mode?: "first_last_frame" | "multi_reference"; // For video generator
    }
>;

// Standalone component to prevent remounting
const AiNodeContent = ({ shape }: { shape: IAiNodeShape }) => {
    const editor = useEditor();
    const isSelected = useValue("isSelected", () => editor.getSelectedShapeIds().includes(shape.id), [editor, shape.id]);
    const supabase = createClient();
    const contentRef = useRef<HTMLDivElement>(null);

    // Safely extract props with defaults for backward compatibility
    const props = shape.props || {};
    const {
        nodeType,
        prompt,
        imageUrl,
        videoUrl,
        model: legacyModel,
        aspectRatio,
        duration,
        mode = "first_last_frame"
    } = props;

    // Handle modelId with backward compatibility
    const modelId: string = props.modelId ?? legacyModel ?? "";

    // Ensure parameters is always an object
    const parameters: Record<string, any> = props.parameters && typeof props.parameters === 'object'
        ? props.parameters
        : {};

    // Ensure references is always an array
    const references: ReferenceImage[] = Array.isArray(props.references)
        ? props.references
        : [];

    // Realtime subscription
    useEffect(() => {
        if (!shape.id) return;

        const channel = supabase
            .channel(`generation-${shape.id}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "generations",
                    filter: `node_id=eq.${shape.id}`,
                },
                (payload: any) => {
                    console.log("Realtime update received:", payload);
                    const newStatus = payload.new.status;
                    const newResultUrl = payload.new.result_url;

                    if (newStatus === "COMPLETED" && newResultUrl) {
                        // Calculate new height based on aspect ratio
                        let additionalHeight = 0;
                        if (nodeType === "image") {
                            // Default 1:1 (400px)
                            additionalHeight = 400;
                            // Try to parse aspect ratio from props if available
                            if (shape.props.parameters?.aspect_ratio) {
                                const [w, h] = shape.props.parameters.aspect_ratio.split(":").map(Number);
                                if (w && h) additionalHeight = (400 * h) / w;
                            } else if (shape.props.aspectRatio) {
                                const [w, h] = shape.props.aspectRatio.split(":").map(Number);
                                if (w && h) additionalHeight = (400 * h) / w;
                            }
                        } else {
                            // Video: calculate based on aspect ratio
                            additionalHeight = (500 * 9) / 16; // Default 16:9
                            if (shape.props.parameters?.aspect_ratio) {
                                const [w, h] = shape.props.parameters.aspect_ratio.split(":").map(Number);
                                if (w && h) additionalHeight = (500 * h) / w;
                            }
                        }

                        editor.updateShape({
                            id: shape.id,
                            type: "ai-node",
                            props: {
                                status: "completed",
                                imageUrl: nodeType === "image" ? newResultUrl : shape.props.imageUrl,
                                videoUrl: nodeType === "video" ? newResultUrl : shape.props.videoUrl,
                                h: 450 + additionalHeight + 20, // Base height + image height + margin
                            },
                        });
                    } else if (newStatus === "FAILED") {
                        editor.updateShape({
                            id: shape.id,
                            type: "ai-node",
                            props: { status: "failed" },
                        });
                    }
                }
            )
            .subscribe((status) => {
                console.log(`[Realtime] Subscription status for ${shape.id}:`, status);
            });

        // Polling fallback
        const pollInterval = setInterval(async () => {
            if (shape.props.status !== "generating") return;

            const { data, error } = await supabase
                .from("generations")
                .select("status, result_url")
                .eq("node_id", shape.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (data) {
                if (data.status === "COMPLETED" && data.result_url) {
                    // Calculate new height based on aspect ratio
                    let additionalHeight = 0;
                    if (nodeType === "image") {
                        additionalHeight = 400; // Default 1:1
                        if (shape.props.parameters?.aspect_ratio) {
                            const [w, h] = shape.props.parameters.aspect_ratio.split(":").map(Number);
                            if (w && h) additionalHeight = (400 * h) / w;
                        } else if (shape.props.aspectRatio) {
                            const [w, h] = shape.props.aspectRatio.split(":").map(Number);
                            if (w && h) additionalHeight = (400 * h) / w;
                        }
                    } else {
                        // Video: calculate based on aspect ratio
                        additionalHeight = (500 * 9) / 16; // Default 16:9
                        if (shape.props.parameters?.aspect_ratio) {
                            const [w, h] = shape.props.parameters.aspect_ratio.split(":").map(Number);
                            if (w && h) additionalHeight = (500 * h) / w;
                        }
                    }

                    editor.updateShape({
                        id: shape.id,
                        type: "ai-node",
                        props: {
                            status: "completed",
                            imageUrl: nodeType === "image" ? data.result_url : shape.props.imageUrl,
                            videoUrl: nodeType === "video" ? data.result_url : shape.props.videoUrl,
                            h: 450 + additionalHeight + 20,
                        },
                    });
                } else if (data.status === "FAILED") {
                    editor.updateShape({
                        id: shape.id,
                        type: "ai-node",
                        props: { status: "failed" },
                    });
                }
            }
        }, 5000); // Poll every 5 seconds

        return () => {
            console.log(`[Realtime] Unsubscribing from ${shape.id}`);
            supabase.removeChannel(channel);
            clearInterval(pollInterval);
        };
    }, [shape.id, nodeType, shape.props.status, editor, supabase]);

    // Auto-resize shape based on content height
    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const newHeight = entry.contentRect.height;
                // Only update if height difference is significant (>1px) to avoid loops
                if (Math.abs(newHeight - shape.props.h) > 1) {
                    editor.updateShape({
                        id: shape.id,
                        type: "ai-node",
                        props: { h: newHeight },
                    });
                }
            }
        });

        if (contentRef.current) {
            observer.observe(contentRef.current);
        }

        return () => observer.disconnect();
    }, [editor, shape.id, shape.props.h]);

    const handleUpdateReferences = (newReferences: ReferenceImage[]) => {
        editor.updateShape({
            id: shape.id,
            type: "ai-node",
            props: {
                references: newReferences,
            },
        });
    };

    const handleUpdateMode = (newMode: "first_last_frame" | "multi_reference") => {
        editor.updateShape({
            id: shape.id,
            type: "ai-node",
            props: {
                mode: newMode,
            },
        });
    };

    const handleUpdateModel = (modelId: string) => {
        editor.updateShape({
            id: shape.id,
            type: "ai-node",
            props: {
                modelId: modelId,
            },
        });
    };

    const handleUpdatePrompt = (newPrompt: string) => {
        editor.updateShape({
            id: shape.id,
            type: "ai-node",
            props: {
                prompt: newPrompt,
            },
        });
    };

    const handleUpdateParameters = (newParameters: Record<string, any>) => {
        editor.updateShape({
            id: shape.id,
            type: "ai-node",
            props: {
                parameters: {
                    ...shape.props.parameters,
                    ...newParameters
                },
            },
        });
    };

    const { projectId } = useProject();

    const handleGenerate = async (prompt: string, modelId: string, parameters: Record<string, any>) => {
        // Check if any other node is currently generating
        const allShapes = editor.getCurrentPageShapes();
        const allAiNodes = allShapes.filter((s) => s.type === "ai-node") as IAiNodeShape[];
        const otherGeneratingNodes = allAiNodes.filter(
            (node) => node.id !== shape.id && node.props.status === "generating"
        );

        if (otherGeneratingNodes.length > 0) {
            console.warn("Another node is already generating. Please wait for it to complete.");
            return;
        }

        // Check if current node is already generating
        if (shape.props.status === "generating") {
            console.warn("This node is already generating.");
            return;
        }

        editor.updateShape({
            id: shape.id,
            type: "ai-node",
            props: {
                status: "generating",
                prompt,
                modelId,
                parameters,
            },
        });

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Please login to generate");
                editor.updateShape({
                    id: shape.id,
                    type: "ai-node",
                    props: { status: "idle" },
                });
                return;
            }

            // Ensure references are sorted correctly for first_last_frame mode
            let sortedReferences: string[] = [];
            if (nodeType === "video" && shape.props.mode === "first_last_frame") {
                const startFrame = references.find(r => r.type === "start_frame");
                const endFrame = references.find(r => r.type === "end_frame");
                if (startFrame) sortedReferences.push(startFrame.url);
                if (endFrame) sortedReferences.push(endFrame.url);
            } else {
                sortedReferences = (references || []).map(ref => ref.url);
            }

            const payload = {
                prompt: prompt,
                user_id: user.id,
                node_id: shape.id,
                project_id: projectId, // Pass project ID
                model_id: modelId,
                type: nodeType,
                parameters: parameters,
                references: sortedReferences,
            };

            console.log("[AiNodeShape] Sending generation payload:", payload);

            const response = await fetch("/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Generation failed");
            }
        } catch (error) {
            console.error("Generation error:", error);
            editor.updateShape({
                id: shape.id,
                type: "ai-node",
                props: { status: "failed" },
            });
        }
    };

    return (
        <HTMLContainer className="h-full pointer-events-all">
            <div ref={contentRef} className="w-full h-auto inline-block">
                {nodeType === "image" ? (
                    <ImageGeneratorNode
                        id={shape.id}
                        selected={isSelected}
                        data={{
                            prompt,
                            imageUrl,
                            modelId: modelId || legacyModel,
                            parameters,
                            references,
                            status: shape.props.status as any
                        }}
                        onGenerate={(prompt, model, params) => handleGenerate(prompt, model, params)}
                        onUpdateReferences={handleUpdateReferences}
                        onUpdateModel={handleUpdateModel}
                        onUpdatePrompt={handleUpdatePrompt}
                        onUpdateParameters={handleUpdateParameters}
                    />
                ) : (
                    <VideoGeneratorNode
                        id={shape.id}
                        selected={isSelected}
                        data={{
                            prompt,
                            videoUrl,
                            model: modelId || legacyModel,
                            duration,
                            references,
                            mode,
                            status: shape.props.status as any,
                            parameters
                        }}
                        onGenerate={(prompt, model, params) => handleGenerate(prompt, model, params)}
                        onUpdateReferences={handleUpdateReferences}
                        onUpdateMode={handleUpdateMode}
                        onUpdateModel={handleUpdateModel}
                        onUpdatePrompt={handleUpdatePrompt}
                        onUpdateParameters={handleUpdateParameters}
                    />
                )}
            </div>
        </HTMLContainer>
    );
};

export class AiNodeShapeUtil extends BaseBoxShapeUtil<IAiNodeShape> {
    static override type = "ai-node" as const;
    static override props = {
        w: T.number,
        h: T.number,
        nodeType: T.string,
        prompt: T.string,
        imageUrl: T.string,
        videoUrl: T.string,
        modelId: T.string, // Required but can be empty string for backward compatibility
        model: T.string.optional(), // Legacy field for backward compatibility
        parameters: T.any, // Changed to T.any to avoid validation errors with T.object()
        aspectRatio: T.string.optional(),
        duration: T.string.optional(),
        status: T.string,
        references: T.arrayOf(T.any).optional(), // Changed to T.any for safety
        mode: T.string.optional(),
    };

    override getDefaultProps(): IAiNodeShape["props"] {
        return {
            w: 400,
            h: 450,
            nodeType: "image",
            prompt: "",
            imageUrl: "",
            videoUrl: "",
            modelId: "",
            model: "",
            parameters: {},
            aspectRatio: "3:4",
            duration: "5s",
            status: "idle",
            references: [],
            mode: "first_last_frame",
        };
    }

    override onBeforeCreate(shape: IAiNodeShape): IAiNodeShape {
        const defaults = this.getDefaultProps();
        const props = shape.props || {};

        // Debug logging
        if (props.parameters === undefined || props.parameters === null) {
            console.warn('[AiNodeShape] parameters is undefined/null in onBeforeCreate, fixing...', shape);
        }

        // Ensure parameters is always an object (never undefined or null)
        let parameters: Record<string, any> = defaults.parameters || {};
        if (props.parameters) {
            if (typeof props.parameters === 'object' && !Array.isArray(props.parameters)) {
                parameters = props.parameters;
            } else {
                console.warn('[AiNodeShape] parameters is not a valid object, using defaults', props.parameters);
            }
        }

        // Ensure references is always an array
        let references: ReferenceImage[] = defaults.references || [];
        if (props.references) {
            if (Array.isArray(props.references)) {
                references = props.references;
            } else {
                console.warn('[AiNodeShape] references is not an array, using defaults', props.references);
            }
        }

        // Build the final props object, ensuring all required fields exist
        const finalProps: IAiNodeShape["props"] = {
            ...defaults,
            ...props,
            // Override with safe values
            modelId: props.modelId ?? props.model ?? defaults.modelId,
            model: props.model ?? defaults.model,
            parameters: parameters, // Always an object, never undefined
            references: references, // Always an array, never undefined
            mode: props.mode ?? defaults.mode,
        };

        // Final safety check
        if (!finalProps.parameters || typeof finalProps.parameters !== 'object') {
            console.error('[AiNodeShape] CRITICAL: parameters is still invalid after fix!', finalProps.parameters);
            finalProps.parameters = {};
        }
        if (!Array.isArray(finalProps.references)) {
            console.error('[AiNodeShape] CRITICAL: references is still invalid after fix!', finalProps.references);
            finalProps.references = [];
        }

        // Set width based on node type
        if (finalProps.nodeType === "video") {
            finalProps.w = 500;
        } else {
            finalProps.w = 400;
        }

        return {
            ...shape,
            props: finalProps,
        };
    }

    override onBeforeUpdate(prev: IAiNodeShape, next: IAiNodeShape): IAiNodeShape {
        const defaults = this.getDefaultProps();

        // Ensure parameters is always an object (never undefined or null)
        let parameters = defaults.parameters;
        if (next.props.parameters !== undefined && next.props.parameters !== null) {
            if (typeof next.props.parameters === 'object' && !Array.isArray(next.props.parameters)) {
                parameters = next.props.parameters;
            } else if (prev.props.parameters !== undefined && prev.props.parameters !== null) {
                if (typeof prev.props.parameters === 'object' && !Array.isArray(prev.props.parameters)) {
                    parameters = prev.props.parameters;
                }
            }
        } else if (prev.props.parameters !== undefined && prev.props.parameters !== null) {
            if (typeof prev.props.parameters === 'object' && !Array.isArray(prev.props.parameters)) {
                parameters = prev.props.parameters;
            }
        }

        // Ensure references is always an array
        let references = defaults.references;
        if (next.props.references !== undefined && next.props.references !== null) {
            if (Array.isArray(next.props.references)) {
                references = next.props.references;
            } else if (Array.isArray(prev.props.references)) {
                references = prev.props.references;
            }
        } else if (Array.isArray(prev.props.references)) {
            references = prev.props.references;
        }

        return {
            ...next,
            props: {
                ...defaults,
                ...next.props,
                modelId: next.props.modelId ?? next.props.model ?? prev.props.modelId ?? defaults.modelId,
                model: next.props.model ?? prev.props.model ?? defaults.model,
                parameters: parameters, // Always an object
                references: references, // Always an array
                mode: next.props.mode ?? prev.props.mode ?? defaults.mode,
                w: next.props.nodeType === "video" ? 500 : 400,
            },
        };
    }


    override component(shape: IAiNodeShape) {
        // Immediately fix missing fields if detected (before any rendering)
        const props = shape.props || {};
        const defaults = this.getDefaultProps();

        // Check and fix missing fields immediately
        let needsFix = false;
        const fixedProps: Partial<IAiNodeShape["props"]> = {};

        if (!props.modelId && props.modelId !== "") {
            fixedProps.modelId = props.model || defaults.modelId;
            needsFix = true;
        }
        if (!props.parameters || typeof props.parameters !== 'object') {
            fixedProps.parameters = defaults.parameters;
            needsFix = true;
        }
        if (!Array.isArray(props.references)) {
            fixedProps.references = defaults.references;
            needsFix = true;
        }
        if (!props.mode) {
            fixedProps.mode = defaults.mode;
            needsFix = true;
        }

        // Apply fixes immediately if needed
        if (needsFix) {
            // Use setTimeout to avoid updating during render
            setTimeout(() => {
                this.editor.updateShape({
                    id: shape.id,
                    type: "ai-node",
                    props: {
                        ...shape.props,
                        ...fixedProps,
                    },
                });
            }, 0);
        }

        return <AiNodeContent shape={shape} />;
    }

    override indicator(shape: IAiNodeShape) {
        return <path d="" />;
    }
}
