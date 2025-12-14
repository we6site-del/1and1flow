"use client";


import ChatInput from "./components/ChatInput";
import QuickActions from "./components/QuickActions";
import ProjectGrid from "./components/ProjectGrid";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";


export default function HomePage() {
    const t = useTranslations('HomePage');
    const [userName, setUserName] = useState<string>("User");
    const supabase = createClient();

    useEffect(() => {
        const fetchUserName = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Try to get username from profile first
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("username")
                    .eq("id", user.id)
                    .single();

                if (profile?.username) {
                    setUserName(profile.username);
                } else if (user.user_metadata?.full_name) {
                    setUserName(user.user_metadata.full_name);
                } else if (user.email) {
                    setUserName(user.email.split('@')[0]);
                }
            }
        };
        fetchUserName();
    }, [supabase]);

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
                <div className="text-center space-y-6 mt-8 flex flex-col items-center">
                    {/* New Badge */}
                    <div className="bg-[#FFF8E6] text-[#B45309] text-xs font-medium px-4 py-1.5 rounded-full flex items-center gap-2 cursor-pointer hover:bg-[#FFF1CC] transition-colors w-fit">
                        <span className="bg-[#F59E0B] text-white text-[10px] font-bold px-1.5 rounded">NEW</span>
                        <span>立即升级，享受365天无限制Nano Banana Pro! 立即升级 -&gt;</span>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                            1:1Flow 让设计更简单
                        </h1>
                        <p className="text-gray-500 text-base">
                            懂你的设计代理，帮你搞定一切
                        </p>
                    </div>

                    <ChatInput />
                </div>

                <QuickActions />

                <div className="space-y-6">
                    <h2 className="text-xl font-medium text-gray-900">{t('inspiration')}</h2>
                    <ProjectGrid />
                </div>
            </main>
        </div>
    );
}
