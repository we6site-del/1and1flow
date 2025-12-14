import React from 'react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ColorPaletteProps {
    colors: string[];
}

export function ColorPalette({ colors }: ColorPaletteProps) {
    const handleDragStart = (e: React.DragEvent, color: string) => {
        e.dataTransfer.setData('application/lovart-asset', JSON.stringify({
            type: 'color',
            color: color
        }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const copyToClipboard = (color: string) => {
        navigator.clipboard.writeText(color);
        toast.success(`Copied ${color}`);
    };

    return (
        <div className="flex w-full h-24 rounded-xl overflow-hidden my-4 shadow-sm border border-gray-100">
            {colors.map((color, i) => (
                <div
                    key={i}
                    className="flex-1 h-full flex flex-col justify-end items-center pb-2 cursor-pointer hover:flex-[1.5] transition-all duration-300 group relative"
                    style={{ backgroundColor: color }}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, color)}
                    onClick={() => copyToClipboard(color)}
                >
                    <span className="text-[10px] font-mono font-medium text-white/90 mix-blend-difference opacity-0 group-hover:opacity-100 transition-opacity -rotate-90 mb-4 whitespace-nowrap">
                        {color}
                    </span>
                </div>
            ))}
        </div>
    );
}
