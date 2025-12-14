"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Ban, Shield } from "lucide-react";

interface BanUserModalProps {
    userId: string;
    isBanned: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function BanUserModal({ userId, isBanned, onClose, onSuccess }: BanUserModalProps) {
    const [reason, setReason] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

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

            const response = await fetch("/api/admin/users/ban", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: userId,
                    banned: !isBanned,
                    reason: reason.trim(),
                    admin_id: user.id,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || "Failed to update user status");
            }

            toast.success(`User ${!isBanned ? "banned" : "unbanned"} successfully`);
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Failed to update user status");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isBanned ? (
                            <>
                                <Shield className="w-5 h-5" />
                                Unban User
                            </>
                        ) : (
                            <>
                                <Ban className="w-5 h-5" />
                                Ban User
                            </>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            {isBanned
                                ? "This will restore the user's access to the platform."
                                : "This will immediately revoke the user's access to the platform. They will not be able to log in or use any features."}
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="reason">Reason *</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={
                                isBanned
                                    ? "e.g., Issue resolved, user appeal approved"
                                    : "e.g., Terms of service violation, spam, abuse"
                            }
                            rows={4}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            variant={isBanned ? "default" : "destructive"}
                        >
                            {isLoading
                                ? "Processing..."
                                : isBanned
                                    ? "Unban User"
                                    : "Ban User"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}








