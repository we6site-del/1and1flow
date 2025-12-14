"use client";

import { useEditor, useValue } from "tldraw";
import { Minus, Plus, Zap, User, HelpCircle, Keyboard, MessageSquare, LogOut, ChevronRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import AccountSettingsDialog from "./AccountSettingsDialog";
import { usePricingModal } from "@/hooks/usePricingModal";

export default function BottomBar({ className }: { className?: string }) {
    const editor = useEditor();
    const zoomLevel = useValue("zoom", () => editor ? Math.round(editor.getZoomLevel() * 100) : 100, [editor]);
    const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [credits, setCredits] = useState<number | null>(null);
    const supabase = createClient();
    const t = useTranslations('BottomBar');
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const { onOpen } = usePricingModal();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push(`/${locale}/login`);
    };

    useEffect(() => {
        let channel: any = null;

        const fetchUserAndCredits = async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser) {
                setUser(currentUser);
                // Fetch profile data including avatar_url and credits
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("credits, avatar_url, username")
                    .eq("id", currentUser.id)
                    .single();

                if (profileData) {
                    setProfile(profileData);
                    setCredits(profileData.credits);
                }

                // Subscribe to credit and profile updates
                channel = supabase.channel('bottom-bar-updates')
                    .on('postgres_changes', {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles'
                    }, (payload: any) => {
                        if (payload.new.id === currentUser.id) {
                            setProfile(payload.new);
                            setCredits(payload.new.credits);
                        }
                    })
                    .subscribe();
            }
        };

        fetchUserAndCredits();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [supabase]);

    const handleZoomIn = () => {
        editor?.zoomIn();
    };

    const handleZoomOut = () => {
        editor?.zoomOut();
    };

    return (
        <>
            <AccountSettingsDialog open={isAccountSettingsOpen} onOpenChange={setIsAccountSettingsOpen} />
            <div className={`fixed bottom-6 left-6 flex items-center gap-3 z-[2000] ${className}`}>
                {/* User & Credits Pill with Hover Menu */}
                <HoverCard openDelay={0} closeDelay={200}>
                    <HoverCardTrigger asChild>
                        <div className="bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 px-1 py-1 flex items-center gap-2 pr-3 cursor-pointer hover:bg-gray-50 transition-colors">
                            <div className="w-6 h-6 bg-[#00D2A0] rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm overflow-hidden flex-shrink-0">
                                {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                                    <img
                                        src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                                        alt={profile?.username || user?.email || "User"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span>{(profile?.username || user?.email || "U")[0].toUpperCase()}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border-l border-gray-100 pl-2">
                                <Zap className="w-3 h-3 fill-gray-400 text-gray-400" />
                                <span>{credits !== null ? credits : 0}</span>
                            </div>
                        </div>
                    </HoverCardTrigger>
                    <HoverCardContent align="start" sideOffset={12} className="w-[280px] p-4 rounded-xl shadow-xl border-gray-100 bg-white">
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
                                    onClick={() => onOpen()}
                                >
                                    {t('upgrade')}
                                </Button>
                            </div>

                            {/* Credits Row */}
                            <div
                                className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => onOpen()}
                            >
                                <span className="text-xs font-medium text-gray-700">{t('credits')}</span>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <span>{credits !== null ? credits : 0}</span>
                                    <ChevronRight className="w-3 h-3" />
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="flex flex-col gap-1 pt-1">
                                <button
                                    className="flex items-center gap-3 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left"
                                    onClick={() => setIsAccountSettingsOpen(true)}
                                >
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span>{t('account')}</span>
                                </button>
                                <button className="flex items-center gap-3 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                                    <HelpCircle className="w-4 h-4 text-gray-500" />
                                    <span>{t('tutorials')}</span>
                                </button>
                                <button className="flex items-center gap-3 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                                    <Keyboard className="w-4 h-4 text-gray-500" />
                                    <span>{t('shortcuts')}</span>
                                </button>
                                <button className="flex items-center gap-3 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                                    <MessageSquare className="w-4 h-4 text-gray-500" /> {/* Discord icon placeholder */}
                                    <span>{t('discord')}</span>
                                </button>

                                <button
                                    className="flex items-center justify-between px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left group"
                                    onClick={() => {
                                        const newLocale = locale === 'en' ? 'zh' : 'en';
                                        const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
                                        router.push(newPath);
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-4 h-4 text-gray-500" />
                                        <span>{locale === 'zh' ? '简体中文' : 'English'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-gray-400">{locale === 'zh' ? 'English' : '简体中文'}</span>
                                        <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                                    </div>
                                </button>

                                <button
                                    className="flex items-center gap-3 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left mt-1"
                                    onClick={handleSignOut}
                                >
                                    <LogOut className="w-4 h-4 text-gray-500" />
                                    <span>{t('signOut')}</span>
                                </button>
                            </div>
                        </div>
                    </HoverCardContent>
                </HoverCard>

                {/* Zoom Control Pill */}
                <div className="bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 p-1 flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-gray-50 text-gray-500"
                        onClick={handleZoomOut}
                    >
                        <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-xs font-medium w-9 text-center text-gray-600 select-none">{zoomLevel}%</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-gray-50 text-gray-500"
                        onClick={handleZoomIn}
                    >
                        <Plus className="w-3 h-3" />
                    </Button>
                </div>
            </div>
        </>
    );
}
