"use client";

import { useList, useInvalidate } from "@refinedev/core";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { GiftCreditsModal } from "@/components/admin/GiftCreditsModal";
import { Search, User, CreditCard, Calendar, Gift } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function ProfilesList() {
    const router = useRouter();
    const locale = useLocale();
    const [searchQuery, setSearchQuery] = useState("");
    const [planFilter, setPlanFilter] = useState<string>("all");
    const [creditsFilter, setCreditsFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [mounted, setMounted] = useState(false);

    // New state for gift modal
    const [selectedUserForGift, setSelectedUserForGift] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const supabase = createClient();

    // Fetch profiles with credit transactions
    const { data: listData, isLoading, refetch } = useQuery({
        queryKey: ["profiles", "with-stats"],
        queryFn: async () => {
            // Fetch profiles
            const { data: profiles, error: profilesError } = await supabase
                .from("profiles")
                .select("*")
                .order("created_at", { ascending: false });

            if (profilesError) throw profilesError;

            // Fetch credit transactions for all users to calculate total spend
            // Only count PURCHASE type transactions as spending (TOPUP is money coming in, not spending)
            const { data: transactions, error: transactionsError } = await supabase
                .from("credit_transactions")
                .select("user_id, amount, type, stripe_payment_intent_id")
                .eq("type", "PURCHASE"); // Only count purchases as spending

            if (transactionsError) {
                console.warn("Failed to fetch transactions:", transactionsError);
            }

            // Calculate total spend per user from PURCHASE transactions
            // Also try to get actual payment amounts from Stripe if available
            const spendMap = new Map<string, number>();
            if (transactions) {
                transactions.forEach((tx: any) => {
                    if (tx.type === "PURCHASE") {
                        const current = spendMap.get(tx.user_id) || 0;
                        // Amount is negative for purchases, so we take absolute value
                        // Convert credits to dollars (assuming 1 credit = $0.01, adjust as needed)
                        const spendCredits = Math.abs(tx.amount);
                        const spendDollars = spendCredits * 0.01; // Adjust conversion rate as needed
                        spendMap.set(tx.user_id, current + spendDollars);
                    }
                });
            }

            // Combine profiles with stats
            const profilesWithStats = (profiles || []).map((profile: any) => {
                // Calculate total spend
                const totalSpend = spendMap.get(profile.id) || 0;

                return {
                    ...profile,
                    totalSpend,
                    plan: profile.is_pro ? "Pro" : "Free",
                    status: profile.banned ? "banned" : "active",
                };
            });

            return { data: profilesWithStats };
        },
    });

    const allProfiles = listData?.data || [];

    // Filter profiles
    const filteredProfiles = useMemo(() => {
        return allProfiles.filter((profile: any) => {
            // Search filter - search by email, username, or id
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesEmail = profile.email?.toLowerCase().includes(query);
                const matchesUsername = profile.username?.toLowerCase().includes(query);
                const matchesId = profile.id?.toLowerCase().includes(query);
                if (!matchesEmail && !matchesUsername && !matchesId) return false;
            }

            // Plan filter
            if (planFilter !== "all" && profile.plan !== planFilter) return false;

            // Credits filter
            if (creditsFilter !== "all") {
                if (creditsFilter === "low" && profile.credits >= 10) return false;
                if (creditsFilter === "medium" && (profile.credits < 10 || profile.credits >= 50)) return false;
                if (creditsFilter === "high" && profile.credits < 50) return false;
            }

            // Status filter
            if (statusFilter !== "all" && profile.status !== statusFilter) return false;

            return true;
        });
    }, [allProfiles, searchQuery, planFilter, creditsFilter, statusFilter]);

    const handleRowClick = (profileId: string) => {
        router.push(`/${locale}/admin/profiles/${profileId}`);
    };

    const handleGiftSuccess = () => {
        setSelectedUserForGift(null);
        refetch(); // Refresh list to show updated credits
    };

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Users</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">{allProfiles.length}</p>
                        </div>
                        <User className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Pro Users</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {allProfiles.filter((p: any) => p.is_pro).length}
                            </p>
                        </div>
                        <CreditCard className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Low Credits</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {allProfiles.filter((p: any) => p.credits < 10).length}
                            </p>
                        </div>
                        <CreditCard className="w-8 h-8 text-orange-500" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Avg Credits</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {allProfiles.length > 0
                                    ? Math.round(
                                        allProfiles.reduce((sum: number, p: any) => sum + (p.credits || 0), 0) /
                                        allProfiles.length
                                    )
                                    : 0}
                            </p>
                        </div>
                        <CreditCard className="w-8 h-8 text-green-500" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search by email, username, or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={planFilter} onValueChange={setPlanFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Plan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Plans</SelectItem>
                            <SelectItem value="Pro">Pro</SelectItem>
                            <SelectItem value="Free">Free</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={creditsFilter} onValueChange={setCreditsFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Credits" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Credits</SelectItem>
                            <SelectItem value="low">&lt; 10 credits</SelectItem>
                            <SelectItem value="medium">10 - 50 credits</SelectItem>
                            <SelectItem value="high">&gt;= 50 credits</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="banned">Banned</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spend</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredProfiles.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No users found. {searchQuery || planFilter !== "all" || creditsFilter !== "all" || statusFilter !== "all" ? "Try adjusting your filters." : ""}
                                </td>
                            </tr>
                        ) : (
                            filteredProfiles.map((profile: any) => (
                                <tr
                                    key={profile.id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleRowClick(profile.id)}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#00D2A0] flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                                                {profile.avatar_url ? (
                                                    <img src={profile.avatar_url} alt={profile.username || profile.email} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{(profile.username || profile.email || "U")[0].toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm font-medium text-gray-900 truncate">
                                                        {profile.username || profile.email?.split('@')[0] || "User"}
                                                    </div>
                                                    {profile.banned && (
                                                        <span className="inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-100 text-red-800">
                                                            Banned
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">{profile.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleRowClick(profile.id)}>
                                        <span
                                            className={cn(
                                                "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                                                profile.credits < 10
                                                    ? "bg-red-100 text-red-800"
                                                    : profile.credits < 50
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-green-100 text-green-800"
                                            )}
                                        >
                                            {profile.credits || 0} credits
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleRowClick(profile.id)}>
                                        <span
                                            className={cn(
                                                "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                                                profile.plan === "Pro"
                                                    ? "bg-purple-100 text-purple-800"
                                                    : "bg-gray-100 text-gray-800"
                                            )}
                                        >
                                            {profile.plan}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer" onClick={() => handleRowClick(profile.id)}>
                                        ${profile.totalSpend.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" suppressHydrationWarning onClick={() => handleRowClick(profile.id)}>
                                        {mounted ? new Date(profile.created_at).toLocaleDateString() : profile.created_at}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Gift Credits"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedUserForGift(profile.id);
                                            }}
                                        >
                                            <Gift className="w-4 h-4 text-purple-600" />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-gray-500">
                Showing {filteredProfiles.length} of {allProfiles.length} user(s)
            </div>

            {/* Gift Modal */}
            {selectedUserForGift && (
                <GiftCreditsModal
                    userId={selectedUserForGift}
                    onClose={() => setSelectedUserForGift(null)}
                    onSuccess={handleGiftSuccess}
                />
            )}
        </div>
    );
}
