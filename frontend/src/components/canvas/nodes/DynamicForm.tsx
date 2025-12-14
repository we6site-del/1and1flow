import React from "react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Slider,
} from "@/components/ui/slider";
import {
    ChevronDown,
    Check,
    Monitor,
    RectangleHorizontal,
    RectangleVertical,
    Square,
    RefreshCw
} from "lucide-react";
import { stopEventPropagation } from "tldraw";

const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    stopEventPropagation(e as any);
};

// Type definitions for parameter schema
export type ParameterSchema = {
    key: string;
    label: string;
    type: "select" | "grid_select" | "slider" | "switch" | "text";
    options?: Array<{ label: string; value: any; desc?: string; icon?: string }>;
    default?: any;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
};

interface DynamicFormProps {
    schema: ParameterSchema[];
    values: Record<string, any>;
    onChange: (key: string, value: any) => void;
    className?: string;
}

// Icon mapping for aspect ratios
const getAspectRatioIcon = (ratio: string) => {
    if (ratio.includes(":")) {
        const [w, h] = ratio.split(":").map(Number);
        if (w > h) return RectangleHorizontal;
        if (h > w) return RectangleVertical;
        return Square;
    }
    return Square;
};

export function DynamicForm({ schema, values, onChange, className }: DynamicFormProps) {
    if (!schema || schema.length === 0) {
        return null;
    }

    const renderParameter = (param: ParameterSchema) => {
        const value = values[param.key] ?? param.default;
        const IconComponent = param.type === "grid_select" && param.options?.[0]?.value?.includes(":")
            ? getAspectRatioIcon(param.options[0].value)
            : null;

        switch (param.type) {
            case "select":
                return (
                    <DropdownMenu key={param.key}>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="nodrag nopan flex items-center gap-1 text-[10px] font-medium text-gray-600 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors"
                                onPointerDown={stopPropagation}
                                onMouseDown={stopPropagation}
                                onClick={stopPropagation}
                            >
                                {param.label}: {param.options?.find(opt => opt.value === value)?.label || value}
                                <ChevronDown className="w-3 h-3 opacity-50" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 bg-white/95 backdrop-blur-sm border-gray-100 shadow-md">
                            {param.options?.map(opt => (
                                <DropdownMenuItem
                                    key={opt.value}
                                    onClick={() => onChange(param.key, opt.value)}
                                    className={cn(
                                        "cursor-pointer",
                                        value === opt.value && "bg-gray-100"
                                    )}
                                >
                                    {opt.label}
                                    {value === opt.value && <Check className="w-3 h-3 ml-auto" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );

            case "grid_select":
                return (
                    <Popover key={param.key}>
                        <PopoverTrigger asChild>
                            <button
                                className="nodrag nopan flex items-center gap-1 text-[10px] text-gray-500 font-medium bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors"
                                onPointerDown={stopPropagation}
                                onMouseDown={stopPropagation}
                                onClick={stopPropagation}
                            >
                                <span>{param.label}</span>
                                <span>·</span>
                                <span>{param.options?.find(opt => opt.value === value)?.label || value}</span>
                                <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-64 p-2 bg-white/95 backdrop-blur-sm border-gray-100 shadow-lg"
                            align="end"
                            onPointerDown={stopPropagation}
                        >
                            <div className="text-[10px] text-gray-400 px-2 py-1 mb-1">格式</div>
                            <div className="grid grid-cols-1 gap-0.5">
                                {param.options?.map(opt => {
                                    const Icon = opt.value?.includes(":")
                                        ? getAspectRatioIcon(opt.value)
                                        : Square;
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => onChange(param.key, opt.value)}
                                            className={cn(
                                                "flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] transition-colors w-full text-left",
                                                value === opt.value
                                                    ? "bg-gray-100 text-black font-medium"
                                                    : "text-gray-500 hover:bg-gray-50"
                                            )}
                                        >
                                            <Icon className="w-3 h-3" />
                                            <span className="font-medium w-8">{opt.label}</span>
                                            {opt.desc && (
                                                <span className="text-gray-300 font-mono text-[9px]">{opt.desc}</span>
                                            )}
                                            {value === opt.value && (
                                                <Check className="w-3 h-3 ml-auto text-gray-600" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </PopoverContent>
                    </Popover>
                );

            case "slider":
                return (
                    <div key={param.key} className="flex items-center gap-2 min-w-[120px]">
                        <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
                            {param.label}: {value}
                        </span>
                        <Slider
                            value={[value ?? param.default ?? param.min ?? 0]}
                            onValueChange={(vals) => onChange(param.key, vals[0])}
                            min={param.min ?? 0}
                            max={param.max ?? 100}
                            step={param.step ?? 1}
                            className="flex-1"
                            onPointerDown={stopPropagation}
                        />
                    </div>
                );

            case "switch":
                return (
                    <button
                        key={param.key}
                        onClick={() => onChange(param.key, !value)}
                        className={cn(
                            "nodrag nopan px-2 py-1 text-[10px] font-medium rounded-md transition-colors",
                            value
                                ? "bg-gray-100 text-gray-700"
                                : "text-gray-400 hover:text-gray-600"
                        )}
                        onPointerDown={stopPropagation}
                        onMouseDown={stopPropagation}
                    >
                        {param.label}
                    </button>
                );

            case "text":
                return (
                    <input
                        key={param.key}
                        type="text"
                        value={value ?? ""}
                        onChange={(e) => onChange(param.key, e.target.value)}
                        placeholder={param.placeholder}
                        className="nodrag nopan text-[10px] px-2 py-1 rounded-md border border-gray-100 bg-white focus:outline-none focus:ring-1 focus:ring-gray-300"
                        onPointerDown={stopPropagation}
                        onMouseDown={stopPropagation}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className={cn("flex items-center gap-2 overflow-x-auto max-w-[200px] scrollbar-hide mask-linear-fade", className)}>
            {schema.map(renderParameter)}
        </div>
    );
}


