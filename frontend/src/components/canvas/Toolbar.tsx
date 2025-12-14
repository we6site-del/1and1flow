"use client";

import { useEditor, useValue } from "tldraw";
import { Button } from "@/components/ui/button";
import { MousePointer2, Hand, Pencil, PlusSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Toolbar() {
    const editor = useEditor();

    // Track current tool to highlight active button
    const currentToolId = useValue("current tool id", () => editor.getCurrentToolId(), [editor]);

    const handleToolSelect = (toolId: string) => {
        editor.setCurrentTool(toolId);
    };

    const handleAddNode = () => {
        // Switch to select tool first
        editor.setCurrentTool('select');

        // Create shape at center of viewport
        const { x, y } = editor.getViewportPageBounds().center;

        editor.createShape({
            type: "ai-node",
            x: x - 150, // Center the 300px wide node
            y: y - 200, // Center the 400px high node
            props: {
                w: 300,
                h: 400,
            },
        });
    };

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur shadow-lg border border-gray-200 rounded-full p-2 flex gap-2 z-[1000]">
            <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-full", currentToolId === "select" && "bg-gray-100")}
                onClick={() => handleToolSelect("select")}
            >
                <MousePointer2 className="w-5 h-5" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-full", currentToolId === "hand" && "bg-gray-100")}
                onClick={() => handleToolSelect("hand")}
            >
                <Hand className="w-5 h-5" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-full", currentToolId === "draw" && "bg-gray-100")}
                onClick={() => handleToolSelect("draw")}
            >
                <Pencil className="w-5 h-5" />
            </Button>
            <div className="w-px bg-gray-200 mx-1" />
            <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-blue-50 hover:text-blue-600"
                onClick={handleAddNode}
            >
                <PlusSquare className="w-5 h-5" />
            </Button>
        </div>
    );
}
