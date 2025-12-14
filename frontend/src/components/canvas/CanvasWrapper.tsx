"use client";

import dynamic from "next/dynamic";

const Canvas = dynamic(() => import("./Canvas"), { ssr: false });

export default function CanvasWrapper({ projectId }: { projectId?: string }) {
    return <Canvas projectId={projectId} />;
}
