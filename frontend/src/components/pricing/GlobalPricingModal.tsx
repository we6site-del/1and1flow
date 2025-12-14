"use client";

import { usePricingModal } from "@/hooks/usePricingModal";
import PricingModal from "./PricingModal";
import { useAppUser } from "@/hooks/useAppUser";

export function GlobalPricingModal() {
    const { isOpen, onClose, onOpen } = usePricingModal();
    const { user } = useAppUser();

    return (
        <PricingModal
            open={isOpen}
            onOpenChange={(open) => open ? onOpen() : onClose()}
            userId={user?.id}
        />
    );
}
