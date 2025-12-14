import { z } from "zod";
import { Editor } from "tldraw";
import { IAiNodeShape } from "@/components/canvas/shapes/AiNodeShape";

/**
 * Agent Tools Definitions
 * These tools allow the AI agent to interact with the canvas
 */

// Tool: Create AI Node
export const createAiNodeTool = {
    name: "create_ai_node",
    description: "Create a new AI generation node (image or video) on the canvas. Use this when the user wants to generate new content.",
    parameters: z.object({
        type: z.enum(["image", "video"]).describe("The type of generation node to create"),
        prompt: z.string().describe("The generation prompt for the AI model"),
        model_id: z.string().optional().describe("Optional: Specific model ID to use. If not provided, will use default model"),
        parameters: z.record(z.any()).optional().describe("Optional: Model-specific parameters (e.g., aspect_ratio, duration)"),
        x: z.number().optional().describe("Optional: X position on canvas. If not provided, will place at viewport center"),
        y: z.number().optional().describe("Optional: Y position on canvas. If not provided, will place at viewport center"),
    }),
    execute: async (editor: Editor, args: {
        type: "image" | "video";
        prompt: string;
        model_id?: string;
        parameters?: Record<string, any>;
        x?: number;
        y?: number;
    }) => {
        const viewportBounds = editor.getViewportPageBounds();
        const x = args.x ?? viewportBounds.center.x - 200;
        const y = args.y ?? viewportBounds.center.y - (args.type === "image" ? 225 : 250);

        editor.createShapes([
            {
                type: "ai-node",
                x,
                y,
                props: {
                    nodeType: args.type,
                    w: 400,
                    h: args.type === "image" ? 450 : 500,
                    prompt: args.prompt,
                    imageUrl: "",
                    videoUrl: "",
                    modelId: args.model_id || "",
                    model: args.type === "image" ? "flux-pro" : "kling-pro", // Legacy fallback
                    parameters: args.parameters || {},
                    aspectRatio: args.parameters?.aspect_ratio || (args.type === "image" ? "3:4" : "16:9"),
                    duration: args.parameters?.duration || (args.type === "video" ? "5s" : undefined),
                    status: "idle",
                    references: [],
                    mode: args.type === "video" ? "first_last_frame" : undefined,
                },
            },
        ]);

        return `Successfully created ${args.type} generation node with prompt: "${args.prompt}"`;
    },
};

// Tool: Update Node Settings
export const updateNodeSettingsTool = {
    name: "update_node_settings",
    description: "Update the settings (model, parameters, prompt) of an existing AI generation node on the canvas. Use this when the user wants to modify an existing node.",
    parameters: z.object({
        node_id: z.string().describe("The ID of the node to update (you can get this from analyze_canvas)"),
        prompt: z.string().optional().describe("Optional: New prompt for the node"),
        model_id: z.string().optional().describe("Optional: New model ID to use"),
        parameters: z.record(z.any()).optional().describe("Optional: Updated parameters (e.g., aspect_ratio, duration, guidance_scale)"),
    }),
    execute: async (editor: Editor, args: {
        node_id: string;
        prompt?: string;
        model_id?: string;
        parameters?: Record<string, any>;
    }) => {
        const shape = editor.getShape(args.node_id as any);
        if (!shape || shape.type !== "ai-node") {
            return `Error: Node with ID ${args.node_id} not found or is not an AI node`;
        }

        const currentProps = (shape as IAiNodeShape).props;
        const updates: Partial<IAiNodeShape["props"]> = {};

        if (args.prompt !== undefined) {
            updates.prompt = args.prompt;
        }
        if (args.model_id !== undefined) {
            updates.modelId = args.model_id;
        }
        if (args.parameters !== undefined) {
            // Merge with existing parameters
            updates.parameters = {
                ...currentProps.parameters,
                ...args.parameters,
            };
        }

        editor.updateShape({
            id: args.node_id as any,
            type: "ai-node",
            props: {
                ...currentProps,
                ...updates,
            },
        });

        return `Successfully updated node ${args.node_id}`;
    },
};

// Tool: Analyze Canvas
export const analyzeCanvasTool = {
    name: "analyze_canvas",
    description: "Analyze the current canvas state. Returns information about all AI nodes on the canvas, including their prompts, models, and status. Use this to understand what's on the canvas before making changes.",
    parameters: z.object({
        include_selected: z.boolean().optional().describe("If true, only analyze selected nodes. If false or not provided, analyze all nodes"),
    }),
    execute: async (editor: Editor, args: { include_selected?: boolean }) => {
        const shapes = editor.getCurrentPageShapes();
        let aiNodes = shapes.filter((s) => s.type === "ai-node") as IAiNodeShape[];

        if (args.include_selected) {
            const selectedIds = editor.getSelectedShapeIds();
            aiNodes = aiNodes.filter((node) => selectedIds.includes(node.id));
        }

        if (aiNodes.length === 0) {
            return "No AI nodes found on the canvas.";
        }

        const analysis = aiNodes.map((node) => {
            const props = node.props;
            return {
                id: node.id,
                nodeType: props.nodeType,
                prompt: props.prompt,
                model_id: props.modelId || props.model || "default",
                status: props.status,
                has_result: !!(props.imageUrl || props.videoUrl),
                parameters: props.parameters || {},
                position: { x: node.x, y: node.y },
            };
        });

        return `Found ${aiNodes.length} AI node(s) on canvas:\n${JSON.stringify(analysis, null, 2)}`;
    },
};

// Tool: Generate Content
export const generateContentTool = {
    name: "generate_content",
    description: "Trigger generation for an existing AI node. Use this when the user wants to start generating content for a node that already exists on the canvas.",
    parameters: z.object({
        node_id: z.string().describe("The ID of the node to generate content for"),
    }),
    execute: async (editor: Editor, args: { node_id: string }) => {
        const shape = editor.getShape(args.node_id as any);
        if (!shape || shape.type !== "ai-node") {
            return `Error: Node with ID ${args.node_id} not found or is not an AI node`;
        }

        const props = (shape as IAiNodeShape).props;

        // Check if node has a prompt
        if (!props.prompt) {
            return `Error: Node ${args.node_id} does not have a prompt. Please set a prompt first using update_node_settings.`;
        }

        // Check if node has a model
        if (!props.modelId && !props.model) {
            return `Error: Node ${args.node_id} does not have a model selected. Please select a model first using update_node_settings.`;
        }

        // Simulate clicking the generate button
        // In a real implementation, we would trigger the node's generate handler
        // For now, we'll just update the status to indicate generation should start
        editor.updateShape({
            id: args.node_id as any,
            type: "ai-node",
            props: {
                ...props,
                status: "generating",
            },
        });

        // Note: Actual generation is handled by the node's handleGenerate function
        // which calls the backend API. This tool just triggers the UI state change.
        return `Generation started for node ${args.node_id}. The node will generate content using model ${props.modelId || props.model} with prompt: "${props.prompt}"`;
    },
};

// Tool: Delete Node
export const deleteNodeTool = {
    name: "delete_node",
    description: "Delete an AI node from the canvas. Use this when the user wants to remove a node.",
    parameters: z.object({
        node_id: z.string().describe("The ID of the node to delete"),
    }),
    execute: async (editor: Editor, args: { node_id: string }) => {
        const shape = editor.getShape(args.node_id as any);
        if (!shape || shape.type !== "ai-node") {
            return `Error: Node with ID ${args.node_id} not found or is not an AI node`;
        }

        editor.deleteShape(args.node_id as any);
        return `Successfully deleted node ${args.node_id}`;
    },
};

// Tool: Generate Fabric
export const generateFabricTool = {
    name: "generate_fabric",
    description: "Generate fabric textures based on a description.",
    parameters: z.object({
        prompt: z.string().describe("Description of the fabric texture"),
    }),
    execute: async (editor: Editor, args: { prompt: string }) => {
        const viewportBounds = editor.getViewportPageBounds();
        const x = viewportBounds.center.x - 200;
        const y = viewportBounds.center.y - 225;

        editor.createShapes([
            {
                type: "ai-node",
                x,
                y,
                props: {
                    nodeType: "image",
                    w: 400,
                    h: 450,
                    prompt: `Seamless fabric texture, ${args.prompt}, high quality, textile pattern, 8k resolution`,
                    imageUrl: "",
                    videoUrl: "",
                    model: "flux-pro",
                    parameters: {
                        aspect_ratio: "1:1"
                    },
                    aspectRatio: "1:1",
                    status: "idle",
                    references: [],
                },
            },
        ]);

        return `Created a fabric generation node for "${args.prompt}". Click 'Generate' on the node to create the texture.`;
    },
};

// Tool: Generate Palette
export const generatePaletteTool = {
    name: "generate_palette",
    description: "Generate a color palette based on a description.",
    parameters: z.object({
        prompt: z.string().describe("Description of the mood or theme"),
    }),
    execute: async (editor: Editor, args: { prompt: string }) => {
        const viewportBounds = editor.getViewportPageBounds();
        const x = viewportBounds.center.x - 200;
        const y = viewportBounds.center.y - 225;

        editor.createShapes([
            {
                type: "ai-node",
                x,
                y,
                props: {
                    nodeType: "image",
                    w: 400,
                    h: 450,
                    prompt: `A beautiful color palette for ${args.prompt}, minimalist design, color swatches, hex codes, aesthetic layout`,
                    imageUrl: "",
                    videoUrl: "",
                    model: "flux-pro",
                    parameters: {
                        aspect_ratio: "16:9"
                    },
                    aspectRatio: "16:9",
                    status: "idle",
                    references: [],
                },
            },
        ]);

        return `Created a color palette generation node for "${args.prompt}". Click 'Generate' on the node to see the palette.`;
    },
};

// Export all tools
export const agentTools = {
    create_ai_node: createAiNodeTool,
    update_node_settings: updateNodeSettingsTool,
    analyze_canvas: analyzeCanvasTool,
    generate_content: generateContentTool,
    delete_node: deleteNodeTool,
    generate_fabric: generateFabricTool,
    generate_palette: generatePaletteTool,
};

// Tool definitions for Vercel AI SDK
export const toolDefinitions = [
    {
        type: "function" as const,
        function: {
            name: "create_ai_node",
            description: createAiNodeTool.description,
            parameters: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        enum: ["image", "video"],
                        description: "The type of generation node to create",
                    },
                    prompt: {
                        type: "string",
                        description: "The generation prompt for the AI model",
                    },
                    model_id: {
                        type: "string",
                        description: "Optional: Specific model ID to use",
                    },
                    parameters: {
                        type: "object",
                        description: "Optional: Model-specific parameters",
                    },
                    x: {
                        type: "number",
                        description: "Optional: X position on canvas",
                    },
                    y: {
                        type: "number",
                        description: "Optional: Y position on canvas",
                    },
                },
                required: ["type", "prompt"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "update_node_settings",
            description: updateNodeSettingsTool.description,
            parameters: {
                type: "object",
                properties: {
                    node_id: {
                        type: "string",
                        description: "The ID of the node to update",
                    },
                    prompt: {
                        type: "string",
                        description: "Optional: New prompt for the node",
                    },
                    model_id: {
                        type: "string",
                        description: "Optional: New model ID to use",
                    },
                    parameters: {
                        type: "object",
                        description: "Optional: Updated parameters",
                    },
                },
                required: ["node_id"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "analyze_canvas",
            description: analyzeCanvasTool.description,
            parameters: {
                type: "object",
                properties: {
                    include_selected: {
                        type: "boolean",
                        description: "If true, only analyze selected nodes",
                    },
                },
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "generate_content",
            description: generateContentTool.description,
            parameters: {
                type: "object",
                properties: {
                    node_id: {
                        type: "string",
                        description: "The ID of the node to generate content for",
                    },
                },
                required: ["node_id"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "delete_node",
            description: deleteNodeTool.description,
            parameters: {
                type: "object",
                properties: {
                    node_id: {
                        type: "string",
                        description: "The ID of the node to delete",
                    },
                },
                required: ["node_id"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "generate_fabric",
            description: generateFabricTool.description,
            parameters: {
                type: "object",
                properties: {
                    prompt: {
                        type: "string",
                        description: "Description of the fabric texture",
                    },
                },
                required: ["prompt"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "generate_palette",
            description: generatePaletteTool.description,
            parameters: {
                type: "object",
                properties: {
                    prompt: {
                        type: "string",
                        description: "Description of the mood or theme",
                    },
                },
                required: ["prompt"],
            },
        },
    },
];

