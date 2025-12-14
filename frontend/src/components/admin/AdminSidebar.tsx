"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    Users,
    Image,
    Settings,
    BarChart3,
    Shield,
    LayoutDashboard,
    Zap,
    Library
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/profiles", icon: Users },
    { name: "AI Models", href: "/admin/ai-models", icon: Settings },
    { name: "Prompt Gallery", href: "/admin/prompts", icon: Image },
    { name: "System Settings", href: "/admin/settings", icon: Settings },
    { name: "Plans", href: "/admin/plans", icon: Zap },
    { name: "Moderation", href: "/admin/moderation", icon: Shield },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
            <div className="p-4">
                <h1 className="font-bold text-xl mb-6 px-2 text-gray-900">
                    Admin Panel
                </h1>
                <nav className="space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/admin" && pathname?.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-gray-700 hover:bg-gray-100"
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}

