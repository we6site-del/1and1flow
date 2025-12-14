"use client";

import { useState, useEffect } from "react";
import { useList } from "@refinedev/core";
import { createClient } from "@/utils/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { format } from "date-fns";

interface RefundTransactionModalProps {
    userId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function RefundTransactionModal({
    userId,
    onClose,
    onSuccess,
}: RefundTransactionModalProps) {
    const [selectedTransactionId, setSelectedTransactionId] = useState<string>("");
    const [reason, setReason] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch user's transactions (only GENERATION and PURCHASE types can be refunded)
    const { data: transactionsData } = useList({
        resource: "credit_transactions",
        filters: [
            {
                field: "user_id",
                operator: "eq",
                value: userId,
            },
            {
                operator: "or",
                value: [
                    {
                        field: "type",
                        operator: "eq",
                        value: "GENERATION",
                    },
                    {
                        field: "type",
                        operator: "eq",
                        value: "PURCHASE",
                    },
                ],
            },
        ],
        sorters: [
            {
                field: "created_at",
                order: "desc",
            },
        ],
    }) as any;

    const transactions = transactionsData?.data || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTransactionId) {
            toast.error("Please select a transaction to refund");
            return;
        }

        if (!reason.trim()) {
            toast.error("Please provide a reason");
            return;
        }

        setIsLoading(true);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error("You must be logged in");
                return;
            }

            const response = await fetch("/api/admin/credits/refund", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    transaction_id: selectedTransactionId,
                    reason: reason.trim(),
                    admin_id: user.id,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || "Failed to refund transaction");
            }

            toast.success("Transaction refunded successfully");
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Failed to refund transaction");
        } finally {
            setIsLoading(false);
        }
    };

    const selectedTransaction = transactions.find(
        (tx: any) => tx.id === selectedTransactionId
    );

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RotateCcw className="w-5 h-5" />
                        Refund Transaction
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="transaction">Select Transaction *</Label>
                        <Select
                            value={selectedTransactionId}
                            onValueChange={setSelectedTransactionId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a transaction" />
                            </SelectTrigger>
                            <SelectContent>
                                {transactions.length === 0 ? (
                                    <SelectItem value="none" disabled>
                                        No refundable transactions found
                                    </SelectItem>
                                ) : (
                                    transactions.map((tx: any) => (
                                        <SelectItem key={tx.id} value={tx.id} suppressHydrationWarning>
                                            {tx.type} - {Math.abs(tx.amount)} credits -{" "}
                                            {mounted ? format(new Date(tx.created_at), "PPp") : tx.created_at}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {selectedTransaction && (
                            <p className="text-xs text-gray-500 mt-1">
                                Amount: {Math.abs(selectedTransaction.amount)} credits
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="reason">Reason *</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Service issue, customer request"
                            rows={3}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !selectedTransactionId || transactions.length === 0}
                        >
                            {isLoading ? "Processing..." : "Refund"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

