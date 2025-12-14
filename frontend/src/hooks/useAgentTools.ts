import { useEditor } from "tldraw";
import { useEffect } from "react";

export function useAgentTools(toolInvocations: any[]) {
    const editor = useEditor();

    useEffect(() => {
        if (!toolInvocations || toolInvocations.length === 0) return;

        const latestTool = toolInvocations[toolInvocations.length - 1];

        if (latestTool.state === 'result') return; // Already executed

        if (latestTool.toolName === "create_variation_nodes") {
            // Note: In a real app, we would check if this specific invocation ID was already handled.
            // For this simple implementation, we rely on the fact that 'ai/react' handles state.
            // However, to actually execute side effects in tldraw, we need to be careful not to duplicate.
            // A better pattern is to use the `onToolCall` callback in `useChat`, but let's try to react to the stream first.
            // Actually, the best way with `useChat` is to use the `onToolCall` prop if available, or just watch `toolInvocations`.
            // But `toolInvocations` updates as the tool is being called. We only want to act when it's DONE (but before result is sent back?).
            // Wait, `streamText` executes tools on the SERVER if `maxSteps` > 1.
            // If we want CLIENT side execution, we should use `client-side tools` or just parse the output.
            // BUT, Vercel AI SDK 3.3+ supports client-side tools via `useChat({ maxSteps: 5 })` if we define them?
            // Actually, for client-side UI manipulation, it's often easier to let the server decide "I want to call tool X" and send that to client.
            // The `toolInvocations` in `useChat` contains the tool calls.
        }
    }, [toolInvocations, editor]);
}

// Revised approach: We will pass a `onToolCall` handler to `useChat` in Sidebar.tsx
// This file will export the handler function.

export const createVariationNodes = (editor: any, args: { count: number, variations: string[] }) => {
    const { x, y } = editor.getViewportPageBounds().center;

    args.variations.forEach((prompt, index) => {
        editor.createShape({
            type: "ai-node",
            x: x + (index * 320) - ((args.count * 320) / 2),
            y: y,
            props: {
                w: 300,
                h: 400,
                prompt: prompt,
            },
        });
    });

    return "Nodes created successfully.";
};
