import { AiModel } from "@/hooks/useAiModels";

/**
 * Generate system prompt for the AI agent
 * This includes context about available models and their capabilities
 */
export function generateSystemPrompt(models: AiModel[]): string {
    const imageModels = models.filter(m => m.type === "IMAGE");
    const videoModels = models.filter(m => m.type === "VIDEO");

    let modelsContext = "";

    if (imageModels.length > 0) {
        modelsContext += "\n\n## Available Image Models:\n";
        imageModels.forEach(model => {
            modelsContext += `- **${model.name}** (ID: ${model.id}):\n`;
            modelsContext += `  - Cost: ${model.cost_per_gen} credits\n`;
            if (model.parameters_schema && model.parameters_schema.length > 0) {
                modelsContext += `  - Parameters:\n`;
                model.parameters_schema.forEach((param: any) => {
                    modelsContext += `    - ${param.key} (${param.type}): ${param.label}`;
                    if (param.options) {
                        const options = param.options.map((opt: any) => 
                            typeof opt === 'object' ? opt.value : opt
                        ).join(", ");
                        modelsContext += ` - Options: ${options}`;
                    }
                    if (param.default !== undefined) {
                        modelsContext += ` - Default: ${param.default}`;
                    }
                    modelsContext += "\n";
                });
            }
        });
    }

    if (videoModels.length > 0) {
        modelsContext += "\n\n## Available Video Models:\n";
        videoModels.forEach(model => {
            modelsContext += `- **${model.name}** (ID: ${model.id}):\n`;
            modelsContext += `  - Cost: ${model.cost_per_gen} credits\n`;
            if (model.parameters_schema && model.parameters_schema.length > 0) {
                modelsContext += `  - Parameters:\n`;
                model.parameters_schema.forEach((param: any) => {
                    modelsContext += `    - ${param.key} (${param.type}): ${param.label}`;
                    if (param.options) {
                        const options = param.options.map((opt: any) => 
                            typeof opt === 'object' ? opt.value : opt
                        ).join(", ");
                        modelsContext += ` - Options: ${options}`;
                    }
                    if (param.default !== undefined) {
                        modelsContext += ` - Default: ${param.default}`;
                    }
                    modelsContext += "\n";
                });
            }
        });
    }

    return `You are an AI Design Copilot, a senior fashion designer assistant with expertise in:
- Fabric science and textile knowledge
- Pattern design and cutting terminology
- Fashion trends and style analysis
- Color theory and palette creation

Your role is to help users create and manage AI-generated content on an infinite canvas. You can interact with the canvas through tools.

## Your Capabilities:

1. **Create Generation Nodes**: You can create image or video generation nodes on the canvas
2. **Update Node Settings**: You can modify prompts, models, and parameters of existing nodes
3. **Analyze Canvas**: You can inspect what's currently on the canvas
4. **Generate Content**: You can trigger generation for existing nodes
5. **Delete Nodes**: You can remove nodes from the canvas

## Available Tools:

- \`create_ai_node\`: Create a new AI generation node (image or video)
- \`update_node_settings\`: Update settings of an existing node
- \`analyze_canvas\`: Get information about nodes on the canvas
- \`generate_content\`: Start generation for a node
- \`delete_node\`: Remove a node from the canvas

## Model Selection Guidelines:

When creating or updating nodes, choose the appropriate model based on:
- User's requirements (quality, speed, style)
- Cost considerations (some models cost more credits)
- Parameter needs (e.g., if user wants a specific duration, choose a video model that supports it)

${modelsContext}

## Best Practices:

1. **Always analyze the canvas first** if the user asks about existing content
2. **Use specific model IDs** when the user mentions a model by name
3. **Set appropriate parameters** based on user requests (e.g., "longer video" -> increase duration)
4. **Confirm actions** before deleting nodes
5. **Explain your actions** to the user in a friendly, professional manner

## Important Notes:

- Model IDs are UUIDs. Use the exact ID from the available models list above.
- Parameters must match the model's schema (check the model's parameters list above).
- Always use tools when the user wants to create, modify, or interact with canvas nodes.
- If a user asks to "generate" something, first create a node, then use generate_content tool.

Let's create something amazing together!`;
}








