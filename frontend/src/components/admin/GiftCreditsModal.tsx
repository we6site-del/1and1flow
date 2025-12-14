"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Gift } from "lucide-react";

interface GiftCreditsModalProps {
    userId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function GiftCreditsModal({ userId, onClose, onSuccess }: GiftCreditsModalProps) {
    const [amount, setAmount] = useState<string>("");
    const [reason, setReason] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const amountNum = parseInt(amount);
        if (!amountNum || amountNum <= 0) {
            toast.error("Please enter a valid amount");
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

            const response = await fetch("/api/admin/credits/gift", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: userId,
                    amount: amountNum,
                    reason: reason.trim(),
                    admin_id: user.id,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || "Failed to gift credits");
            }

            toast.success(`Successfully gifted ${amountNum} credits`);
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Failed to gift credits");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Gift className="w-5 h-5" />
                        Gift Credits
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="amount">Amount (credits) *</Label>
                        <Input
                            id="amount"
                            type="number"
                            min="1"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="reason">Reason *</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Customer support compensation"
                            rows={3}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Processing..." : "Gift Credits"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

