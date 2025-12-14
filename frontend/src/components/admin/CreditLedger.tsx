"use client";

import { useState, useMemo, useEffect } from "react";
import { useList } from "@refinedev/core";
import { Calendar, ArrowUp, ArrowDown, Gift, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface CreditLedgerProps {
    userId: string;
}

export function CreditLedger({ userId }: CreditLedgerProps) {
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [dateFrom, setDateFrom] = useState<string>("");
    const [dateTo, setDateTo] = useState<string>("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { data: transactionsData, isLoading } = useList({
        resource: "credit_transactions",
        filters: [
            {
                field: "user_id",
                operator: "eq",
                value: userId,
            },
        ],
        sorters: [
            {
                field: "created_at",
                order: "desc",
            },
        ],
    }) as any;

    const allTransactions = transactionsData?.data || [];

    const filteredTransactions = useMemo(() => {
        return allTransactions.filter((tx: any) => {
            // Type filter
            if (typeFilter !== "all" && tx.type !== typeFilter) return false;

            // Date filter
            if (dateFrom) {
                const txDate = new Date(tx.created_at);
                const fromDate = new Date(dateFrom);
                if (txDate < fromDate) return false;
            }
            if (dateTo) {
                const txDate = new Date(tx.created_at);
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999); // End of day
                if (txDate > toDate) return false;
            }

            return true;
        });
    }, [allTransactions, typeFilter, dateFrom, dateTo]);

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case "TOPUP":
            case "GIFT":
            case "REFUND":
            case "REFERRAL":
                return <ArrowUp className="w-4 h-4 text-green-600" />;
            case "GENERATION":
            case "PURCHASE":
                return <ArrowDown className="w-4 h-4 text-red-600" />;
            default:
                return <Calendar className="w-4 h-4 text-gray-400" />;
        }
    };

    const getTransactionColor = (type: string) => {
        switch (type) {
            case "TOPUP":
            case "GIFT":
            case "REFUND":
            case "REFERRAL":
                return "text-green-600";
            case "GENERATION":
            case "PURCHASE":
                return "text-red-600";
            default:
                return "text-gray-600";
        }
    };

    const getTransactionLabel = (type: string) => {
        const labels: Record<string, string> = {
            TOPUP: "Top-up",
            GENERATION: "Generation",
            REFUND: "Refund",
            GIFT: "Gift",
            REFERRAL: "Referral",
            PURCHASE: "Purchase",
        };
        return labels[type] || type;
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Credit Ledger</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-gray-500 py-8">Loading...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Credit Ledger</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Transaction Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="TOPUP">Top-up</SelectItem>
                            <SelectItem value="GENERATION">Generation</SelectItem>
                            <SelectItem value="REFUND">Refund</SelectItem>
                            <SelectItem value="GIFT">Gift</SelectItem>
                            <SelectItem value="REFERRAL">Referral</SelectItem>
                            <SelectItem value="PURCHASE">Purchase</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        type="date"
                        placeholder="From Date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                    />
                    <Input
                        type="date"
                        placeholder="To Date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                    />
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                    {filteredTransactions.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            No transactions found
                        </div>
                    ) : (
                        filteredTransactions.map((tx: any, index: number) => (
                            <div
                                key={tx.id}
                                className="flex items-start gap-4 pb-4 border-b last:border-0"
                            >
                                <div className="mt-1">{getTransactionIcon(tx.type)}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {getTransactionLabel(tx.type)}
                                            </p>
                                            {tx.reason && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {tx.reason}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1" suppressHydrationWarning>
                                                {mounted ? format(new Date(tx.created_at), "PPp") : tx.created_at}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p
                                                className={cn(
                                                    "text-sm font-semibold",
                                                    getTransactionColor(tx.type)
                                                )}
                                            >
                                                {tx.amount > 0 ? "+" : ""}
                                                {tx.amount} credits
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Balance: {tx.balance_after}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

