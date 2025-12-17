"use client";

import dynamic from "next/dynamic";

const Canvas = dynamic(() => import("./Canvas"), { ssr: false });

import React from "react";

class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("CanvasWrapper Error Boundary Caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center w-screen h-screen bg-red-50 p-10 flex-col gap-4 z-[9999] relative">
                    <h2 className="text-xl font-bold text-red-600">Canvas Wrapper Crashed</h2>
                    <pre className="bg-white p-4 rounded border border-red-200 text-sm overflow-auto max-w-full whitespace-pre-wrap">
                        {this.state.error?.message}
                        {this.state.error?.stack}
                    </pre>
                    <button
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => window.location.reload()}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function CanvasWrapper({ projectId }: { projectId?: string }) {
    return (
        <ErrorBoundary>
            <Canvas projectId={projectId} />
        </ErrorBoundary>
    );
}
