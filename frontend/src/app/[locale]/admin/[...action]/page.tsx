"use client";

import { ErrorComponent } from "@refinedev/core";
import { Refine } from "@refinedev/core";

export default function CatchAll({ params }: { params: { action: string[] } }) {
    // This page is a placeholder. Refine's routerProvider handles the routing
    // based on the resource definitions in layout.tsx.
    // However, Next.js needs a page to render.

    return <ErrorComponent />;
}
