"use client";

import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { validateParametersSchema } from "@/lib/validations/ai-model-schema";
import { cn } from "@/lib/utils";

interface MonacoJsonEditorProps {
    value: string;
    onChange: (value: string) => void;
    height?: string;
    className?: string;
    onValidationChange?: (isValid: boolean, error?: string) => void;
}

export function MonacoJsonEditor({
    value,
    onChange,
    height = "400px",
    className,
    onValidationChange,
}: MonacoJsonEditorProps) {
    const editorRef = useRef<any>(null);

    useEffect(() => {
        // Validate on mount and when value changes
        const validation = validateParametersSchema(value);
        onValidationChange?.(validation.success, validation.error);
    }, [value, onValidationChange]);

    const handleEditorChange = (newValue: string | undefined) => {
        if (newValue !== undefined) {
            onChange(newValue);
            
            // Validate and notify parent
            const validation = validateParametersSchema(newValue);
            onValidationChange?.(validation.success, validation.error);
        }
    };

    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor;
        
        // Configure JSON schema validation
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            schemas: [
                {
                    uri: "http://myserver/foo-schema.json",
                    fileMatch: ["*"],
                    schema: {
                        type: "array",
                        items: {
                            type: "object",
                            required: ["key", "label", "type"],
                            properties: {
                                key: { type: "string" },
                                label: { type: "string" },
                                type: {
                                    type: "string",
                                    enum: ["select", "grid_select", "slider", "switch", "text"],
                                },
                                options: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            label: { type: "string" },
                                            value: { type: ["string", "number"] },
                                            desc: { type: "string" },
                                        },
                                    },
                                },
                                default: { type: ["string", "number", "boolean"] },
                                min: { type: "number" },
                                max: { type: "number" },
                                step: { type: "number" },
                                placeholder: { type: "string" },
                                maxLength: { type: "number" },
                            },
                        },
                    },
                },
            ],
        });
    };

    const formatJson = () => {
        if (editorRef.current) {
            editorRef.current.getAction("editor.action.formatDocument").run();
        }
    };

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">
                    Parameters Schema (JSON)
                </label>
                <button
                    type="button"
                    onClick={formatJson}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                >
                    Format JSON
                </button>
            </div>
            <div className="border border-gray-300 rounded-md overflow-hidden">
                <Editor
                    height={height}
                    defaultLanguage="json"
                    value={value}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    theme="vs-light"
                    options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 13,
                        lineNumbers: "on",
                        folding: true,
                        wordWrap: "on",
                        formatOnPaste: true,
                        formatOnType: true,
                        tabSize: 2,
                        automaticLayout: true,
                    }}
                />
            </div>
            <div className="text-xs text-gray-500">
                <strong>Schema Format:</strong> Array of parameter objects. Each parameter should have:
                <ul className="list-disc list-inside ml-2 mt-1">
                    <li><code>key</code>: Parameter identifier (required)</li>
                    <li><code>label</code>: Display label (required)</li>
                    <li><code>type</code>: "select", "grid_select", "slider", "switch", or "text" (required)</li>
                    <li><code>options</code>: Array of {`{label, value, desc?}`} for select types</li>
                    <li><code>default</code>: Default value (optional)</li>
                    <li><code>min/max/step</code>: For slider type</li>
                </ul>
            </div>
        </div>
    );
}

