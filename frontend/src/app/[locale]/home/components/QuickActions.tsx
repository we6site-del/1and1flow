"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function QuickActions() {
    const actions = [
        { label: "Nano Banana Pro", icon: "🍌", color: "text-yellow-600 bg-yellow-50 border-yellow-200 hover:bg-yellow-100" },
        { label: "Design", icon: "🎨" },
        { label: "Branding", icon: "🏷️" },
        { label: "Illustration", icon: "✏️" },
        { label: "E-Commerce", icon: "🛍️" },
        { label: "Video", icon: "🎥" },
    ];

    return (
        <div className="flex flex-wrap justify-center gap-3">
            {actions.map((action) => (
                <button
                    key={action.label}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all hover:scale-105",
                        action.color || "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    )}
                >
                    <span>{action.icon}</span>
                    <span>{action.label}</span>
                </button>
            ))}
        </div>
    );
}
