"use client";

import { useEditor, useValue } from "tldraw";
import {
    MousePointer2, Hand, MapPin,
    Image as ImageIcon, Video, Sparkles, Clapperboard, Frame,
    Square, Circle, Triangle, Star, ArrowRight, Minus,
    Type,
    Pencil, PenTool, Eraser,
    ChevronRight, Library
} from "lucide-react";
import { PromptGalleryOverlay } from "../gallery/PromptGalleryOverlay";
import { GalleryItem } from "../gallery/GalleryCard";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

type ToolItem = {
    id: string;
    icon: any;
    label: string;
    shortcut?: string;
    toolId: string;
    toolOptions?: any;
};

type ToolGroup = {
    id: string;
    tools: ToolItem[];
};

export default function LeftToolbar() {
    const editor = useEditor();
    const t = useTranslations('LeftToolbar');
    const currentToolId = useValue("current tool", () => editor?.getCurrentToolId(), [editor]);

    const TOOL_GROUPS: ToolGroup[] = [
        {
            id: "select-group",
            tools: [
                { id: "select", icon: MousePointer2, label: t('select'), shortcut: "V", toolId: "select" },
                { id: "hand", icon: Hand, label: t('hand'), shortcut: "H", toolId: "hand" },
                { id: "laser", icon: MapPin, label: t('mark'), shortcut: "M", toolId: "laser" },
            ]
        },
        {
            id: "insert-group",
            tools: [
                { id: "asset-image", icon: ImageIcon, label: t('uploadImage'), toolId: "asset" },
                { id: "asset-video", icon: Video, label: t('uploadVideo'), toolId: "asset" },
                { id: "ai-image", icon: Sparkles, label: t('imageGenerator'), shortcut: "A", toolId: "select" },
                { id: "ai-video", icon: Clapperboard, label: t('videoGenerator'), toolId: "select" },
                { id: "frame", icon: Frame, label: t('frame'), shortcut: "F", toolId: "frame" },
            ]
        },
        {
            id: "shape-group",
            tools: [
                { id: "geo-rect", icon: Square, label: t('rectangle'), toolId: "geo", toolOptions: { geo: "rectangle" } },
                { id: "geo-ellipse", icon: Circle, label: t('ellipse'), toolId: "geo", toolOptions: { geo: "ellipse" } },
                { id: "geo-triangle", icon: Triangle, label: t('triangle'), toolId: "geo", toolOptions: { geo: "triangle" } },
                { id: "geo-star", icon: Star, label: t('star'), toolId: "geo", toolOptions: { geo: "star" } },
                { id: "arrow", icon: ArrowRight, label: t('arrow'), toolId: "arrow" },
                { id: "line", icon: Minus, label: t('line'), toolId: "line" },
                { id: "text", icon: Type, label: t('text'), shortcut: "T", toolId: "text" },
            ]
        },
        {
            id: "gallery-group",
            tools: [
                { id: "gallery", icon: Library, label: "Prompt Gallery", toolId: "gallery-action" },
            ]
        },
        {
            id: "draw-group",
            tools: [
                { id: "draw", icon: Pencil, label: t('pencil'), shortcut: "P", toolId: "draw" },
                { id: "highlight", icon: PenTool, label: t('pen'), shortcut: "P", toolId: "highlight" },
                { id: "eraser", icon: Eraser, label: t('eraser'), shortcut: "E", toolId: "eraser" },
            ]
        }
    ];

    // State to track the "active" tool for each group (the one displayed in the main bar)
    const [groupActiveTools, setGroupActiveTools] = useState<Record<string, ToolItem>>(() => {
        const initial: Record<string, ToolItem> = {};
        TOOL_GROUPS.forEach(group => {
            initial[group.id] = group.tools[0];
        });
        return initial;
    });

    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    const handleGallerySelect = (item: GalleryItem) => {
        setIsGalleryOpen(false);
        if (!editor) return;

        const { center } = editor.getViewportPageBounds();
        const width = 400;
        const height = 450;

        // Get default props to ensure valid shape
        const shapeUtil = editor.getShapeUtil('ai-node');
        const defaultProps = shapeUtil.getDefaultProps() as any;

        const modelConfig = item.model_config || {};

        editor.createShapes([{
            type: 'ai-node',
            x: center.x - width / 2,
            y: center.y - height / 2,
            props: {
                ...defaultProps,
                w: width,
                h: height,
                nodeType: 'image',
                prompt: item.prompt,
                imageUrl: "", // Empty to allow generation
                modelId: modelConfig.model_id || "flux-pro",
                parameters: modelConfig,
                status: 'idle',
                references: item.image_url ? [{
                    id: `ref:${Date.now()}`,
                    url: item.image_url,
                    type: 'reference'
                }] : [],
            }
        }]);

        editor.setCurrentTool('select');
    };

    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update active group tool when editor tool changes externally (e.g. shortcuts)
    useEffect(() => {
        if (!currentToolId) return;

        // Find which group this tool belongs to and update it
        // This is a bit complex because multiple items map to same toolId (e.g. geo)
        // We might just skip this for now to avoid overriding user's manual selection in the UI
        // or implement smarter matching if needed.
    }, [currentToolId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) return;

        const reader = new FileReader();
        reader.onload = async () => {
            const src = reader.result as string;

            let width = 500;
            let height = 500;

            if (isImage) {
                const img = new Image();
                img.src = src;
                await new Promise((resolve) => {
                    img.onload = () => {
                        width = img.width;
                        height = img.height;
                        resolve(null);
                    }
                });
            } else if (isVideo) {
                const video = document.createElement('video');
                video.src = src;
                await new Promise((resolve) => {
                    video.onloadedmetadata = () => {
                        width = video.videoWidth;
                        height = video.videoHeight;
                        resolve(null);
                    }
                });
            }

            const assetId = `asset:${Date.now()}` as any;

            // Create asset
            editor.createAssets([
                {
                    id: assetId,
                    typeName: 'asset',
                    type: isImage ? 'image' : 'video',
                    props: {
                        name: file.name,
                        src: src,
                        w: width,
                        h: height,
                        mimeType: file.type,
                        isAnimated: isVideo,
                    },
                    meta: {},
                },
            ]);

            // Create shape
            const viewportBounds = editor.getViewportPageBounds();
            editor.createShapes([
                {
                    type: isImage ? 'image' : 'video',
                    x: viewportBounds.center.x - width / 2,
                    y: viewportBounds.center.y - height / 2,
                    props: {
                        assetId: assetId,
                        w: width,
                        h: height,
                    },
                },
            ]);
        };
        reader.readAsDataURL(file);

        // Reset input
        e.target.value = "";
    };

    const handleToolClick = (group: ToolGroup, tool: ToolItem) => {
        if (!editor) return;

        // Update active tool for this group
        setGroupActiveTools(prev => ({
            ...prev,
            [group.id]: tool
        }));

        // Handle special actions
        if (tool.toolId === "asset") {
            // Trigger file upload
            fileInputRef.current?.click();
        } else if (tool.toolId === "gallery-action") {
            setIsGalleryOpen(true);
        } else if (tool.id === "ai-image" || tool.id === "ai-video") {
            // Create AI Node
            const viewportBounds = editor.getViewportPageBounds();
            const isImage = tool.id === 'ai-image';

            // Get the shape util to access default props
            const shapeUtil = editor.getShapeUtil('ai-node');
            const defaultProps = shapeUtil.getDefaultProps() as any;

            editor.createShapes([
                {
                    type: 'ai-node',
                    x: viewportBounds.center.x - 200, // Half of 400 width
                    y: viewportBounds.center.y - (isImage ? 225 : 250), // Half of height
                    props: {
                        ...defaultProps, // Start with all defaults
                        nodeType: isImage ? 'image' : 'video',
                        w: 400,
                        h: isImage ? 450 : 500,
                        model: isImage ? "flux-pro" : "kling-pro", // Legacy field for backward compatibility
                        aspectRatio: isImage ? "3:4" : "16:9",
                        // Ensure parameters is always an object
                        parameters: defaultProps.parameters || {},
                        // Ensure references is always an array
                        references: defaultProps.references || [],
                    },
                },
            ]);
            // Switch to select tool to manipulate the new node
            editor.setCurrentTool('select');
        } else {
            // Set editor tool
            if (tool.toolOptions) {
                editor.setCurrentTool(tool.toolId, tool.toolOptions);
            } else {
                editor.setCurrentTool(tool.toolId);
            }
        }

        // Close popover
        setOpenPopoverId(null);
    };

    const handleGroupClick = (group: ToolGroup) => {
        const activeTool = groupActiveTools[group.id];
        handleToolClick(group, activeTool);
    };

    const handleMouseEnter = (groupId: string) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setOpenPopoverId(groupId);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setOpenPopoverId(null);
        }, 300); // Small delay to allow moving to popover
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileUpload}
            />
            <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-[2000]">
                <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-gray-100 p-2 flex flex-col gap-2">
                    {TOOL_GROUPS.map((group) => {
                        const activeTool = groupActiveTools[group.id];
                        const isActive = currentToolId === activeTool.toolId; // Simple check, might need refinement for shared toolIds

                        return (
                            <div
                                key={group.id}
                                className="relative flex items-center"
                                onMouseEnter={() => handleMouseEnter(group.id)}
                                onMouseLeave={handleMouseLeave}
                            >
                                {/* Main Group Button */}
                                <button
                                    onClick={() => handleGroupClick(group)}
                                    className={cn(
                                        "w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 relative group",
                                        isActive
                                            ? "bg-gray-100 text-black"
                                            : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                >
                                    <activeTool.icon className="w-5 h-5 stroke-[1.5]" />

                                    {/* Tiny indicator for dropdown */}
                                    {group.tools.length > 1 && (
                                        <div className="absolute bottom-1 right-1 w-1 h-1 bg-gray-300 rounded-full" />
                                    )}
                                </button>

                                {/* Popover Menu */}
                                {openPopoverId === group.id && group.tools.length > 1 && (
                                    <div
                                        className="absolute left-full top-0 ml-3 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-gray-100 p-2 min-w-[180px] flex flex-col gap-1 animate-in fade-in slide-in-from-left-2 duration-200"
                                    >
                                        {group.id === "shape-group" ? (
                                            // Grid layout for shapes
                                            <div className="grid grid-cols-4 gap-1 p-1">
                                                {group.tools.map((tool) => (
                                                    <button
                                                        key={tool.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToolClick(group, tool);
                                                        }}
                                                        className={cn(
                                                            "w-9 h-9 flex items-center justify-center rounded-lg transition-colors",
                                                            activeTool.id === tool.id
                                                                ? "bg-gray-100 text-black"
                                                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                                        )}
                                                        title={tool.label}
                                                    >
                                                        <tool.icon className="w-5 h-5 stroke-[1.5]" />
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            // List layout for others
                                            group.tools.map((tool) => (
                                                <button
                                                    key={tool.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToolClick(group, tool);
                                                    }}
                                                    className={cn(
                                                        "flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors w-full",
                                                        activeTool.id === tool.id
                                                            ? "bg-gray-100 text-black font-medium"
                                                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <tool.icon className="w-4 h-4 stroke-[1.5]" />
                                                        <span>{tool.label}</span>
                                                    </div>
                                                    {tool.shortcut && (
                                                        <span className="text-[10px] text-gray-400 font-mono">{tool.shortcut}</span>
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <PromptGalleryOverlay
                open={isGalleryOpen}
                onOpenChange={setIsGalleryOpen}
                onSelect={handleGallerySelect}
            />
        </>
    );
}
