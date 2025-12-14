import { useEditor, TLShapeId } from "tldraw";
import { useEffect, useRef } from "react";
import { IAiNodeShape } from "@/components/canvas/shapes/AiNodeShape";

/**
 * Hook to handle flow logic and shape migrations
 */
export function useFlowLogic() {
    const editor = useEditor();
    const migrationDone = useRef(false);

    useEffect(() => {
        if (!editor || migrationDone.current) return;

        // Migrate old ai-node shapes that don't have new fields
        const migrateOldNodes = () => {
            try {
                const shapes = editor.getCurrentPageShapes();
                const aiNodes = shapes.filter(
                    (shape): shape is IAiNodeShape => shape.type === "ai-node"
                );

                let needsUpdate = false;
                const shapeUpdates: Array<{ id: string; props: Partial<IAiNodeShape["props"]> }> = [];

                for (const node of aiNodes) {
                    const props = node.props;
                    const nodeUpdates: Partial<IAiNodeShape["props"]> = {};

                    // Check if modelId is missing
                    if (!props.modelId && props.model) {
                        nodeUpdates.modelId = props.model; // Use legacy model as fallback
                        needsUpdate = true;
                    } else if (!props.modelId) {
                        nodeUpdates.modelId = "";
                        needsUpdate = true;
                    }

                    // Check if parameters is missing or invalid
                    if (!props.parameters || typeof props.parameters !== 'object') {
                        nodeUpdates.parameters = {};
                        needsUpdate = true;
                    }

                    // Check if references is missing or invalid
                    if (!Array.isArray(props.references)) {
                        nodeUpdates.references = [];
                        needsUpdate = true;
                    }

                    // Check if mode is missing
                    if (!props.mode) {
                        nodeUpdates.mode = "first_last_frame";
                        needsUpdate = true;
                    }

                    if (Object.keys(nodeUpdates).length > 0) {
                        shapeUpdates.push({ id: node.id, props: nodeUpdates });
                    }
                }

                if (needsUpdate && shapeUpdates.length > 0) {
                    const updateShapes = () => {
                        for (const update of shapeUpdates) {
                            editor.updateShape({
                                id: update.id as TLShapeId,
                                type: "ai-node",
                                props: {
                                    ...editor.getShape(update.id as TLShapeId)?.props,
                                    ...update.props,
                                },
                            });
                        }
                    };

                    if (typeof (editor as any).batch === 'function') {
                        (editor as any).batch(updateShapes);
                    } else {
                        console.warn('editor.batch is not a function, running updates directly');
                        updateShapes();
                    }
                    console.log(`✅ Migrated ${shapeUpdates.length} old ai-node shapes`);
                    migrationDone.current = true;
                }
            } catch (error) {
                console.error("Error migrating old nodes:", error);
            }
        };

        // Run migration after a short delay to ensure editor is fully initialized
        const timeout = setTimeout(migrateOldNodes, 100);

        // Also listen for shape changes to catch any shapes loaded later
        const unsubscribe = editor.store.listen(
            () => {
                if (!migrationDone.current) {
                    migrateOldNodes();
                }
            },
            { source: "user", scope: "document" }
        );

        return () => {
            clearTimeout(timeout);
            unsubscribe();
        };
    }, [editor]);

    return null;
}
