"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useLocale } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Plus, Image as ImageIcon, Trash2 } from "lucide-react";
import Header from "../home/components/Header";
import { useToast } from "@/hooks/use-toast";

interface Project {
    id: string;
    name: string;
    thumbnail_url?: string | null;
    updated_at: string;
    media_type?: 'image' | 'video' | null;
}

export default function ProjectsPage() {
    const router = useRouter();
    const locale = useLocale();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchProjects = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push(`/${locale}/login`);
                return;
            }

            try {
                const res = await fetch(`/api/projects?user_id=${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setProjects(data);
                }
            } catch (error) {
                console.error("Failed to fetch projects", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [supabase, locale, router]);

    const handleNewProject = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: newProject, error } = await supabase
            .from("projects")
            .insert({
                user_id: user.id,
                name: "Untitled Project",
                canvas_data: {}
            })
            .select()
            .single();

        if (newProject) {
            router.push(`/${locale}/flow/${newProject.id}?agent=1`);
        }
    };

    const { toast } = useToast();

    const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation(); // Prevent navigation

        if (!window.confirm("Are you sure you want to delete this project?")) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast({
                title: "Error",
                description: "You must be logged in to delete a project.",
                variant: "destructive",
            });
            return;
        }

        try {
            const res = await fetch(`/api/projects/${projectId}?user_id=${user.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setProjects(prev => prev.filter(p => p.id !== projectId));
                toast({
                    title: "Success",
                    description: "Project deleted successfully.",
                });
            } else {
                const text = await res.text();
                console.error("Failed to delete project:", text);
                toast({
                    title: "Failed to delete",
                    description: "Could not delete project. Please try again.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error deleting project:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive",
            });
        }
    };

    return (
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">项目库</h1>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {/* New Project Card */}
                    <div
                        onClick={handleNewProject}
                        className="aspect-[3/4] bg-gray-50 border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-all group"
                    >
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Plus className="w-6 h-6 text-gray-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-600">新建项目</span>
                    </div>

                    {/* Project Cards */}
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all bg-gray-100"
                            onClick={() => router.push(`/${locale}/flow/${project.id}?agent=1`)}
                        >
                            {project.thumbnail_url ? (
                                <>
                                    {project.media_type === 'video' ? (
                                        <video
                                            src={project.thumbnail_url}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            muted
                                            loop
                                            playsInline
                                            onMouseEnter={(e) => e.currentTarget.play()}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.pause();
                                                e.currentTarget.currentTime = 0;
                                            }}
                                        />
                                    ) : (
                                        <img
                                            src={project.thumbnail_url}
                                            alt={project.name}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    )}
                                </>
                            ) : (
                                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400">
                                    <ImageIcon className="w-12 h-12" />
                                </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Delete Button */}
                            <button
                                onClick={(e) => handleDeleteProject(e, project.id)}
                                className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 z-10"
                                title="Delete Project"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                <h3 className="text-white font-medium text-sm truncate">{project.name}</h3>
                                <p className="text-white/60 text-xs mt-1" suppressHydrationWarning>
                                    {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale: zhCN })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
