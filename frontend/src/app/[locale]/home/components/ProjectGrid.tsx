"use client";

import { useRouter, usePathname } from "next/navigation";
import { Plus, MoreHorizontal, Play, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { createClient } from "@/utils/supabase/client";
import { useLocale } from "next-intl";

interface Project {
    id: string;
    name: string;
    thumbnail_url?: string | null;
    canvas_data?: any;
    updated_at: string;
    created_at: string;
    mediaUrl?: string | null;
    mediaType?: 'image' | 'video' | null;
}

export default function ProjectGrid() {
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const [projects, setProjects] = useState<Project[]>([]);
    const supabase = createClient();
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: "start",
        containScroll: "trimSnaps",
        dragFree: true
    });

    const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
    const scrollNext = () => emblaApi && emblaApi.scrollNext();

    useEffect(() => {
        const fetchProjects = async () => {
            console.log("--- ProjectGrid Debug Start (API Mode) ---");
            const { data: { user } } = await supabase.auth.getUser();
            console.log("Current Auth User:", user?.id, user?.email);

            if (!user) {
                console.log("No user found, aborting fetch.");
                return;
            }

            try {
                console.log("Fetching via API: /api/projects?user_id=" + user.id);
                const res = await fetch(`/api/projects?user_id=${user.id}`);

                if (!res.ok) {
                    console.error("API Error:", res.status, res.statusText);
                    const text = await res.text();
                    console.error("API Response:", text);
                    return;
                }

                const data = await res.json();
                console.log("API Data received:", data);

                if (data) {
                    // Map API response to component state
                    const mappedProjects = data.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        thumbnail_url: p.thumbnail_url,
                        updated_at: p.updated_at,
                        media_type: p.media_type,
                        mediaUrl: p.thumbnail_url,
                        mediaType: p.media_type
                    }));
                    setProjects(mappedProjects);
                }
            } catch (error) {
                console.error("Error fetching projects:", error);
            }
        };

        fetchProjects();
    }, [supabase]);

    const handleNewProject = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push(`/${pathname.includes('/zh') ? 'zh' : 'en'}/login`);
            return;
        }

        // Create new project in database
        const { data: newProject, error } = await supabase
            .from("projects")
            .insert({
                user_id: user.id,
                name: "Untitled Project",
                canvas_data: {}
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating project:", error);
            return;
        }

        if (newProject) {
            router.push(`/${locale}/flow/${newProject.id}?agent=1`);
        }
    };

    return (
        <div className="relative group/carousel">
            <div className="overflow-hidden -mx-4 px-4 py-4" ref={emblaRef}>
                <div className="flex gap-6">
                    {/* 1. New Project Card */}
                    <div className="flex-[0_0_25%] min-w-[240px] pl-0">
                        <div
                            onClick={handleNewProject}
                            className="aspect-[3/4] bg-gray-50 border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-all group h-full"
                        >
                            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Plus className="w-6 h-6 text-gray-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">新建项目</span>
                        </div>
                    </div>

                    {/* 2. Project Cards */}
                    {projects.map((project) => {
                        const mediaUrl = project.mediaUrl || project.thumbnail_url;
                        const isVideo = project.mediaType === 'video';

                        return (
                            <div key={project.id} className="flex-[0_0_25%] min-w-[240px]">
                                <div
                                    className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all bg-gray-100"
                                    onClick={() => router.push(`/${locale}/flow/${project.id}?agent=1`)}
                                >
                                    {/* Media Content */}
                                    {mediaUrl ? (
                                        <>
                                            {isVideo ? (
                                                <video
                                                    src={mediaUrl}
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
                                                    src={mediaUrl}
                                                    alt={project.name}
                                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            )}
                                            {/* Play icon overlay for videos */}
                                            {isVideo && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400">
                                            {isVideo ? <Play className="w-12 h-12 fill-current" /> : <ImageIcon className="w-12 h-12" />}
                                        </div>
                                    )}

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                    {/* Content */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <h3 className="text-white font-medium text-sm truncate">{project.name}</h3>
                                        {/* Suppress hydration warning for date mismatch, and use client-side only rendering pattern if needed */}
                                        <p className="text-white/60 text-xs mt-1" suppressHydrationWarning>
                                            {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale: zhCN })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* 3. More Card */}
                    <div className="flex-[0_0_25%] min-w-[240px] pr-6">
                        <div
                            onClick={() => router.push(`/${locale}/projects`)}
                            className="aspect-[3/4] bg-gray-50 border border-gray-100 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all group h-full"
                        >
                            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <MoreHorizontal className="w-6 h-6 text-gray-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">查看更多</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Buttons */}
            <button
                onClick={scrollPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-gray-50 z-10 disabled:opacity-0"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button
                onClick={scrollNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-gray-50 z-10 disabled:opacity-0"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    );
}
