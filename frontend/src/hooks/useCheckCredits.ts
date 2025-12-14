import { useAppUser } from "@/hooks/useAppUser";
import { usePricingModal } from "@/hooks/usePricingModal";
import { toast } from "sonner";

export function useCheckCredits() {
    const { profile, user, loading } = useAppUser();
    const { onOpen } = usePricingModal();

    const checkCredits = (required: number = 1) => {
        // optimistically allow while loading
        if (loading) return true;

        if (!user) {
            // If not logged in, maybe show login toast or modal? 
            // For now, let backend handle 401, or if you want strict enforcement:
            // toast.error("Please login first");
            // return false;
            return true; // Let backend handle auth
        }

        if (profile && (profile.credits || 0) < required) {
            toast.error("余额不足，请充值", {
                description: "Insufficient balance via Frontend check",
                action: {
                    label: "Upgrade",
                    onClick: () => onOpen()
                }
            });
            onOpen(); // Open modal immediately
            return false;
        }
        return true;
    };

    return { checkCredits, credits: profile?.credits || 0, loading };
}
