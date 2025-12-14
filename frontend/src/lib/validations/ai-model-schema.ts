import { z } from "zod";

/**
 * Zod schema for validating AI model parameter schema
 * This ensures the parameters_schema JSON matches our frontend expectations
 */

// Schema for a single parameter option (for select/grid_select)
const parameterOptionSchema = z.object({
    label: z.string(),
    value: z.union([z.string(), z.number()]),
    desc: z.string().optional(),
});

// Schema for a single parameter definition
const parameterSchema = z.object({
    key: z.string().min(1, "Key is required"),
    label: z.string().min(1, "Label is required"),
    type: z.enum(["select", "grid_select", "slider", "switch", "text"], {
        errorMap: () => ({ message: "Type must be: select, grid_select, slider, switch, or text" }),
    }),
    // Options are required for select and grid_select
    options: z.array(parameterOptionSchema).optional(),
    // Default value (type depends on parameter type)
    default: z.union([z.string(), z.number(), z.boolean()]).optional(),
    // For slider type
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
    // For text type
    placeholder: z.string().optional(),
    maxLength: z.number().optional(),
}).refine(
    (data) => {
        // If type is select or grid_select, options must be provided
        if ((data.type === "select" || data.type === "grid_select") && (!data.options || data.options.length === 0)) {
            return false;
        }
        return true;
    },
    {
        message: "Options are required for select and grid_select types",
        path: ["options"],
    }
).refine(
    (data) => {
        // If type is slider, min and max should be provided
        if (data.type === "slider" && (data.min === undefined || data.max === undefined)) {
            return false;
        }
        return true;
    },
    {
        message: "Min and max are required for slider type",
        path: ["min"],
    }
);

// Schema for the entire parameters_schema array
export const parametersSchemaArray = z.array(parameterSchema);

// Schema for validating the full AI model form
export const aiModelFormSchema = z.object({
    name: z.string().min(1, "Model name is required"),
    type: z.enum(["IMAGE", "VIDEO"]),
    provider: z.enum(["REPLICATE", "FAL", "CUSTOM"]),
    api_path: z.string().min(1, "API path is required"),
    cost_per_gen: z.number().int().min(0, "Cost must be a non-negative integer"),
    is_active: z.boolean(),
    description: z.string().optional(),
    parameters_schema: parametersSchemaArray,
});

export type AiModelFormData = z.infer<typeof aiModelFormSchema>;
export type ParameterSchema = z.infer<typeof parameterSchema>;
export type ParameterOption = z.infer<typeof parameterOptionSchema>;

/**
 * Validate a JSON string as a parameters schema
 * @param jsonString - The JSON string to validate
 * @returns Validation result with parsed data or error
 */
export function validateParametersSchema(jsonString: string): {
    success: boolean;
    data?: ParameterSchema[];
    error?: string;
} {
    try {
        const parsed = JSON.parse(jsonString);
        const result = parametersSchemaArray.safeParse(parsed);
        
        if (result.success) {
            return { success: true, data: result.data };
        } else {
            const firstError = result.error.errors[0];
            return {
                success: false,
                error: `${firstError.path.join(".")}: ${firstError.message}`,
            };
        }
    } catch (e) {
        return {
            success: false,
            error: "Invalid JSON format",
        };
    }
}

