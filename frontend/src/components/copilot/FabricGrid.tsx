import React from 'react';
import { cn } from "@/lib/utils";

interface FabricGridProps {
    images: string[];
    prompt: string;
}

export function FabricGrid({ images, prompt }: FabricGridProps) {
    const handleDragStart = (e: React.DragEvent, url: string) => {
        e.dataTransfer.setData('application/lovart-asset', JSON.stringify({
            type: 'texture',
            url: url,
            prompt: prompt
        }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="grid grid-cols-2 gap-3 my-4">
            {images.map((url, i) => (
                <div
                    key={i}
                    className="group relative aspect-square rounded-full overflow-hidden border border-gray-100 cursor-move hover:shadow-md transition-all"
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, url)}
                >
                    <img
                        src={url}
                        alt={`Fabric texture ${i + 1}`}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-[10px] font-medium text-white bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                            Drag to Apply
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
