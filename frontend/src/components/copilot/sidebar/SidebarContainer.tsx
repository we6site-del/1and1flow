
import { cn } from "@/lib/utils";
import { stopEventPropagation } from "tldraw";

interface SidebarContainerProps {
    isOpen: boolean;
    children: React.ReactNode;
}

export function SidebarContainer({ isOpen, children }: SidebarContainerProps) {
    return (
        <div
            className={cn(
                "fixed top-4 right-4 bottom-4 w-[420px] bg-white/95 backdrop-blur-xl rounded-[32px] shadow-[-10px_0_60px_rgba(0,0,0,0.08)] z-[2000] flex flex-col font-sans transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] border border-white/50 ring-1 ring-black/5 overflow-hidden",
                isOpen ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0 pointer-events-none"
            )}
            onPointerDown={stopEventPropagation}
        >
            {children}
        </div>
    );
}
