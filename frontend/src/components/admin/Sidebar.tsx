"use client";

import Link from "next/link";
import { useMenu, useLogout } from "@refinedev/core";
import { LayoutDashboard, Cuboid, Users, LogOut } from "lucide-react";

export function AdminSidebar() {
    const { menuItems, selectedKey } = useMenu();
    const { mutate: logout } = useLogout();

    return (
        <aside className="w-64 border-r border-slate-200 bg-white px-4 py-6 flex flex-col h-screen sticky top-0">
            <div className="mb-8 px-2 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">
                    LF
                </div>
                <span className="text-lg font-semibold tracking-tight">Lovart Admin</span>
            </div>

            <nav className="flex-1 space-y-1">
                <Link
                    href="/admin"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${selectedKey === "dashboard" || selectedKey === "/admin"
                            ? "bg-slate-100 text-slate-900"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                </Link>
                {menuItems.map((item) => {
                    const Icon = item.name === 'ai_models' ? Cuboid : Users;
                    return (
                        <Link
                            key={item.key}
                            href={item.route ?? "/admin"}
                            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${selectedKey === item.key
                                    ? "bg-slate-100 text-slate-900"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="border-t border-slate-200 pt-4">
                <button
                    onClick={() => logout()}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </aside>
    );
}
