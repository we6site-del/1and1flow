"use client";

import { useState } from "react";
import { Refine } from "@refinedev/core";
import { dataProvider } from "@refinedev/supabase";
import routerProvider from "@refinedev/nextjs-router";
import { createClient } from "@/utils/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

import { authProvider } from "@/providers/auth-provider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const dp = dataProvider(supabase);

    return (
        <Refine
            dataProvider={dp}
            authProvider={authProvider}
            routerProvider={routerProvider}
            resources={[
                {
                    name: "profiles",
                    list: "/admin/profiles",
                    meta: {
                        label: "Users",
                    },
                },
                {
                    name: "generations",
                    list: "/admin/generations",
                },
                {
                    name: "ai_models",
                    list: "/admin/ai-models",
                    meta: {
                        label: "AI Models",
                    },
                },
                {
                    name: "plans",
                    list: "/admin/plans",
                    meta: {
                        label: "Plans",
                    },
                },
            ]}
            options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
            }}
        >
            <div className="flex min-h-screen bg-gray-50">
                {/* Sidebar - Hidden on mobile, shown on desktop */}
                <div className="hidden md:block">
                    <AdminSidebar />
                </div>

                {/* Mobile Sidebar Overlay */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-40 md:hidden">
                        <div
                            className="fixed inset-0 bg-black/50"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <div className="fixed inset-y-0 left-0 z-50">
                            <AdminSidebar />
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                    <main className="flex-1 p-6 md:p-8 overflow-auto">
                        {children}
                    </main>
                </div>
            </div>
        </Refine>
    );
}
