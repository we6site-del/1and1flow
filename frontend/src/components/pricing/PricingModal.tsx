"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface Plan {
    id: string;
    name: string;
    price_monthly: number;
    price_yearly: number;
    credits_monthly: number;
    features: string[];
    is_popular: boolean;
    tier_level: number;
}

interface PricingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId?: string;
}

export default function PricingModal({ open, onOpenChange, userId }: PricingModalProps) {
    const [isYearly, setIsYearly] = useState(true);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    // Countdown timer logic (mocked for now, can be persisted)
    const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 20, minutes: 32, seconds: 5 });

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await fetch("/api/plans");
                if (res.ok) {
                    const data = await res.json();
                    setPlans(data);
                }
            } catch (error) {
                console.error("Failed to fetch plans:", error);
            } finally {
                setLoading(false);
            }
        };

        if (open) {
            fetchPlans();
        }
    }, [open]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
                if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
                return prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const { toast } = useToast();

    const handleUpgrade = async (plan: Plan) => {
        if (!userId) {
            toast({ title: "Please login first", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: userId,
                    plan_id: plan.id,
                    redirect_url: window.location.href,
                    is_yearly: isYearly
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    throw new Error("No checkout URL returned");
                }
            } else {
                const errorData = await res.json();
                throw new Error(errorData.detail || "Payment initiation failed");
            }
        } catch (error) {
            console.error("Payment error:", error);
            toast({
                title: "Payment Error",
                description: error instanceof Error ? error.message : "Please try again later.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl w-full h-[90vh] overflow-y-auto bg-[#F9FAFB] p-0 border-none rounded-3xl">
                <DialogTitle className="sr-only">Upgrade Your Plan</DialogTitle>
                <div className="flex flex-col items-center pb-12">
                    {/* Header Banner */}
                    <div className="w-full bg-white pt-8 pb-12 px-4 flex flex-col items-center relative overflow-hidden">
                        {/* Gold Fluid Background Effect (Simplified with CSS/SVG) */}
                        <div className="absolute top-0 right-0 w-1/3 h-full opacity-20 pointer-events-none">
                            <div className="w-full h-full bg-gradient-to-bl from-yellow-400 to-transparent rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                        </div>

                        <div className="z-10 flex flex-col items-center text-center space-y-6 max-w-4xl w-full">
                            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-gray-100">
                                <div className="text-left">
                                    <div className="inline-block bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded mb-1">限时优惠</div>
                                    <h2 className="text-xl font-bold text-gray-900">超级狂欢周 X Nano Banana Pro</h2>
                                    <p className="text-gray-600 text-sm">限时5折优惠</p>
                                </div>
                                <div className="flex gap-2">
                                    <TimeUnit value={timeLeft.days} label="天" />
                                    <TimeUnit value={timeLeft.hours} label="小时" />
                                    <TimeUnit value={timeLeft.minutes} label="分钟" />
                                    <TimeUnit value={timeLeft.seconds} label="秒" />
                                </div>
                            </div>

                            <h1 className="text-3xl font-bold text-gray-900 mt-4">升级您的套餐</h1>

                            {/* Toggle */}
                            <div className="flex items-center bg-gray-200 p-1 rounded-full relative">
                                <div className="absolute -top-3 -right-12 bg-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full transform rotate-12 shadow-sm z-20">
                                    超级狂欢周
                                </div>
                                <button
                                    className={cn(
                                        "px-6 py-2 rounded-full text-sm font-medium transition-all z-10",
                                        !isYearly ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-900"
                                    )}
                                    onClick={() => setIsYearly(false)}
                                >
                                    月付
                                </button>
                                <button
                                    className={cn(
                                        "px-6 py-2 rounded-full text-sm font-medium transition-all z-10 flex items-center gap-1",
                                        isYearly ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-900"
                                    )}
                                    onClick={() => setIsYearly(true)}
                                >
                                    年付 <span className="text-blue-500 text-xs">限时5折优惠</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Plans Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-8 -mt-8 w-full max-w-7xl z-20">
                        {loading ? (
                            <div className="col-span-4 text-center py-12">Loading plans...</div>
                        ) : (
                            plans.map((plan) => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    isYearly={isYearly}
                                    onUpgrade={() => handleUpgrade(plan)}
                                />
                            ))
                        )}
                    </div>

                    <div className="mt-8 text-gray-400 text-xs flex items-center gap-1">
                        <span className="bg-gray-400 rounded-full w-3 h-3 flex items-center justify-center text-white text-[8px]">?</span>
                        常见问题
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center bg-gray-100 rounded-lg w-12 h-14 justify-center">
            <span className="text-xl font-bold text-gray-900 leading-none">{value.toString().padStart(2, '0')}</span>
            <span className="text-[10px] text-gray-500">{label}</span>
        </div>
    );
}

function PlanCard({ plan, isYearly, onUpgrade }: { plan: Plan; isYearly: boolean; onUpgrade: () => void }) {
    const isBasic = plan.name === "Basic";
    const isPro = plan.name === "Pro";
    const isUltimate = plan.name === "Ultimate";

    const price = isYearly ? plan.price_yearly : plan.price_monthly;
    const originalPrice = isYearly ? plan.price_monthly * 12 / 12 : null; // Simplified logic for display

    // Calculate display prices based on image logic (Pro and Ultimate have strikethrough prices)
    // Assuming the API returns the discounted price as the main price
    let displayPrice = price;
    let strikethroughPrice = null;

    if (isYearly) {
        if (isPro) strikethroughPrice = 90;
        if (isUltimate) strikethroughPrice = 199;
    }

    return (
        <div
            className={cn(
                "bg-white rounded-2xl p-6 flex flex-col relative transition-all duration-200 hover:shadow-xl border",
                isBasic ? "border-yellow-400 shadow-lg ring-1 ring-yellow-400" : "border-gray-100 shadow-sm"
            )}
        >
            {isBasic && (
                <div className="absolute top-4 right-4 bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded">
                    最受欢迎
                </div>
            )}
            {(isPro || isUltimate) && (
                <div className="absolute top-4 right-4 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    超级狂欢周
                </div>
            )}

            <h3 className={cn("text-xl font-bold mb-2", isBasic ? "text-yellow-600" : "text-gray-900")}>
                {plan.name}
            </h3>

            <div className="flex items-baseline gap-1 mb-1">
                {strikethroughPrice && (
                    <span className="text-gray-400 text-lg line-through font-medium">${strikethroughPrice}</span>
                )}
                <span className="text-4xl font-bold text-gray-900">${displayPrice}</span>
                <span className="text-gray-500 text-sm">/月</span>
            </div>
            <p className="text-xs text-gray-500 mb-6">
                {isYearly ? "按年计费" : "按月计费"}
            </p>

            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">每月 {plan.credits_monthly.toLocaleString()} 积分</span>
                <span className="text-gray-400 text-xs">?</span>
            </div>
            <div className="flex items-center justify-between mb-6">
                <span className="text-xs text-gray-500">首购额外 {plan.credits_monthly.toLocaleString()} 积分</span>
                <span className="border border-gray-200 rounded px-1 text-[10px] text-gray-400">限时优惠</span>
            </div>

            <Button
                className={cn(
                    "w-full mb-6",
                    "bg-gray-900 hover:bg-black text-white"
                )}
                onClick={onUpgrade}
            >
                升级
            </Button>

            <div className="space-y-3 flex-1">
                {plan.features.map((feature, idx) => {
                    // Check for special badges in feature string or logic
                    const isUnlimited = feature.includes("UNLIMITED");
                    const badge = isUnlimited ? feature.split(" ").slice(-2).join(" ") : null;
                    const text = isUnlimited ? feature.replace(badge || "", "") : feature;

                    return (
                        <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                            <Check className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0" />
                            <span className="flex-1">{text}</span>
                            {/* Simple badge parsing logic for demo */}
                            {(feature.includes("Nano Banana") || feature.includes("Seedream")) && (
                                <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                                    {feature.includes("UNLIMITED") ? "365 UNLIMITED" : ""}
                                </span>
                            )}
                            {feature.includes("1 MONTH UNLIMITED") && (
                                <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                                    1 MONTH UNLIMITED
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
