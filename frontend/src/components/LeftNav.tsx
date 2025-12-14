"use client";

import { Plus, Home, Folder, User, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";

export default function LeftNav() {
    const pathname = usePathname();
    const router = useRouter();
    const locale = useLocale();

    const isActive = (path: string) => pathname.includes(path);

    return (
        <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50">
            {/* New Project Button */}
            <div className="bg-white rounded-full p-1 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100">
                <Button
                    size="icon"
                    className="w-10 h-10 rounded-full bg-black hover:bg-gray-800 text-white transition-all hover:scale-105"
                    onClick={() => router.push(`/${locale}/flow/new`)}
                >
                    <Plus className="w-5 h-5" />
                </Button>
            </div>

            {/* Navigation Menu */}
            <div className="bg-white rounded-full py-3 px-2 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col gap-4 items-center">
                <NavButton
                    icon={Home}
                    active={isActive('/home')}
                    onClick={() => router.push(`/${locale}/home`)}
                />
                <NavButton
                    icon={Folder}
                    active={isActive('/projects')}
                    onClick={() => router.push(`/${locale}/projects`)}
                />
                <NavButton
                    icon={User}
                    active={isActive('/profile')}
                    onClick={() => { }}
                />
                <NavButton
                    icon={Info}
                    active={isActive('/about')}
                    onClick={() => { }}
                />
            </div>
        </div>
    );
}

function NavButton({ icon: Icon, active, onClick }: { icon: any, active?: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-gray-100",
                active ? "text-black bg-gray-100" : "text-gray-400 hover:text-gray-600"
            )}
        >
            <Icon className="w-5 h-5" />
        </button>
    );
}
