"use client";

import { Bell, Zap, User, HelpCircle, Keyboard, MessageSquare, LogOut, ChevronRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import AccountSettingsDialog from "@/components/canvas/AccountSettingsDialog";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PricingModal from "@/components/pricing/PricingModal";

export default function Header() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [credits, setCredits] = useState<number | null>(null);
    const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
    const [isPricingOpen, setIsPricingOpen] = useState(false);
    const supabase = createClient();
    const router = useRouter();
    const locale = useLocale();

    useEffect(() => {
        let channel: any = null;

        const getUser = async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser) {
                setUser(currentUser);
                // Fetch profile for avatar, username, and credits
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("avatar_url, username, credits")
                    .eq("id", currentUser.id)
                    .single();
                if (profileData) {
                    setProfile(profileData);
                    setCredits(profileData.credits || 0);
                }

                // Subscribe to credit updates
                channel = supabase.channel('header-credits')
                    .on('postgres_changes', {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles'
                    }, (payload: any) => {
                        if (payload.new.id === currentUser.id) {
                            setCredits(payload.new.credits || 0);
                            setProfile((prev: any) => ({ ...prev, credits: payload.new.credits }));
                        }
                    })
                    .subscribe();
            }
        };
        getUser();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push(`/${locale}/login`);
    };

    return (
        <>
            <AccountSettingsDialog open={isAccountSettingsOpen} onOpenChange={setIsAccountSettingsOpen} />
            <PricingModal open={isPricingOpen} onOpenChange={setIsPricingOpen} userId={user?.id} />
            <header className="h-16 border-b border-gray-100 bg-white px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                        <img src="/1and1design.png" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-bold text-xl tracking-tight font-sans">1:1Flow</span>
                </div>



                <div className="flex items-center gap-4">
                    <LanguageSwitcher />
                    <Button variant="ghost" size="icon" className="text-gray-500">
                        <Bell className="w-5 h-5" />
                    </Button>

                    {/* Top Upgrade Button */}
                    <Button
                        className="bg-black text-white hover:bg-gray-900 gap-2 h-9 rounded-full px-4 transition-colors"
                        onClick={() => setIsPricingOpen(true)}
                    >
                        升级 <span className="text-xs bg-gray-900 px-1.5 rounded text-white flex items-center"><Zap className="w-3 h-3 inline mr-0.5 text-yellow-400 fill-yellow-400" />{credits !== null ? credits : 0}</span>
                    </Button>

                    {/* User Avatar with Hover Menu */}
                    <HoverCard openDelay={0} closeDelay={200}>
                        <HoverCardTrigger asChild>
                            <div className="w-8 h-8 rounded-full bg-[#00D2A0] flex items-center justify-center text-white cursor-pointer shadow-sm overflow-hidden flex-shrink-0">
                                {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                                    <img
                                        src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                                        alt={profile?.username || user?.email || "User"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="font-bold text-sm">
                                        {(profile?.username || user?.email || "U")[0].toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </HoverCardTrigger>
                        <HoverCardContent align="end" sideOffset={12} className="w-[280px] p-4 rounded-xl shadow-xl border-gray-100 bg-white">
                            <div className="flex flex-col gap-4">
                                {/* Header: Avatar, Name, Email, Upgrade */}
                                <div className="flex flex-col items-center gap-2">
                                    <Avatar className="w-16 h-16 border-2 border-white shadow-sm">
                                        <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url || undefined} />
                                        <AvatarFallback className="bg-[#00D2A0] text-white text-2xl font-bold">
                                            {(profile?.username || user?.user_metadata?.full_name || user?.email || "U")[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm text-gray-900">
                                            {profile?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User"}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {user?.email || ""}
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="h-7 text-xs bg-black hover:bg-gray-900 text-white rounded-md px-3 transition-colors"
                                        onClick={() => setIsPricingOpen(true)}
                                    >
                                        升级会员
                                    </Button>
                                </div>

                                {/* Credits Row */}
                                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors">
                                    <span className="text-xs font-medium text-gray-700">积分</span>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <span>{credits !== null ? credits : 0}</span>
                                        <ChevronRight className="w-3 h-3" />
                                    </div>
                                </div>
                                <div className="flex justify-between px-1">
                                    <span className="text-[10px] text-gray-400">永久积分</span>
                                    <span className="text-[10px] text-blue-500">{credits !== null ? credits : 0}</span>
                                </div>
                                <div className="flex justify-between px-1 pb-2 border-b border-gray-50">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-gray-700">每日免费积分</span>
                                        <span className="text-[10px] text-gray-400">每天重置为100免费积分</span>
                                    </div>
                                    <span className="text-xs font-medium text-gray-700">0</span>
                                </div>
                                <div className="px-1 pt-1 flex items-center gap-1 cursor-pointer hover:text-gray-900 transition-colors">
                                    <span className="text-xs text-gray-600">Usage details</span>
                                    <ChevronRight className="w-3 h-3 text-gray-400" />
                                </div>

                                {/* Menu Items */}
                                <div className="flex flex-col gap-1 pt-1 border-t border-gray-50 mt-1">
                                    <button
                                        className="flex items-center gap-3 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                                        onClick={() => setIsAccountSettingsOpen(true)}
                                    >
                                        <User className="w-4 h-4 text-gray-500" />
                                        <span>账户管理</span>
                                    </button>
                                    <button className="flex items-center gap-3 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                                        <HelpCircle className="w-4 h-4 text-gray-500" />
                                        <span>使用指南</span>
                                    </button>
                                    <button className="flex items-center gap-3 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                                        <MessageSquare className="w-4 h-4 text-gray-500" />
                                        <span>Discord</span>
                                    </button>
                                    <button
                                        className="flex items-center gap-3 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left mt-1"
                                        onClick={handleSignOut}
                                    >
                                        <LogOut className="w-4 h-4 text-gray-500" />
                                        <span>退出登录</span>
                                    </button>
                                </div>
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                </div>
            </header>
        </>
    );
}
