"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Plan {
    id: string;
    name: string;
    description: string;
    price_monthly: number;
    price_yearly: number;
    credits_monthly: number;
    features: string[];
    is_active: boolean;
    is_popular: boolean;
    tier_level: number;
}

export default function PlansAdminPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const { toast } = useToast();

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/plans?active_only=false");
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

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this plan?")) return;
        try {
            const res = await fetch(`/api/plans/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast({ title: "Plan deleted" });
                fetchPlans();
            } else {
                throw new Error("Failed to delete");
            }
        } catch (error) {
            toast({ title: "Error deleting plan", variant: "destructive" });
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Subscription Plans</h1>
                <Button onClick={() => { setEditingPlan(null); setIsDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Plan
                </Button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Price (Mo/Yr)</TableHead>
                            <TableHead>Credits</TableHead>
                            <TableHead>Tier</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : plans.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    No plans found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            plans.map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell className="font-medium">
                                        {plan.name}
                                        {plan.is_popular && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Popular</span>}
                                    </TableCell>
                                    <TableCell>${plan.price_monthly} / ${plan.price_yearly}</TableCell>
                                    <TableCell>{plan.credits_monthly.toLocaleString()}</TableCell>
                                    <TableCell>{plan.tier_level}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {plan.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => { setEditingPlan(plan); setIsDialogOpen(true); }}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(plan.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <PlanDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                plan={editingPlan}
                onSuccess={() => { setIsDialogOpen(false); fetchPlans(); }}
            />
        </div>
    );
}

function PlanDialog({ open, onOpenChange, plan, onSuccess }: { open: boolean; onOpenChange: (open: boolean) => void; plan: Plan | null; onSuccess: () => void }) {
    const [formData, setFormData] = useState<Partial<Plan>>({
        name: "",
        description: "",
        price_monthly: 0,
        price_yearly: 0,
        credits_monthly: 0,
        features: [],
        is_active: true,
        is_popular: false,
        tier_level: 0
    });
    const [featuresText, setFeaturesText] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (plan) {
            setFormData(plan);
            setFeaturesText(plan.features.join("\n"));
        } else {
            setFormData({
                name: "",
                description: "",
                price_monthly: 0,
                price_yearly: 0,
                credits_monthly: 0,
                features: [],
                is_active: true,
                is_popular: false,
                tier_level: 0
            });
            setFeaturesText("");
        }
    }, [plan, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
            features: featuresText.split("\n").filter(f => f.trim() !== "")
        };

        try {
            const url = plan ? `/api/plans/${plan.id}` : "/api/plans";
            const method = plan ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast({ title: `Plan ${plan ? 'updated' : 'created'} successfully` });
                onSuccess();
            } else {
                throw new Error("Failed to save plan");
            }
        } catch (error) {
            toast({ title: "Error saving plan", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{plan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Tier Level</Label>
                            <Input type="number" value={formData.tier_level} onChange={e => setFormData({ ...formData, tier_level: parseInt(e.target.value) })} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Monthly Price ($)</Label>
                            <Input type="number" step="0.01" value={formData.price_monthly} onChange={e => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) })} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Yearly Price ($)</Label>
                            <Input type="number" step="0.01" value={formData.price_yearly} onChange={e => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) })} required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Monthly Credits</Label>
                        <Input type="number" value={formData.credits_monthly} onChange={e => setFormData({ ...formData, credits_monthly: parseInt(e.target.value) })} required />
                    </div>

                    <div className="space-y-2">
                        <Label>Features (one per line)</Label>
                        <Textarea
                            value={featuresText}
                            onChange={e => setFeaturesText(e.target.value)}
                            rows={5}
                            placeholder="Access to all models&#10;Commercial use&#10;..."
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
                            />
                            <Label>Active</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.is_popular}
                                onCheckedChange={checked => setFormData({ ...formData, is_popular: checked })}
                            />
                            <Label>Popular Badge</Label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Plan
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
