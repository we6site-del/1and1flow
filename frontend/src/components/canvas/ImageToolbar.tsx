import { Editor, TLShapeId, useEditor, useValue } from "tldraw";
import { Button } from "@/components/ui/button";
import {
    Maximize,
    Eraser,
    Image as ImageIcon,
    Download,
    Layers,
    Wand2,
    Scissors,
    Scan,
    MoreHorizontal,
    Trash2,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export function ImageToolbar() {
    const editor = useEditor();
    const t = useTranslations('Canvas'); // Assuming we'll add translations later, or use English for now
    const [isProcessing, setIsProcessing] = useState(false);
    const supabase = createClient();

    // All Hooks must be called before any early returns
    const [isEraserOpen, setIsEraserOpen] = useState(false);
    const [eraserPrompt, setEraserPrompt] = useState("");
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState([20]);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editPrompt, setEditPrompt] = useState("");
    const [editStrength, setEditStrength] = useState([0.75]);
    const [isMockupOpen, setIsMockupOpen] = useState(false);
    const [mockupPrompt, setMockupPrompt] = useState("");
    const [isExpandOpen, setIsExpandOpen] = useState(false);
    const [expandPrompt, setExpandPrompt] = useState("");
    const [expandDirection, setExpandDirection] = useState("right");
    const [expandAmount, setExpandAmount] = useState([0.5]);

    // Track selection
    const selectedShapeId = useValue("selectedShape", () => {
        const selected = editor.getSelectedShapeIds();
        if (selected.length === 1) {
            return selected[0];
        }
        return null;
    }, [editor]);

    // Track shape details if selected
    const shape = useValue("shape", () => {
        if (!selectedShapeId) return null;
        return editor.getShape(selectedShapeId);
    }, [editor, selectedShapeId]);

    // Determine if we should show the toolbar
    const shouldShow = useValue("shouldShow", () => {
        if (!shape) return false;
        // Show for image shapes or our custom AI nodes that have an image
        if (shape.type === "image") return true;
        if (shape.type === "ai-node" && (shape.props as any).imageUrl) return true;
        return false;
    }, [shape]);

    // Helper to get image URL
    const getImageUrl = () => {
        if (!shape) return null;
        if (shape.type === "image") return (shape.props as any).url;
        if (shape.type === "ai-node") return (shape.props as any).imageUrl;
        return null;
    };

    const imageUrl = getImageUrl();

    // Initialize canvas when eraser dialog opens
    useEffect(() => {
        if (isEraserOpen && canvasRef.current && imageUrl) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = imageUrl;
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                // Clear canvas
                if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            };
        }
    }, [isEraserOpen, imageUrl]);

    // Early return after all Hooks
    if (!shouldShow || !shape) return null;

    // Handlers
    const processImage = async (endpoint: string, successMessage: string, extraBody: object = {}) => {
        if (!imageUrl || isProcessing) return;
        setIsProcessing(true);
        const toastId = toast.loading("Processing image...");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Please login to use AI features", { id: toastId });
                return;
            }

            const response = await fetch(`/api/generate/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image_url: imageUrl,
                    user_id: user.id,
                    ...extraBody
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Processing failed");
            }

            const data = await response.json();

            // Update shape with new URL
            if (shape.type === "image") {
                editor.updateShape({
                    id: shape.id,
                    type: "image",
                    props: { url: data.url, w: (shape.props as any).w, h: (shape.props as any).h }
                });
            } else if (shape.type === "ai-node") {
                editor.updateShape({
                    id: shape.id,
                    type: "ai-node",
                    props: { imageUrl: data.url }
                });
            }

            toast.success(successMessage, { id: toastId });
        } catch (e: any) {
            console.error(e);
            toast.error(`Failed: ${e.message}`, { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = async () => {
        if (!imageUrl) return;
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `image-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error("Download failed", e);
            window.open(imageUrl, "_blank");
        }
    };

    const handleOpacityChange = (value: number[]) => {
        editor.updateShape({
            id: shape.id,
            type: shape.type,
            opacity: value[0],
        });
    };


    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineWidth = brushSize[0];
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'white'; // Mask color
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const handleErase = async () => {
        if (!imageUrl || isProcessing || !eraserPrompt) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        setIsProcessing(true);
        setIsEraserOpen(false);
        const toastId = toast.loading("Inpainting image...");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Please login to use AI features", { id: toastId });
                return;
            }

            // 1. Upload Mask
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error("Failed to create mask blob");

            const formData = new FormData();
            formData.append("file", blob);

            const uploadResponse = await fetch("/api/generate/upload/mask", {
                method: "POST",
                body: formData
            });

            if (!uploadResponse.ok) throw new Error("Failed to upload mask");
            const { url: maskUrl } = await uploadResponse.json();

            // 2. Call Inpaint API
            const response = await fetch(`/api/generate/inpaint`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image_url: imageUrl,
                    mask_url: maskUrl,
                    prompt: eraserPrompt,
                    user_id: user.id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Inpainting failed");
            }

            const data = await response.json();

            // Update shape
            if (shape.type === "image") {
                editor.updateShape({
                    id: shape.id,
                    type: "image",
                    props: { url: data.url, w: (shape.props as any).w, h: (shape.props as any).h }
                });
            } else if (shape.type === "ai-node") {
                editor.updateShape({
                    id: shape.id,
                    type: "ai-node",
                    props: { imageUrl: data.url }
                });
            }

            toast.success("Image inpainted successfully", { id: toastId });
        } catch (e: any) {
            console.error(e);
            toast.error(`Failed: ${e.message}`, { id: toastId });
        } finally {
            setIsProcessing(false);
            setEraserPrompt("");
        }
    };

    const handleEdit = async () => {
        if (!imageUrl || isProcessing || !editPrompt) return;
        setIsProcessing(true);
        setIsEditOpen(false);
        const toastId = toast.loading("Editing image...");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Please login to use AI features", { id: toastId });
                return;
            }

            const response = await fetch(`/api/generate/edit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image_url: imageUrl,
                    prompt: editPrompt,
                    strength: editStrength[0],
                    user_id: user.id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Editing failed");
            }

            const data = await response.json();

            // Update shape with new URL
            if (shape.type === "image") {
                editor.updateShape({
                    id: shape.id,
                    type: "image",
                    props: { url: data.url, w: (shape.props as any).w, h: (shape.props as any).h }
                });
            } else if (shape.type === "ai-node") {
                editor.updateShape({
                    id: shape.id,
                    type: "ai-node",
                    props: { imageUrl: data.url }
                });
            }

            toast.success("Image edited successfully", { id: toastId });
        } catch (e: any) {
            console.error(e);
            toast.error(`Failed: ${e.message}`, { id: toastId });
        } finally {
            setIsProcessing(false);
            setEditPrompt("");
        }
    };

    const handleMockup = async () => {
        if (!imageUrl || isProcessing || !mockupPrompt) return;
        setIsProcessing(true);
        setIsMockupOpen(false);
        const toastId = toast.loading("Generating mockup...");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Please login to use AI features", { id: toastId });
                return;
            }

            const response = await fetch(`/api/generate/mockup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image_url: imageUrl,
                    prompt: mockupPrompt,
                    user_id: user.id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Mockup failed");
            }

            const data = await response.json();

            // Update shape
            if (shape.type === "image") {
                editor.updateShape({
                    id: shape.id,
                    type: "image",
                    props: { url: data.url, w: (shape.props as any).w, h: (shape.props as any).h }
                });
            } else if (shape.type === "ai-node") {
                editor.updateShape({
                    id: shape.id,
                    type: "ai-node",
                    props: { imageUrl: data.url }
                });
            }

            toast.success("Mockup generated successfully", { id: toastId });
        } catch (e: any) {
            console.error(e);
            toast.error(`Failed: ${e.message}`, { id: toastId });
        } finally {
            setIsProcessing(false);
            setMockupPrompt("");
        }
    };

    const handleExpand = async () => {
        if (!imageUrl || isProcessing || !expandPrompt) return;
        setIsProcessing(true);
        setIsExpandOpen(false);
        const toastId = toast.loading("Expanding image...");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Please login to use AI features", { id: toastId });
                return;
            }

            const response = await fetch(`/api/generate/expand`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image_url: imageUrl,
                    prompt: expandPrompt,
                    direction: expandDirection,
                    amount: expandAmount[0],
                    user_id: user.id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Expansion failed");
            }

            const data = await response.json();

            // Update shape
            if (shape.type === "image") {
                editor.updateShape({
                    id: shape.id,
                    type: "image",
                    props: { url: data.url, w: (shape.props as any).w, h: (shape.props as any).h }
                });
            } else if (shape.type === "ai-node") {
                editor.updateShape({
                    id: shape.id,
                    type: "ai-node",
                    props: { imageUrl: data.url }
                });
            }

            toast.success("Image expanded successfully", { id: toastId });
        } catch (e: any) {
            console.error(e);
            toast.error(`Failed: ${e.message}`, { id: toastId });
        } finally {
            setIsProcessing(false);
            setExpandPrompt("");
        }
    };

    // Calculate position (centered above selection)
    const bounds = editor.getShapePageBounds(shape.id);
    if (!bounds) return null;

    const viewportBounds = editor.getViewportPageBounds();
    const zoom = editor.getZoomLevel();

    // Convert page coordinates to screen coordinates
    const screenX = (bounds.minX - viewportBounds.minX) * zoom;
    const screenY = (bounds.minY - viewportBounds.minY) * zoom;
    const screenWidth = bounds.width * zoom;

    // Position above the node
    const style = {
        transform: `translate(${screenX + screenWidth / 2}px, ${screenY - 50}px) translate(-50%, 0)`,
    };

    return (
        <>
            <div
                className="absolute top-0 left-0 z-[999999] pointer-events-auto"
                style={style}
            >
                <div className="flex items-center gap-1 p-1 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-200/60 backdrop-blur-sm">

                    {/* Upscale with Resolution Selector */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    "flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                                    isProcessing && "opacity-50 cursor-not-allowed"
                                )}
                                disabled={isProcessing}
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <Maximize className={cn("w-4 h-4", isProcessing && "animate-pulse")} />
                                <span className="hidden sm:inline">Upscale</span>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-32 p-1 bg-white/95 backdrop-blur-sm border-gray-100 shadow-xl" side="bottom" align="center" onOpenAutoFocus={(e) => e.preventDefault()}>
                            <div className="grid gap-1">
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs hover:bg-gray-100 transition-colors cursor-pointer"
                                    onPointerDown={(e) => {
                                        // Use onPointerDown to bypass potential canvas event capture
                                        e.preventDefault();
                                        e.stopPropagation();
                                        processImage("upscale", "Upscaled (2k/2x)", { scale: 2 });
                                    }}
                                >
                                    <span>2k (2x)</span>
                                    <span className="text-gray-400">⚡2</span>
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs hover:bg-gray-100 transition-colors cursor-pointer"
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        processImage("upscale", "Upscaled (4k/4x)", { scale: 4 });
                                    }}
                                >
                                    <span>4k (4x)</span>
                                    <span className="text-gray-400">⚡4</span>
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs hover:bg-gray-100 transition-colors cursor-pointer"
                                    disabled={true}
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        processImage("upscale", "Upscaled (8k/8x)", { scale: 8 });
                                    }}
                                >
                                    <span>8k (8x)</span>
                                    <span className="text-gray-400">⚡4</span>
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Remove BG */}
                    <ToolbarButton
                        icon={<Scissors className={cn("w-4 h-4", isProcessing && "animate-pulse")} />}
                        label="Remove BG"
                        onClick={() => processImage("remove-background", "Background removed successfully")}
                        disabled={isProcessing}
                    />

                    {/* Mockup */}
                    <ToolbarButton
                        icon={<ImageIcon className="w-4 h-4" />}
                        label="Mockup"
                        onClick={() => setIsMockupOpen(true)}
                        disabled={isProcessing}
                    />

                    {/* Erase */}
                    <ToolbarButton
                        icon={<Eraser className="w-4 h-4" />}
                        label="Erase"
                        onClick={() => setIsEraserOpen(true)}
                        disabled={isProcessing}
                    />

                    {/* Edit Element */}
                    <ToolbarButton
                        icon={<Wand2 className="w-4 h-4" />}
                        label="Edit"
                        onClick={() => setIsEditOpen(true)}
                        disabled={isProcessing}
                    />

                    {/* Expand */}
                    <ToolbarButton
                        icon={<Scan className="w-4 h-4" />}
                        label="Expand"
                        onClick={() => setIsExpandOpen(true)}
                        disabled={isProcessing}
                    />

                    <div className="w-px h-4 bg-gray-200 mx-1" />

                    {/* Transparency */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-700 transition-colors">
                                <Layers className="w-4 h-4" />
                                <span className="hidden sm:inline">Opacity</span>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-4 bg-white/95 backdrop-blur-sm border-gray-100 shadow-xl" side="bottom" align="center">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Opacity</span>
                                    <span>{Math.round((shape.opacity ?? 1) * 100)}%</span>
                                </div>
                                <Slider
                                    value={[shape.opacity ?? 1]}
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    onValueChange={handleOpacityChange}
                                />
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Download */}
                    <ToolbarButton
                        icon={<Download className="w-4 h-4" />}
                        onClick={handleDownload}
                        tooltip="Download"
                    />

                </div>
            </div>

            <Dialog open={isEraserOpen} onOpenChange={setIsEraserOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Erase / Inpaint</DialogTitle>
                        <DialogDescription>
                            Draw over the area you want to change, then describe what to fill it with.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="relative w-full h-[400px] bg-gray-100 rounded-md overflow-hidden flex items-center justify-center border">
                            {imageUrl && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={imageUrl}
                                    alt="Original"
                                    className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
                                />
                            )}
                            <canvas
                                ref={canvasRef}
                                className="absolute top-0 left-0 w-full h-full object-contain cursor-crosshair opacity-70"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                            />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex justify-between text-sm">
                                <label htmlFor="brushSize" className="font-medium">
                                    Brush Size
                                </label>
                                <span className="text-muted-foreground">{brushSize[0]}px</span>
                            </div>
                            <Slider
                                id="brushSize"
                                value={brushSize}
                                min={5}
                                max={100}
                                step={5}
                                onValueChange={setBrushSize}
                            />
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="eraserPrompt" className="text-sm font-medium">
                                Prompt
                            </label>
                            <textarea
                                id="eraserPrompt"
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="e.g., remove the object, or 'a red balloon'"
                                value={eraserPrompt}
                                onChange={(e) => setEraserPrompt(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEraserOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleErase} disabled={!eraserPrompt || isProcessing}>
                            {isProcessing ? "Processing..." : "Generate"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Image</DialogTitle>
                        <DialogDescription>
                            Describe how you want to change the image.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="prompt" className="text-sm font-medium">
                                Prompt
                            </label>
                            <textarea
                                id="prompt"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="e.g., make it a cyberpunk city"
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex justify-between text-sm">
                                <label htmlFor="strength" className="font-medium">
                                    Strength
                                </label>
                                <span className="text-muted-foreground">{editStrength[0]}</span>
                            </div>
                            <Slider
                                id="strength"
                                value={editStrength}
                                min={0}
                                max={1}
                                step={0.05}
                                onValueChange={setEditStrength}
                            />
                            <p className="text-xs text-muted-foreground">
                                Higher strength means more changes to the original image.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEdit} disabled={!editPrompt || isProcessing}>
                            {isProcessing ? "Editing..." : "Edit Image"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isMockupOpen} onOpenChange={setIsMockupOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Generate Mockup</DialogTitle>
                        <DialogDescription>
                            Describe the scene to place your image into.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="mockupPrompt" className="text-sm font-medium">
                                Prompt
                            </label>
                            <textarea
                                id="mockupPrompt"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="e.g., on a billboard in times square"
                                value={mockupPrompt}
                                onChange={(e) => setMockupPrompt(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMockupOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleMockup} disabled={!mockupPrompt || isProcessing}>
                            {isProcessing ? "Generating..." : "Generate Mockup"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isExpandOpen} onOpenChange={setIsExpandOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Expand Image</DialogTitle>
                        <DialogDescription>
                            Choose direction and amount to expand.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Direction</label>
                            <div className="flex justify-center gap-4">
                                <Button
                                    variant={expandDirection === "up" ? "default" : "outline"}
                                    size="icon"
                                    onClick={() => setExpandDirection("up")}
                                >
                                    <ArrowUp className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex justify-center gap-4">
                                <Button
                                    variant={expandDirection === "left" ? "default" : "outline"}
                                    size="icon"
                                    onClick={() => setExpandDirection("left")}
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </Button>
                                <div className="w-10 h-10 flex items-center justify-center border rounded-md bg-muted">
                                    <Scan className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <Button
                                    variant={expandDirection === "right" ? "default" : "outline"}
                                    size="icon"
                                    onClick={() => setExpandDirection("right")}
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex justify-center gap-4">
                                <Button
                                    variant={expandDirection === "down" ? "default" : "outline"}
                                    size="icon"
                                    onClick={() => setExpandDirection("down")}
                                >
                                    <ArrowDown className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="expandPrompt" className="text-sm font-medium">
                                Prompt (Optional)
                            </label>
                            <textarea
                                id="expandPrompt"
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Describe the new area (optional)"
                                value={expandPrompt}
                                onChange={(e) => setExpandPrompt(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex justify-between text-sm">
                                <label className="font-medium">Amount</label>
                                <span className="text-muted-foreground">{Math.round(expandAmount[0] * 100)}%</span>
                            </div>
                            <Slider
                                value={expandAmount}
                                min={0.25}
                                max={1.0}
                                step={0.25}
                                onValueChange={setExpandAmount}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsExpandOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleExpand} disabled={isProcessing}>
                            {isProcessing ? "Expanding..." : "Expand Image"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function ToolbarButton({
    icon,
    label,
    onClick,
    tooltip,
    className,
    disabled
}: {
    icon: React.ReactNode,
    label?: string,
    onClick?: () => void,
    tooltip?: string,
    className?: string,
    disabled?: boolean
}) {
    return (
        <button
            className={cn(
                "flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed",
                className
            )}
            onClick={onClick}
            title={tooltip || label}
            disabled={disabled}
        >
            {icon}
            {label && <span className="hidden sm:inline">{label}</span>}
        </button>
    );
}
