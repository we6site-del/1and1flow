import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/utils/supabase/client';

export interface Project {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    thumbnail?: string;
    type: 'image' | 'video';
}

const STORAGE_KEY = 'lovart_user_projects';

export const projectService = {
    getAllProjects: (): Project[] => {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    getProject: (id: string): Project | undefined => {
        const projects = projectService.getAllProjects();
        return projects.find(p => p.id === id);
    },

    createProject: async (title: string = "未命名项目", id?: string): Promise<Project> => {
        const projects = projectService.getAllProjects();
        const newProject: Project = {
            id: id || uuidv4(),
            title,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            type: 'image', // Default
            thumbnail: `bg-gradient-to-br from-blue-500 to-purple-600` // Default placeholder
        };

        // Add to beginning of list
        localStorage.setItem(STORAGE_KEY, JSON.stringify([newProject, ...projects]));

        // Save to Supabase if user is authenticated
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from("projects")
                    .upsert({
                        id: newProject.id,
                        user_id: user.id,
                        name: title,
                        canvas_data: {},
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'id'
                    });
            }
        } catch (error) {
            console.error("Error saving project to Supabase:", error);
        }

        return newProject;
    },

    updateProject: async (id: string, updates: Partial<Project>) => {
        const projects = projectService.getAllProjects();
        const index = projects.findIndex(p => p.id === id);
        if (index !== -1) {
            projects[index] = {
                ...projects[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        }

        // Save to Supabase if user is authenticated
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const updateData: any = {
                    id: id,
                    user_id: user.id,
                    updated_at: new Date().toISOString()
                };

                // Map title to name for Supabase
                if (updates.title !== undefined) {
                    updateData.name = updates.title;
                }

                // Map other fields if needed
                if (updates.thumbnail !== undefined) {
                    updateData.thumbnail_url = updates.thumbnail;
                }

                await supabase
                    .from("projects")
                    .upsert(updateData, { onConflict: 'id' });
            }
        } catch (error) {
            console.error("Error updating project in Supabase:", error);
        }
    },

    saveCanvasData: async (id: string, canvasData: any) => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from("projects")
                    .upsert({
                        id: id,
                        user_id: user.id,
                        canvas_data: canvasData,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'id' });
            }
        } catch (error) {
            console.error("Error saving canvas data to Supabase:", error);
        }
    },

    deleteProject: async (id: string) => {
        const projects = projectService.getAllProjects();
        const filtered = projects.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

        // Delete from Supabase if user is authenticated
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from("projects")
                    .delete()
                    .eq("id", id)
                    .eq("user_id", user.id);
            }
        } catch (error) {
            console.error("Error deleting project from Supabase:", error);
        }
    }
};
