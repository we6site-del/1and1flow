"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface JsonEditorProps {
    value: string;
    onChange: (value: string) => void;
    height?: string;
    className?: string;
}

export function JsonEditor({ value, onChange, height = "200px", className }: JsonEditorProps) {
    const [localValue, setLocalValue] = useState(value);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (newValue: string) => {
        setLocalValue(newValue);
        
        // Validate JSON
        try {
            const parsed = JSON.parse(newValue);
            if (!Array.isArray(parsed)) {
                setError("Must be a JSON array");
            } else {
                setError("");
                onChange(newValue);
            }
        } catch (e) {
            // Don't show error while typing, only on blur
        }
    };

    const handleBlur = () => {
        try {
            const parsed = JSON.parse(localValue);
            if (!Array.isArray(parsed)) {
                setError("Must be a JSON array");
            } else {
                setError("");
                onChange(localValue);
            }
        } catch (e) {
            setError("Invalid JSON format");
        }
    };

    const formatJson = () => {
        try {
            const parsed = JSON.parse(localValue);
            const formatted = JSON.stringify(parsed, null, 2);
            setLocalValue(formatted);
            setError("");
            onChange(formatted);
        } catch (e) {
            setError("Cannot format: Invalid JSON");
        }
    };

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={formatJson}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                >
                    Format JSON
                </button>
            </div>
            <textarea
                value={localValue}
                onChange={(e) => handleChange(e.target.value)}
                onBlur={handleBlur}
                className={cn(
                    "font-mono text-sm p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500",
                    error && "border-red-500 focus:ring-red-500"
                )}
                style={{ height }}
                placeholder='[\n  {\n    "key": "duration",\n    "label": "Duration",\n    "type": "select",\n    "options": [\n      {"label": "5s", "value": "5s"}\n    ],\n    "default": "5s"\n  }\n]'
            />
            {error && (
                <div className="text-xs text-red-500">{error}</div>
            )}
            <div className="text-xs text-gray-500">
                <strong>Schema Format:</strong> Array of parameter objects. Each parameter should have:
                <ul className="list-disc list-inside ml-2 mt-1">
                    <li><code>key</code>: Parameter identifier</li>
                    <li><code>label</code>: Display label</li>
                    <li><code>type</code>: "select", "grid_select", "slider", "switch", or "text"</li>
                    <li><code>options</code>: Array of {`{label, value}`} for select types</li>
                    <li><code>default</code>: Default value (optional)</li>
                </ul>
            </div>
        </div>
    );
}


