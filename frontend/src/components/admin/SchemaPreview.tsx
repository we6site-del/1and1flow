"use client";

import { useMemo } from "react";
import { validateParametersSchema, type ParameterSchema } from "@/lib/validations/ai-model-schema";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SchemaPreviewProps {
    schemaJson: string;
    className?: string;
}

export function SchemaPreview({ schemaJson, className }: SchemaPreviewProps) {
    const validation = useMemo(() => {
        return validateParametersSchema(schemaJson);
    }, [schemaJson]);

    const schema = validation.data || [];

    if (!validation.success) {
        return (
            <div className={cn("p-4 border border-red-200 rounded-lg bg-red-50", className)}>
                <p className="text-sm text-red-600 font-medium mb-1">Schema Validation Error</p>
                <p className="text-xs text-red-500">{validation.error}</p>
            </div>
        );
    }

    if (schema.length === 0) {
        return (
            <div className={cn("p-4 border border-gray-200 rounded-lg bg-gray-50", className)}>
                <p className="text-sm text-gray-500">No parameters defined. Add parameters to see preview.</p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-4 p-4 border border-gray-200 rounded-lg bg-white", className)}>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Live Preview</h3>
            {schema.map((param: ParameterSchema) => (
                <div key={param.key} className="space-y-2">
                    <Label htmlFor={`preview-${param.key}`}>{param.label}</Label>
                    {renderParameterInput(param)}
                </div>
            ))}
        </div>
    );
}

function renderParameterInput(param: ParameterSchema) {
    switch (param.type) {
        case "select":
            return (
                <Select defaultValue={param.default?.toString()}>
                    <SelectTrigger id={`preview-${param.key}`}>
                        <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                        {param.options?.map((option, idx) => (
                            <SelectItem key={idx} value={option.value.toString()}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );

        case "grid_select":
            return (
                <div className="grid grid-cols-3 gap-2">
                    {param.options?.map((option, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className={cn(
                                "p-3 border rounded-lg text-sm font-medium transition-colors",
                                param.default === option.value
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : "border-gray-200 hover:border-gray-300"
                            )}
                        >
                            {option.label}
                            {option.desc && (
                                <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
                            )}
                        </button>
                    ))}
                </div>
            );

        case "slider":
            return (
                <div className="space-y-2">
                    <Slider
                        id={`preview-${param.key}`}
                        min={param.min || 0}
                        max={param.max || 100}
                        step={param.step || 1}
                        defaultValue={[param.default as number || param.min || 0]}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>{param.min || 0}</span>
                        <span>{param.max || 100}</span>
                    </div>
                </div>
            );

        case "switch":
            return (
                <div className="flex items-center gap-2">
                    <Switch
                        id={`preview-${param.key}`}
                        defaultChecked={param.default as boolean || false}
                    />
                    <span className="text-sm text-gray-500">
                        {param.default ? "Enabled" : "Disabled"}
                    </span>
                </div>
            );

        case "text":
            return (
                <Input
                    id={`preview-${param.key}`}
                    type="text"
                    placeholder={param.placeholder || `Enter ${param.label.toLowerCase()}`}
                    defaultValue={param.default?.toString() || ""}
                    maxLength={param.maxLength}
                />
            );

        default:
            return (
                <div className="text-sm text-gray-400">
                    Unknown parameter type: {(param as any).type}
                </div>
            );
    }
}

