"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface SettingsState {
    payment_methods: string[];
}

interface ConfigState {
    alipay: { appId: string; privateKey: string; publicKey: string };
    wechat: { appId: string; mchId: string; key: string };
}

export function PaymentSettings() {
    const [settings, setSettings] = useState<SettingsState>({ payment_methods: ["card"] });
    const [config, setConfig] = useState<ConfigState>({
        alipay: { appId: "", privateKey: "", publicKey: "" },
        wechat: { appId: "", mchId: "", key: "" }
    });
    const [showConfig, setShowConfig] = useState<{ alipay: boolean; wechat: boolean }>({ alipay: false, wechat: false });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const { toast } = useToast();
    const supabase = createClient();
    const [adminId, setAdminId] = useState<string>("");

    useEffect(() => {
        // Fetch Admin ID for API calls
        async function getAdmin() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setAdminId(user.id);
        }
        getAdmin();

        // Fetch current settings
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/admin/settings");
            const data = await res.json();
            if (data.status === "success" && data.settings) {
                // Parse if it came as string, though backend sends dict
                let methods = data.settings.payment_methods;
                if (typeof methods === "string") {
                    try { methods = JSON.parse(methods); } catch { }
                }

                // Parse configs
                const alipayConfig = data.settings.payment_alipay_config || { appId: "", privateKey: "", publicKey: "" };
                const wechatConfig = data.settings.payment_wechat_config || { appId: "", mchId: "", key: "" };

                setSettings({ payment_methods: Array.isArray(methods) ? methods : ["card"] });
                setConfig({ alipay: alipayConfig, wechat: wechatConfig });
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load settings" });
        } finally {
            setLoading(false);
        }
    };

    const toggleMethod = async (method: string, checked: boolean) => {
        if (!adminId) return;
        setUpdating(true);

        const currentMethods = new Set(settings.payment_methods);
        if (checked) {
            currentMethods.add(method);
        } else {
            currentMethods.delete(method);
        }

        const newMethods = Array.from(currentMethods);

        // Optimistic update
        setSettings(prev => ({ ...prev, payment_methods: newMethods }));

        try {
            await saveSetting("payment_methods", newMethods);
            toast({ title: "Success", description: "Methods updated" });
        } catch (error) {
            console.error("Failed to update", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to save settings" });
            fetchSettings(); // Revert
        } finally {
            setUpdating(false);
        }
    };

    const saveConfig = async (type: "alipay" | "wechat") => {
        if (!adminId) return;
        setUpdating(true);
        try {
            const key = type === "alipay" ? "payment_alipay_config" : "payment_wechat_config";
            const value = config[type];
            await saveSetting(key, value);
            toast({ title: "Saved", description: `${type === "alipay" ? "Alipay" : "WeChat"} configuration saved.` });
        } catch (error) {
            console.error("Failed to save config", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to save config" });
        } finally {
            setUpdating(false);
        }
    };

    const saveSetting = async (key: string, value: any) => {
        const res = await fetch("/api/admin/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                key,
                value,
                description: "Updated via Admin UI",
                admin_id: adminId
            })
        });
        const data = await res.json();
        if (data.status !== "success") throw new Error(data.message);
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>
                        Enable/disable payment methods and configure merchant credentials.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">

                    {/* Credit Card */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="method-card" className="font-medium">Credit Card</Label>
                            <span className="text-sm text-gray-500">Stripe Standard Processing</span>
                        </div>
                        <Switch
                            id="method-card"
                            checked={settings.payment_methods.includes("card")}
                            onCheckedChange={(checked) => toggleMethod("card", checked)}
                            disabled={updating}
                        />
                    </div>

                    <hr className="border-gray-100" />

                    {/* Alipay */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="method-alipay" className="font-medium">Alipay (支付宝)</Label>
                                <span className="text-sm text-gray-500">Direct integration or via Stripe</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowConfig(p => ({ ...p, alipay: !p.alipay }))}
                                >
                                    {showConfig.alipay ? "Hide Config" : "Configure"}
                                </Button>
                                <Switch
                                    id="method-alipay"
                                    checked={settings.payment_methods.includes("alipay")}
                                    onCheckedChange={(checked) => toggleMethod("alipay", checked)}
                                    disabled={updating}
                                />
                            </div>
                        </div>

                        {showConfig.alipay && (
                            <div className="bg-gray-50 p-4 rounded-lg space-y-4 border border-gray-100 animate-in fade-in slide-in-from-top-2">
                                <h4 className="font-medium text-sm text-gray-900">Alipay Merchant Config</h4>
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label>App ID</Label>
                                        <Input
                                            value={config.alipay.appId}
                                            onChange={e => setConfig(p => ({ ...p, alipay: { ...p.alipay, appId: e.target.value } }))}
                                            placeholder="2021000..."
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>App Private Key</Label>
                                        <Textarea
                                            value={config.alipay.privateKey}
                                            onChange={e => setConfig(p => ({ ...p, alipay: { ...p.alipay, privateKey: e.target.value } }))}
                                            placeholder="MIIEvAIBADANBgkqhkiG..."
                                            className="font-mono text-xs h-20"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Alipay Public Key</Label>
                                        <Textarea
                                            value={config.alipay.publicKey}
                                            onChange={e => setConfig(p => ({ ...p, alipay: { ...p.alipay, publicKey: e.target.value } }))}
                                            placeholder="MIIBIjANBgkqhkiG..."
                                            className="font-mono text-xs h-20"
                                        />
                                    </div>
                                    <Button size="sm" onClick={() => saveConfig("alipay")} disabled={updating}>Save Alipay Config</Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <hr className="border-gray-100" />

                    {/* WeChat Pay */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="method-wechat" className="font-medium">WeChat Pay (微信支付)</Label>
                                <span className="text-sm text-gray-500">Direct integration or via Stripe</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowConfig(p => ({ ...p, wechat: !p.wechat }))}
                                >
                                    {showConfig.wechat ? "Hide Config" : "Configure"}
                                </Button>
                                <Switch
                                    id="method-wechat"
                                    checked={settings.payment_methods.includes("wechat_pay")}
                                    onCheckedChange={(checked) => toggleMethod("wechat_pay", checked)}
                                    disabled={updating}
                                />
                            </div>
                        </div>

                        {showConfig.wechat && (
                            <div className="bg-gray-50 p-4 rounded-lg space-y-4 border border-gray-100 animate-in fade-in slide-in-from-top-2">
                                <h4 className="font-medium text-sm text-gray-900">WeChat Pay Merchant Config</h4>
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label>App ID</Label>
                                        <Input
                                            value={config.wechat.appId}
                                            onChange={e => setConfig(p => ({ ...p, wechat: { ...p.wechat, appId: e.target.value } }))}
                                            placeholder="wx888..."
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Merchant ID (MchId)</Label>
                                        <Input
                                            value={config.wechat.mchId}
                                            onChange={e => setConfig(p => ({ ...p, wechat: { ...p.wechat, mchId: e.target.value } }))}
                                            placeholder="190000..."
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>API Key (v3)</Label>
                                        <Input
                                            value={config.wechat.key}
                                            onChange={e => setConfig(p => ({ ...p, wechat: { ...p.wechat, key: e.target.value } }))}
                                            type="password"
                                            placeholder="Your 32-char API Key"
                                        />
                                    </div>
                                    <Button size="sm" onClick={() => saveConfig("wechat")} disabled={updating}>Save WeChat Config</Button>
                                </div>
                            </div>
                        )}
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
