"use client";

import { useList } from "@refinedev/core";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { TrendingUp, Users, CreditCard, Image, Download, Activity, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState<string>("7d");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const supabase = createClient();

    // Calculate date range based on timeRange
    const dateRange = useMemo(() => {
        const now = new Date();
        let startDate: Date;
        
        switch (timeRange) {
            case "7d":
                startDate = subDays(now, 7);
                break;
            case "30d":
                startDate = subDays(now, 30);
                break;
            case "90d":
                startDate = subDays(now, 90);
                break;
            default:
                startDate = new Date(0); // All time
        }
        
        return { start: startOfDay(startDate), end: now };
    }, [timeRange]);

    // Fetch data for analytics
    const { data: profilesData } = useQuery({
        queryKey: ["analytics_profiles", timeRange],
        queryFn: async () => {
            const { data, error } = await supabase.from("profiles").select("*");
            if (error) throw error;
            return { data: data || [] };
        },
    });

    const { data: generationsData } = useQuery({
        queryKey: ["analytics_generations", timeRange],
        queryFn: async () => {
            let query = supabase
                .from("generations")
                .select("*")
                .order("created_at", { ascending: false });
            
            if (timeRange !== "all") {
                query = query.gte("created_at", dateRange.start.toISOString());
            }
            
            const { data, error } = await query;
            if (error) throw error;
            return { data: data || [] };
        },
    });

    const { data: modelsData } = useQuery({
        queryKey: ["analytics_models"],
        queryFn: async () => {
            const { data, error } = await supabase.from("ai_models").select("*");
            if (error) throw error;
            return { data: data || [] };
        },
    });

    const { data: transactionsData } = useQuery({
        queryKey: ["analytics_transactions", timeRange],
        queryFn: async () => {
            try {
                let query = supabase
                    .from("credit_transactions")
                    .select("*")
                    .order("created_at", { ascending: false });
                
                if (timeRange !== "all") {
                    query = query.gte("created_at", dateRange.start.toISOString());
                }
                
                const { data, error } = await query;
                
                // If table doesn't exist, return empty array
                if (error && error.code === '42P01') {
                    return { data: [] };
                }
                
                if (error) throw error;
                return { data: data || [] };
            } catch (error: any) {
                console.warn("Error fetching transactions:", error);
                return { data: [] };
            }
        },
    });

    const profiles = profilesData?.data || [];
    const generations = generationsData?.data || [];
    const models = modelsData?.data || [];
    const transactions = transactionsData?.data || [];

    // Calculate metrics
    const totalUsers = profiles.length;
    const proUsers = profiles.filter((p: any) => p.is_pro).length;
    const totalGenerations = generations.length;
    const activeModels = models.filter((m: any) => m.is_active).length;

    // Calculate total credits (sum of all user credits)
    const totalCredits = profiles.reduce((sum: number, p: any) => sum + (p.credits || 0), 0);

    // Calculate credits consumed (from GENERATION transactions)
    const creditsConsumed = transactions
        .filter((t: any) => t.type === 'GENERATION')
        .reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0);

    // Calculate credits added (from TOPUP, GIFT, REFERRAL)
    const creditsAdded = transactions
        .filter((t: any) => ['TOPUP', 'GIFT', 'REFERRAL'].includes(t.type))
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

    // Model popularity (count generations by model)
    const modelUsage: Record<string, number> = {};
    generations.forEach((g: any) => {
        const modelId = g.model_id || g.model || "unknown";
        modelUsage[modelId] = (modelUsage[modelId] || 0) + 1;
    });

    // Generate daily data for charts
    const dailyGenerations = useMemo(() => {
        if (!mounted || timeRange === "all") return [];
        
        const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
        return days.map(day => {
            const dayStart = startOfDay(day);
            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);
            
            const count = generations.filter((g: any) => {
                const genDate = new Date(g.created_at);
                return genDate >= dayStart && genDate <= dayEnd;
            }).length;
            
            return {
                date: day,
                count,
                label: format(day, "MMM d")
            };
        });
    }, [generations, dateRange, mounted, timeRange]);

    const dailyUsers = useMemo(() => {
        if (!mounted || timeRange === "all") return [];
        
        const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
        return days.map(day => {
            const dayStart = startOfDay(day);
            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);
            
            const count = profiles.filter((p: any) => {
                const userDate = new Date(p.created_at);
                return userDate >= dayStart && userDate <= dayEnd;
            }).length;
            
            return {
                date: day,
                count,
                label: format(day, "MMM d")
            };
        });
    }, [profiles, dateRange, mounted, timeRange]);

    const dailyCredits = useMemo(() => {
        if (!mounted || timeRange === "all" || transactions.length === 0) return [];
        
        const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
        return days.map(day => {
            const dayStart = startOfDay(day);
            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);
            
            const consumed = transactions
                .filter((t: any) => {
                    const txDate = new Date(t.created_at);
                    return txDate >= dayStart && txDate <= dayEnd && t.type === 'GENERATION';
                })
                .reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0);
            
            return {
                date: day,
                consumed,
                label: format(day, "MMM d")
            };
        });
    }, [transactions, dateRange, mounted, timeRange]);

    // Calculate max values for chart scaling
    const maxGenerations = Math.max(...dailyGenerations.map(d => d.count), 1);
    const maxUsers = Math.max(...dailyUsers.map(d => d.count), 1);
    const maxCredits = Math.max(...dailyCredits.map(d => d.consumed), 1);

    const handleExport = () => {
        // Export as CSV
        const csvData = [
            ["Metric", "Value"],
            ["Total Users", totalUsers],
            ["Pro Users", proUsers],
            ["Total Generations", totalGenerations],
            ["Active Models", activeModels],
            ["Total Credits", totalCredits],
            ["Credits Consumed", creditsConsumed],
            ["Credits Added", creditsAdded],
            ["Time Range", timeRange],
        ];
        
        const csv = csvData.map(row => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics-${timeRange}-${format(new Date(), "yyyy-MM-dd")}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                <div className="flex gap-2">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 90 days</SelectItem>
                            <SelectItem value="all">All time</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            {proUsers} Pro users
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Generations</CardTitle>
                        <Image className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalGenerations}</div>
                        <p className="text-xs text-muted-foreground">
                            {mounted && timeRange !== "all" ? (
                                <span suppressHydrationWarning>
                                    {generations.filter((g: any) => {
                                        const genDate = new Date(g.created_at);
                                        return genDate >= dateRange.start;
                                    }).length} in selected period
                                </span>
                            ) : (
                                <span suppressHydrationWarning>
                                    {mounted ? (() => {
                                        const sevenDaysAgo = new Date();
                                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                                        return generations.filter((g: any) => {
                                            const genDate = new Date(g.created_at);
                                            return genDate >= sevenDaysAgo;
                                        }).length;
                                    })() : 0} in last 7 days
                                </span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" suppressHydrationWarning>
                            {mounted ? totalCredits.toLocaleString() : totalCredits}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {totalUsers > 0 ? `Avg: ${Math.round(totalCredits / totalUsers).toLocaleString()}` : "Across all users"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Models</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeModels}</div>
                        <p className="text-xs text-muted-foreground">
                            {models.length} total models
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Credits Consumed</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" suppressHydrationWarning>
                            {mounted ? creditsConsumed.toLocaleString() : creditsConsumed}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {timeRange !== "all" ? "In period" : "All time"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Model Popularity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Model Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(modelUsage).length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">
                                No usage data available
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {Object.entries(modelUsage)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 5)
                                    .map(([modelId, count]) => {
                                        const model = models.find((m: any) => m.id === modelId || m.name === modelId);
                                        const percentage = (count / totalGenerations) * 100;
                                        return (
                                            <div key={modelId} className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span>{model?.name || modelId}</span>
                                                    <span className="font-medium">{count}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Activity Statistics */}
                <Card>
                    <CardHeader>
                        <CardTitle>Activity Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Generations Rate</span>
                                <span className="text-sm font-medium">
                                    {totalGenerations > 0 && totalUsers > 0 
                                        ? (totalGenerations / totalUsers).toFixed(1) 
                                        : "0"} per user
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Success Rate</span>
                                <span className="text-sm font-medium">
                                    {totalGenerations > 0 
                                        ? `${Math.round((generations.filter((g: any) => g.status === 'COMPLETED').length / totalGenerations) * 100)}%`
                                        : "0%"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Avg Credits per User</span>
                                <span className="text-sm font-medium">
                                    {totalUsers > 0 ? Math.round(totalCredits / totalUsers).toLocaleString() : 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Credits Consumed</span>
                                <span className="text-sm font-medium text-orange-600">
                                    {creditsConsumed.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Credits Added</span>
                                <span className="text-sm font-medium text-green-600">
                                    {creditsAdded.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Generations Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>Generations Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {dailyGenerations.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">
                                {timeRange === "all" ? "Select a time range to view trends" : "No data available"}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-end gap-1 h-32">
                                    {dailyGenerations.map((day, idx) => {
                                        const height = (day.count / maxGenerations) * 100;
                                        return (
                                            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                                <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '100%' }}>
                                                    <div
                                                        className="absolute bottom-0 w-full bg-blue-600 rounded-t transition-all"
                                                        style={{ height: `${height}%` }}
                                                        title={`${day.count} generations`}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-gray-500 transform -rotate-45 origin-top-left whitespace-nowrap">
                                                    {day.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-2">
                                    <span>Total: {totalGenerations}</span>
                                    <span>Max: {maxGenerations} per day</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* User Growth */}
                <Card>
                    <CardHeader>
                        <CardTitle>User Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {dailyUsers.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">
                                {timeRange === "all" ? "Select a time range to view trends" : "No data available"}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-end gap-1 h-32">
                                    {dailyUsers.map((day, idx) => {
                                        const height = maxUsers > 0 ? (day.count / maxUsers) * 100 : 0;
                                        return (
                                            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                                <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '100%' }}>
                                                    <div
                                                        className="absolute bottom-0 w-full bg-green-600 rounded-t transition-all"
                                                        style={{ height: `${height}%` }}
                                                        title={`${day.count} new users`}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-gray-500 transform -rotate-45 origin-top-left whitespace-nowrap">
                                                    {day.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-2">
                                    <span>Total: {totalUsers}</span>
                                    <span>Max: {maxUsers} per day</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Credit Consumption */}
                <Card>
                    <CardHeader>
                        <CardTitle>Credit Consumption</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {dailyCredits.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">
                                {timeRange === "all" ? "Select a time range to view trends" : transactions.length === 0 ? "No transaction data available" : "No data available"}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-end gap-1 h-32">
                                    {dailyCredits.map((day, idx) => {
                                        const height = maxCredits > 0 ? (day.consumed / maxCredits) * 100 : 0;
                                        return (
                                            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                                <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '100%' }}>
                                                    <div
                                                        className="absolute bottom-0 w-full bg-orange-600 rounded-t transition-all"
                                                        style={{ height: `${height}%` }}
                                                        title={`${day.consumed} credits consumed`}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-gray-500 transform -rotate-45 origin-top-left whitespace-nowrap">
                                                    {day.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-2">
                                    <span>Total Consumed: {creditsConsumed.toLocaleString()}</span>
                                    <span>Max: {maxCredits.toLocaleString()} per day</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Credit Statistics */}
                <Card>
                    <CardHeader>
                        <CardTitle>Credit Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm text-gray-600">Consumed</span>
                                </div>
                                <span className="text-sm font-medium">{creditsConsumed.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-gray-600">Added</span>
                                </div>
                                <span className="text-sm font-medium">{creditsAdded.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm text-gray-600">Total Balance</span>
                                </div>
                                <span className="text-sm font-medium" suppressHydrationWarning>
                                    {mounted ? totalCredits.toLocaleString() : totalCredits}
                                </span>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Net Change</span>
                                    <span className={`text-sm font-medium ${creditsAdded - creditsConsumed >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {creditsAdded - creditsConsumed >= 0 ? '+' : ''}{(creditsAdded - creditsConsumed).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

