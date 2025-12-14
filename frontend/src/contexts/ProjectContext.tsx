"use client";

import { createContext, useContext } from "react";

interface ProjectContextType {
    projectId: string | undefined;
}

const ProjectContext = createContext<ProjectContextType>({ projectId: undefined });

export const useProject = () => useContext(ProjectContext);

export const ProjectProvider = ({ children, projectId }: { children: React.ReactNode; projectId?: string }) => {
    return (
        <ProjectContext.Provider value={{ projectId }}>
            {children}
        </ProjectContext.Provider>
    );
};
