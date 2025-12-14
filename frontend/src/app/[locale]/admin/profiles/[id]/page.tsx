"use client";

import { useOne, useInvalidate } from "@refinedev/core";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { ArrowLeft, Gift, RotateCcw, Ban, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditLedger } from "@/components/admin/CreditLedger";
import { GiftCreditsModal } from "@/components/admin/GiftCreditsModal";
import { RefundTransactionModal } from "@/components/admin/RefundTransactionModal";
import { BanUserModal } from "@/components/admin/BanUserModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function ProfileDetailPage() {
    const params = useParams();
    const router = useRouter();
    const locale = useLocale();
    const userId = params.id as string;

    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { data: profileData, isLoading, refetch } = useOne({
        resource: "profiles",
        id: userId,
    }) as any;

    if (isLoading) return <div className="p-8">Loading...</div>;

    const profile = profileData?.data;

    const invalidate = useInvalidate();

    if (!profile) {
        return (
            <div className="p-8">
                <p className="text-gray-500">User not found</p>
                <Button onClick={() => router.push(`/${locale}/admin/profiles`)} className="mt-4">
                    Back to Users
                </Button>
            </div>
        );
    }

    const handleSuccess = () => {
        invalidate({ resource: "profiles", invalidates: ["detail", "list"] });
        setIsGiftModalOpen(false);
        setIsRefundModalOpen(false);
        setIsBanModalOpen(false);
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.push(`/${locale}/admin/profiles`)}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-2xl font-bold">User Profile</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="w-16 h-16">
                                    <AvatarImage src={profile.avatar_url || undefined} />
                                    <AvatarFallback>
                                        {profile.email?.charAt(0).toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-gray-900">{profile.email}</p>
                                    <p className="text-sm text-gray-500">User ID: {profile.id.slice(0, 8)}...</p>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Credits</span>
                                    <Badge
                                        variant={
                                            profile.credits < 10
                                                ? "destructive"
                                                : profile.credits < 50
                                                ? "secondary"
                                                : "default"
                                        }
                                    >
                                        {profile.credits || 0}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Plan</span>
                                    <Badge variant={profile.is_pro ? "default" : "outline"}>
                                        {profile.is_pro ? "Pro" : "Free"}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Joined</span>
                                    <span className="text-sm text-gray-900" suppressHydrationWarning>
                                        {mounted ? new Date(profile.created_at).toLocaleDateString() : profile.created_at}
                                    </span>
                                </div>
                                {profile.stripe_customer_id && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Stripe ID</span>
                                        <a
                                            href={`https://dashboard.stripe.com/customers/${profile.stripe_customer_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline"
                                        >
                                            {profile.stripe_customer_id.slice(0, 12)}...
                                        </a>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions Panel */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                className="w-full justify-start"
                                variant="outline"
                                onClick={() => setIsGiftModalOpen(true)}
                            >
                                <Gift className="w-4 h-4 mr-2" />
                                Gift Credits
                            </Button>
                            <Button
                                className="w-full justify-start"
                                variant="outline"
                                onClick={() => setIsRefundModalOpen(true)}
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Refund Transaction
                            </Button>
                            <Button
                                className="w-full justify-start"
                                variant="outline"
                                onClick={() => setIsBanModalOpen(true)}
                            >
                                <Ban className="w-4 h-4 mr-2" />
                                {profile.banned ? "Unban User" : "Ban User"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Credit Ledger */}
                <div className="lg:col-span-2">
                    <CreditLedger userId={userId} />
                </div>
            </div>

            {/* Modals */}
            {isGiftModalOpen && (
                <GiftCreditsModal
                    userId={userId}
                    onClose={() => setIsGiftModalOpen(false)}
                    onSuccess={handleSuccess}
                />
            )}
            {isRefundModalOpen && (
                <RefundTransactionModal
                    userId={userId}
                    onClose={() => setIsRefundModalOpen(false)}
                    onSuccess={handleSuccess}
                />
            )}
            {isBanModalOpen && (
                <BanUserModal
                    userId={userId}
                    isBanned={profile.banned || false}
                    onClose={() => setIsBanModalOpen(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}

