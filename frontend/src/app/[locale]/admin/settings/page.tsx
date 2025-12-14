"use client";

import { PaymentSettings } from "@/components/admin/PaymentSettings";

export default function SettingsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">System Settings</h2>
                <p className="text-gray-500 mt-2">Manage global system configurations and integrations.</p>
            </div>

            <PaymentSettings />
        </div>
    );
}
