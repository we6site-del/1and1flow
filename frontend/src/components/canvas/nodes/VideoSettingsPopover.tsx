import React from "react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    ChevronDown,
    RectangleHorizontal,
    RectangleVertical,
    Square,
} from "lucide-react";
import { stopEventPropagation } from "tldraw";
import { ParameterSchema } from "./DynamicForm";

const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    stopEventPropagation(e as any);
};

interface VideoSettingsPopoverProps {
    schema: ParameterSchema[];
    values: Record<string, any>;
    onChange: (key: string, value: any) => void;
}

const getAspectRatioIcon = (ratio: string) => {
    if (ratio.includes(":")) {
        const [w, h] = ratio.split(":").map(Number);
        if (w > h) return RectangleHorizontal;
        if (h > w) return RectangleVertical;
        return Square;
    }
    return Square;
};

export function VideoSettingsPopover({ schema, values, onChange }: VideoSettingsPopoverProps) {
    // Extract specific parameters
    const sizeParam = schema.find(p => p.key === 'aspect_ratio');
    const durationParam = schema.find(p => p.key === 'duration');
    const qualityParam = schema.find(p => p.key === 'resolution' || p.key === 'quality');

    // Get current values or defaults
    const currentSize = values[sizeParam?.key || ''] || sizeParam?.default;
    const currentDuration = values[durationParam?.key || ''] || durationParam?.default;
    const currentQuality = values[qualityParam?.key || ''] || qualityParam?.default;

    // Generate summary string
    const summary = [
        currentSize,
        currentDuration,
        currentQuality
    ].filter(Boolean).join(" · ");

    if (!sizeParam && !durationParam && !qualityParam) return null;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    className="nodrag nopan flex items-center gap-1 text-[10px] text-gray-600 font-medium bg-gray-100/50 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors"
                    onPointerDown={stopPropagation}
                    onMouseDown={stopPropagation}
                    onClick={stopPropagation}
                >
                    <span>{summary || "Settings"}</span>
                    <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[280px] p-4 bg-white/95 backdrop-blur-sm border-gray-100 shadow-xl"
                align="end"
                sideOffset={8}
                onPointerDown={stopPropagation}
                onMouseDown={stopPropagation}
            >
                <div className="space-y-4">
                    {/* Size / Aspect Ratio Section */}
                    {sizeParam && (
                        <div className="space-y-2">
                            <div className="text-xs text-gray-500 font-medium">Size</div>
                            <div className="flex gap-2">
                                {sizeParam.options?.map(opt => {
                                    const Icon = getAspectRatioIcon(opt.value);
                                    const isSelected = currentSize === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => onChange(sizeParam.key, opt.value)}
                                            className={cn(
                                                "flex flex-col items-center justify-center gap-1.5 w-[72px] h-[72px] rounded-xl border transition-all duration-200",
                                                isSelected
                                                    ? "bg-blue-50 border-blue-200 text-blue-600"
                                                    : "bg-white border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50"
                                            )}
                                        >
                                            <Icon className={cn("w-6 h-6", isSelected ? "stroke-[2px]" : "stroke-[1.5px]")} />
                                            <span className="text-[10px] font-medium">{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Duration Section */}
                    {durationParam && (
                        <div className="space-y-2">
                            <div className="text-xs text-gray-500 font-medium">Duration</div>
                            <div className="flex flex-wrap gap-2">
                                {durationParam.options?.map(opt => {
                                    const isSelected = currentDuration === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => onChange(durationParam.key, opt.value)}
                                            className={cn(
                                                "px-4 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border",
                                                isSelected
                                                    ? "bg-blue-50 border-blue-200 text-blue-600"
                                                    : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Quality / Resolution Section */}
                    {qualityParam && (
                        <div className="space-y-2">
                            <div className="text-xs text-gray-500 font-medium">Quality</div>
                            <div className="flex flex-wrap gap-2">
                                {qualityParam.options?.map(opt => {
                                    const isSelected = currentQuality === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => onChange(qualityParam.key, opt.value)}
                                            className={cn(
                                                "px-4 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border",
                                                isSelected
                                                    ? "bg-blue-50 border-blue-200 text-blue-600"
                                                    : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
