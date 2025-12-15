"use client";

import { toast } from "sonner";
import {
    Tldraw,
    useEditor,
    type Editor,
} from "tldraw";
import "tldraw/tldraw.css";
import { AiNodeShapeUtil } from "./shapes/AiNodeShape";
import { useFlowLogic } from "@/hooks/useFlowLogic";
import LeftToolbar from "./LeftToolbar";
import TopBar from "./TopBar";
import BottomBar from "./BottomBar";
import LovartSidebar from "../copilot/LovartSidebar";
import { ImageToolbar } from "./ImageToolbar";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { projectService } from "@/services/projectService";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { useYjsStore } from "@/hooks/useYjsStore";

const customShapeUtils = [AiNodeShapeUtil];

function CanvasContent({ projectId }: { projectId?: string }) {
    useFlowLogic();
    const editor = useEditor();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Backspace' || e.key === 'Delete') && !e.repeat) {
                // Check if we are typing in an input
                const target = e.target as HTMLElement;
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
                    return;
                }

                const selectedIds = editor.getSelectedShapeIds();
                if (selectedIds.length > 0) {
                    editor.deleteShapes(selectedIds);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editor]);

    // Auto-save canvas data to Supabase
    useEffect(() => {
        if (!projectId || !editor) return;

        let saveTimeout: NodeJS.Timeout;
        let lastSaveTime = Date.now();
        const SAVE_INTERVAL = 5000; // Save 5 seconds after last change
        const MIN_SAVE_INTERVAL = 3000; // Minimum 3 seconds between saves

        const saveCanvas = async () => {
            try {
                const snapshot = editor.getSnapshot();
                const timeSinceLastSave = Date.now() - lastSaveTime;

                if (timeSinceLastSave < MIN_SAVE_INTERVAL) {
                    return; // Skip if too soon
                }

                await projectService.saveCanvasData(projectId, snapshot);
                lastSaveTime = Date.now();
                console.log('✓ Canvas saved to Supabase');
            } catch (error) {
                console.error('✗ Error saving canvas:', error);
            }
        };

        // Listen to editor changes with debounce
        const unsubscribe = editor.store.listen(() => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveCanvas();
            }, SAVE_INTERVAL);
        }, { source: 'user', scope: 'document' });

        // Save on window unload
        const handleBeforeUnload = () => {
            clearTimeout(saveTimeout);
            saveCanvas();
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Periodic save (every 30 seconds)
        const periodicSave = setInterval(() => {
            saveCanvas();
        }, 30000);

        return () => {
            unsubscribe();
            clearTimeout(saveTimeout);
            clearInterval(periodicSave);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // Final save on unmount
            saveCanvas();
        };
    }, [projectId, editor]);

    return null;
}

function LocaleSync() {
    const editor = useEditor();
    const locale = useLocale();

    useEffect(() => {
        if (editor) {
            (editor as any).user.updateUserPreferences({ locale: locale === 'zh' ? 'zh-cn' : 'en' });
        }
    }, [editor, locale]);

    return null;
}

export default function Canvas({ projectId }: { projectId?: string }) {
    const t = useTranslations('Canvas');
    const [projectName, setProjectName] = useState(t('untitled'));
    const [mounted, setMounted] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || !projectId) return;

        // Load project from Supabase
        const loadProject = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Validate projectId is a valid UUID
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                const isUuid = uuidRegex.test(projectId);

                let project = null;
                let error = null;

                if (isUuid) {
                    const maxRetries = 5; // Increased retries for connection issues
                    for (let i = 0; i < maxRetries; i++) {
                        try {
                            const result = await supabase
                                .from("projects")
                                .select("name, canvas_data")
                                .eq("id", projectId)
                                .eq("user_id", user.id)
                                .single();

                            if (result.error) throw result.error;
                            project = result.data;
                            error = null;
                            break;
                        } catch (e: any) {
                            error = e;
                            console.warn(`Attempt ${i + 1} failed to load project:`, e.message || e);

                            if (e.code === 'PGRST002') {
                                console.warn("Supabase schema cache error detected. Retrying with longer backoff...");
                                await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
                            } else {
                                if (i < maxRetries - 1) {
                                    await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, i)));
                                }
                            }
                        }
                    }
                } else {
                    console.warn("Invalid UUID format for projectId, skipping Supabase load:", projectId);
                    error = { code: 'INVALID_UUID', message: 'Invalid project ID format' };
                }

                if (error) {
                    if (error.code !== 'INVALID_UUID') {
                        console.error("Error loading project:", JSON.stringify(error, null, 2));
                        console.error("Project ID:", projectId);
                        console.error("User ID:", user.id);
                    }

                    // If project not found (PGRST116), create it
                    if (error.code === 'PGRST116') {
                        console.log("Project not found, creating new one...");
                        const newProject = await projectService.createProject(t('untitled'), projectId);
                        setProjectName(newProject.title);
                        return;
                    }

                    if ((error as any).code === 'INVALID_UUID') {
                        console.warn("Skipping DB load for invalid UUID.");
                        // Fallback to local storage or just perform no-op?
                        // If we don't load, we might show empty canvas.
                    }

                    // Fallback to localStorage
                    const project = projectService.getProject(projectId);
                    if (project) {
                        setProjectName(project.title);
                    } else {
                        const legacyName = localStorage.getItem(`project_name_${projectId}`);
                        if (legacyName) {
                            setProjectName(legacyName);
                            projectService.createProject(legacyName, projectId).catch(console.error);
                        }
                    }
                    return;
                }

                if (project) {
                    setProjectName(project.name || t('untitled'));

                    // Load canvas data if available
                    if (project.canvas_data && typeof window !== 'undefined') {
                        // Tldraw will load from persistenceKey, but we can also manually load
                        const editor = (window as any).editor;
                        if (editor && project.canvas_data) {
                            try {
                                editor.loadSnapshot(project.canvas_data);
                            } catch (e) {
                                console.error("Error loading canvas snapshot:", e);
                            }
                        }
                    }
                }
                if (error) {
                    console.error("Error in loadProject details:", error);
                    // Add toast
                    if ((error as any).code === 'PGRST002') {
                        toast.error("Database connection caching issue. Retrying...", { id: "db-error" });
                    } else if ((error as any).code !== 'PGRST116') { // Ignore not found as we create new
                        toast.error("Failed to load project data. Please check your connection.");
                    }
                }
            } catch (error) {
                console.error("Error in loadProject:", error);
                toast.error("Network error while loading project.");
            }
        };

        loadProject();
    }, [projectId, mounted, supabase, t]);

    const handleProjectNameChange = async (name: string) => {
        setProjectName(name);
        if (projectId) {
            await projectService.updateProject(projectId, { title: name });
        }
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get("agent") === "1") {
                setIsSidebarOpen(true);
            }
        }
    }, []);
    const [initialParams, setInitialParams] = useState<{ prompt?: string; image?: string }>({});

    const [initialWebSearch, setInitialWebSearch] = useState(false);
    const [initialChatModel, setInitialChatModel] = useState<string | undefined>(undefined);
    const [initialImageModel, setInitialImageModel] = useState<string | undefined>(undefined);
    const [initialVideoModel, setInitialVideoModel] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const prompt = params.get("prompt") || undefined;
            const webSearch = params.get("web_search") === "1";
            const chatModel = params.get("chat_model") || undefined;
            const imageModel = params.get("image_model") || undefined;
            const videoModel = params.get("video_model") || undefined;

            setInitialParams({
                prompt: prompt,
                image: params.get("image") || undefined
            });
            setInitialWebSearch(webSearch);
            setInitialChatModel(chatModel);
            setInitialImageModel(imageModel);
            setInitialVideoModel(videoModel);
        }
    }, []);

    const locale = useLocale();

    const [hostUrl, setHostUrl] = useState<string>("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            // For local development, connect directly to backend port 8000 to avoid Next.js proxy issues with WS
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                setHostUrl('ws://127.0.0.1:8000/api/ws');
            } else {
                // Production: Use relative path (Nginx will handle proxy)
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                setHostUrl(`${protocol}//${window.location.host}/api/ws`);
            }
        }
    }, []);

    const { store, status } = useYjsStore({
        roomId: projectId || 'demo',
        hostUrl: hostUrl || undefined,
    });

    return (
        <div className="w-screen h-screen bg-white relative overflow-hidden">
            {/* Tldraw Editor */}
            <div className="absolute inset-0">
                <ProjectProvider projectId={projectId}>
                    <Tldraw
                        store={store}
                        shapeUtils={customShapeUtils}
                        hideUi={true}
                        onMount={(editor) => {
                            // Sync initial locale
                            (editor as any).user.updateUserPreferences({ locale: locale === 'zh' ? 'zh-cn' : 'en' });
                            // Store editor reference for canvas loading
                            if (typeof window !== 'undefined') {
                                (window as any).editor = editor;
                            }
                        }}
                    >
                        <CanvasContent projectId={projectId} />
                        <LocaleSync />
                        <LeftToolbar />
                        <TopBar projectName={projectName} onProjectNameChange={handleProjectNameChange} />
                        <BottomBar />
                        <LovartSidebar
                            isOpen={isSidebarOpen}
                            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                            initialPrompt={projectId ? initialParams.prompt : undefined}
                            initialImage={projectId ? initialParams.image : undefined}
                            initialWebSearch={initialWebSearch}
                            initialChatModel={initialChatModel}
                            initialImageModel={initialImageModel}
                            initialVideoModel={initialVideoModel}
                            projectId={projectId}
                        />
                        <ImageToolbar />
                    </Tldraw>
                </ProjectProvider>
            </div>
        </div>
    );
}
