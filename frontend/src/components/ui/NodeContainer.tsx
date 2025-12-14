import React from "react";
import { cn } from "@/lib/utils";

interface NodeContainerProps {
    title: string;
    width?: number;
    selected?: boolean;
    children: React.ReactNode;
    className?: string;
    headerRight?: React.ReactNode;
}

export function NodeContainer({
    title,
    width = 300,
    selected = false,
    children,
    className,
    headerRight
}: NodeContainerProps) {
    return (
        <div
            className={cn(
                "bg-white rounded-xl shadow-sm border transition-all duration-200 flex flex-col overflow-hidden",
                selected ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md" : "border-gray-200 hover:border-gray-300",
                className
            )}
            style={{ width }}
        >
            {/* Header */}
            <div className="h-10 px-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-800">{title}</span>
                </div>
                {headerRight && <div className="flex items-center">{headerRight}</div>}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col relative">
                {children}
            </div>
        </div>
    );
}
