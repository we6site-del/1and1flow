"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useLocale } from "next-intl";
import { LayoutDashboard, Users, Image, Settings, Shield, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export const dynamic = "force-dynamic";

export default function AdminDashboard() {
    const router = useRouter();
    const locale = useLocale();
    const supabase = createClient();

    // Fetch statistics
    const { data: profilesData } = useQuery({
        queryKey: ["admin_stats_profiles"],
        queryFn: async () => {
            const { data, error } = await supabase.from("profiles").select("id");
            if (error) throw error;
            return { data: data || [] };
        },
    });

    const { data: modelsData } = useQuery({
        queryKey: ["admin_stats_models"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("ai_models")
                .select("id, is_active")
                .eq("is_active", true);
            if (error) throw error;
            return { data: data || [] };
        },
    });

    const { data: generationsData } = useQuery({
        queryKey: ["admin_stats_generations"],
        queryFn: async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { data, error } = await supabase
                .from("generations")
                .select("id")
                .gte("created_at", today.toISOString());
            if (error) throw error;
            return { data: data || [] };
        },
    });

    const { data: moderationData } = useQuery({
        queryKey: ["admin_stats_moderation"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("generations")
                .select("id, is_nsfw, is_deleted")
                .or("is_nsfw.eq.true,is_deleted.eq.true");
            if (error) {
                // If columns don't exist, return empty array
                if (error.code === '42703') return { data: [] };
                throw error;
            }
            return { data: data || [] };
        },
    });

    const totalUsers = profilesData?.data?.length || 0;
    const activeModels = modelsData?.data?.length || 0;
    const todayGenerations = generationsData?.data?.length || 0;
    const pendingModeration = moderationData?.data?.filter((g: any) => g.is_nsfw && !g.is_deleted).length || 0;

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-gray-500 mt-1">Welcome to the admin panel</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers}</div>
                        <p className="text-xs text-muted-foreground">Active users</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">AI Models</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeModels}</div>
                        <p className="text-xs text-muted-foreground">Active models</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Generations</CardTitle>
                        <Image className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todayGenerations}</div>
                        <p className="text-xs text-muted-foreground">Today</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Moderation</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingModeration}</div>
                        <p className="text-xs text-muted-foreground">Pending reviews</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/${locale}/admin/profiles`)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            User Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">Manage users, credits, and permissions</p>
                        <Button variant="outline" className="w-full">Go to Users</Button>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/${locale}/admin/ai-models`)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            AI Models
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">Configure AI models and parameters</p>
                        <Button variant="outline" className="w-full">Manage Models</Button>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/${locale}/admin/generations`)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Image className="w-5 h-5" />
                            Generations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">View and manage AI generations</p>
                        <Button variant="outline" className="w-full">View Generations</Button>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/${locale}/admin/moderation`)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Content Moderation
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">Review and moderate user content</p>
                        <Button variant="outline" className="w-full">Moderate Content</Button>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/${locale}/admin/analytics`)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Analytics
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">View platform analytics and metrics</p>
                        <Button variant="outline" className="w-full">View Analytics</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

