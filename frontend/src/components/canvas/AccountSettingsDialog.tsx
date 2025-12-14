"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User, Settings, CreditCard, LogOut, Camera, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AccountSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function AccountSettingsDialog({ open, onOpenChange }: AccountSettingsDialogProps) {
    const [activeTab, setActiveTab] = useState<"account" | "usage" | "billing">("account");
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();
    const router = useRouter();
    const t = useTranslations('AccountSettings');

    // User data
    const [authUser, setAuthUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [credits, setCredits] = useState<number>(0);
    const [editForm, setEditForm] = useState({
        username: "",
        bio: "",
        avatarUrl: ""
    });

    // Fetch user data
    useEffect(() => {
        if (open) {
            fetchUserData();
        }
    }, [open]);

    const fetchUserData = async () => {
        setIsLoading(true);
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) return;

            setAuthUser(user);

            // Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error("Profile fetch error:", profileError);
            }

            if (profileData) {
                setProfile(profileData);
                setCredits(profileData.credits || 0);
                setEditForm({
                    username: profileData.username || user.user_metadata?.full_name || user.email?.split('@')[0] || "",
                    bio: profileData.bio || "",
                    avatarUrl: profileData.avatar_url || user.user_metadata?.avatar_url || ""
                });
            } else {
                // Set defaults if no profile
                setEditForm({
                    username: user.user_metadata?.full_name || user.email?.split('@')[0] || "",
                    bio: "",
                    avatarUrl: user.user_metadata?.avatar_url || ""
                });
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            toast.error("Failed to load user data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size must be less than 5MB");
            return;
        }

        setUploadingAvatar(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            // Upload to R2 via backend API
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`/api/upload/avatar`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(errorData.detail || `Upload failed: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.url) {
                setEditForm({ ...editForm, avatarUrl: data.url });
                toast.success("Avatar uploaded successfully to R2");
            } else {
                throw new Error("No URL returned from server");
            }
        } catch (error: any) {
            console.error("Avatar upload error:", error);

            // Fallback: use base64 if R2 upload fails
            try {
                toast.warning("R2 upload failed, using data URL as fallback");
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result as string;
                    setEditForm({ ...editForm, avatarUrl: base64String });
                    toast.success("Avatar loaded (using data URL)");
                    setUploadingAvatar(false);
                };
                reader.onerror = () => {
                    toast.error("Failed to upload avatar: " + (error.message || "Unknown error"));
                    setUploadingAvatar(false);
                };
                reader.readAsDataURL(file);
                return;
            } catch (fallbackError) {
                toast.error("Failed to upload avatar: " + (error.message || "Unknown error"));
            }
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSave = async () => {
        if (!editForm.username.trim()) {
            toast.error("Username is required");
            return;
        }

        if (editForm.username.length > 40) {
            toast.error("Username must be 40 characters or less");
            return;
        }

        if (editForm.bio.length > 200) {
            toast.error("Bio must be 200 characters or less");
            return;
        }

        // Validate username format (letters, numbers, and -)
        const usernameRegex = /^[a-zA-Z0-9-]+$/;
        if (!usernameRegex.test(editForm.username)) {
            toast.error("Username can only contain letters, numbers, and hyphens");
            return;
        }

        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            // Check if profile exists first
            const { data: existingProfile, error: checkError } = await supabase
                .from("profiles")
                .select("id")
                .eq("id", user.id)
                .single();

            let updateError;

            if (existingProfile) {
                // Profile exists, use UPDATE
                const { error } = await supabase
                    .from("profiles")
                    .update({
                        username: editForm.username.trim(),
                        bio: editForm.bio.trim(),
                        avatar_url: editForm.avatarUrl || null,
                        email: user.email
                    })
                    .eq("id", user.id);
                updateError = error;
            } else {
                // Profile doesn't exist, use INSERT
                const { error } = await supabase
                    .from("profiles")
                    .insert({
                        id: user.id,
                        username: editForm.username.trim(),
                        bio: editForm.bio.trim(),
                        avatar_url: editForm.avatarUrl || null,
                        email: user.email,
                        credits: 100, // Default credits
                        is_pro: false
                    });
                updateError = error;
            }

            if (updateError) {
                console.error("Profile update/insert error:", updateError);
                // Format error message better
                const errorMessage = updateError.message ||
                    updateError.details ||
                    JSON.stringify(updateError) ||
                    "Failed to save profile";
                throw new Error(errorMessage);
            }

            // Update auth user metadata
            const { error: metadataError } = await supabase.auth.updateUser({
                data: {
                    full_name: editForm.username.trim(),
                    avatar_url: editForm.avatarUrl || null
                }
            });

            if (metadataError) {
                console.warn("Metadata update error:", metadataError);
                // Don't fail the whole operation if metadata update fails
            }

            toast.success("Profile updated successfully");
            setIsEditingProfile(false);
            fetchUserData(); // Refresh data
            router.refresh(); // Refresh the page to update all components
        } catch (error: any) {
            console.error("Save error:", error);
            // Better error message handling
            let errorMessage = "Failed to save profile";
            if (error?.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else if (error) {
                errorMessage = JSON.stringify(error);
            }
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    const usageData = [
        { id: 1, date: "2025-10-23 08:47:12", type: "Daily Bonus Credits Expired", amount: -100, status: "已消耗" },
        { id: 2, date: "2025-10-21 08:10:13", type: "Daily Bonus Credits Expired", amount: -100, status: "已消耗" },
        { id: 3, date: "2025-10-21 08:10:13", type: "Daily Login Bonus", amount: +100, status: "已获取" },
        { id: 4, date: "2025-10-20 10:52:24", type: "Daily Bonus Credits Expired", amount: -100, status: "已消耗" },
        { id: 5, date: "2025-10-20 10:52:24", type: "Daily Login Bonus", amount: +100, status: "已获取" },
        { id: 6, date: "2025-10-19 14:23:02", type: "Daily Login Bonus", amount: +100, status: "已获取" },
        { id: 7, date: "2025-10-18 23:28:17", type: "按照以上的内容出一组效果图", amount: -100, status: "已消耗" },
        { id: 8, date: "2025-10-18 22:56:41", type: "Daily Login Bonus", amount: +100, status: "已获取" },
    ];

    const displayName = profile?.username || authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || "User";
    const displayEmail = authUser?.email || "";
    const displayAvatar = editForm.avatarUrl || profile?.avatar_url || authUser?.user_metadata?.avatar_url || null;
    const displayInitial = displayName[0]?.toUpperCase() || "U";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[900px] h-[600px] p-0 gap-0 overflow-hidden rounded-2xl bg-white">
                <DialogTitle className="sr-only">{t('account')}</DialogTitle>
                {/* Header Tabs */}
                <div className="flex items-center gap-8 px-8 py-6 border-b border-gray-50">
                    <button
                        onClick={() => setActiveTab("account")}
                        className={cn("text-base font-medium transition-colors", activeTab === "account" ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-700")}
                    >
                        {t('account')}
                    </button>
                    <button
                        onClick={() => setActiveTab("usage")}
                        className={cn("text-base font-medium transition-colors", activeTab === "usage" ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-700")}
                    >
                        {t('usage')}
                    </button>
                    <button
                        onClick={() => setActiveTab("billing")}
                        className={cn("text-base font-medium transition-colors", activeTab === "billing" ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-700")}
                    >
                        {t('billing')}
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8">
                    {activeTab === "account" && (
                        <div className="flex flex-col gap-6 max-w-3xl mx-auto">
                            {/* Profile Card */}
                            {isLoading ? (
                                <div className="bg-white rounded-xl p-6 border border-gray-100 flex items-center justify-center shadow-sm">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl p-6 border border-gray-100 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-[#00D2A0] rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-sm relative overflow-hidden">
                                            {displayAvatar ? (
                                                <img src={displayAvatar} alt="avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{displayInitial}</span>
                                            )}
                                            {/* Hexagon overlay effect from screenshot */}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-lg text-gray-900">{displayName}</span>
                                            <span className="text-sm text-gray-500">{displayEmail}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="secondary"
                                            className="bg-gray-800 hover:bg-gray-900 text-white h-9 px-4 text-xs font-medium rounded-lg"
                                            onClick={() => setIsEditingProfile(true)}
                                        >
                                            <Settings className="w-3.5 h-3.5 mr-2" />
                                            {t('editProfile')}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-9 px-4 text-xs font-medium rounded-lg bg-gray-100 border-transparent hover:bg-gray-200 text-gray-600"
                                            onClick={handleSignOut}
                                        >
                                            <LogOut className="w-3.5 h-3.5 mr-2" />
                                            {t('signOut')}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Account Info Card */}
                            <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
                                <h3 className="text-sm font-medium text-gray-500 mb-6">{t('accountInfo')}</h3>
                                <div className="grid grid-cols-[120px_1fr] gap-y-6 text-sm">
                                    <div className="text-gray-400">{t('currentSubscription')}：</div>
                                    <div className="text-gray-900 font-medium">Free</div>

                                    <div className="text-gray-400">{t('availableCredits')}</div>
                                    <div className="text-gray-900 font-medium">{credits}</div>

                                    <div className="text-gray-400 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                        {t('permanentCredits')}
                                    </div>
                                    <div className="text-gray-900">0</div>

                                    <div className="text-gray-400 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                        {t('monthlyCredits')}
                                    </div>
                                    <div className="text-gray-900">0</div>

                                    <div className="text-gray-400 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                        {t('dailyCredits')}
                                    </div>
                                    <div className="text-gray-900">0</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "usage" && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden max-w-4xl mx-auto">
                            <div className="grid grid-cols-[1fr_1fr_1fr_1fr] bg-gray-800 text-white text-xs font-medium py-3 px-6">
                                <div>{t('details')}</div>
                                <div className="text-center">{t('all')} <span className="text-[10px]">▼</span></div>
                                <div>{t('date')}</div>
                                <div className="text-right">{t('creditConsumption')}</div>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {usageData.map((item) => (
                                    <div key={item.id} className="grid grid-cols-[1fr_1fr_1fr_1fr] py-4 px-6 text-xs hover:bg-gray-50 transition-colors">
                                        <div className="text-gray-900 font-medium">{item.type}</div>
                                        <div className="text-center text-gray-500">{item.status}</div>
                                        <div className="text-gray-500">{item.date}</div>
                                        <div className="text-right font-medium text-gray-900">{item.amount > 0 ? `+${item.amount}` : item.amount}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="py-8 text-center text-xs text-gray-300">
                                {t('noMoreData')}
                            </div>
                        </div>
                    )}

                    {activeTab === "billing" && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden max-w-4xl mx-auto min-h-[400px]">
                            <div className="grid grid-cols-[1fr_1fr_1fr_1fr] bg-gray-800 text-white text-xs font-medium py-3 px-6">
                                <div>{t('date')}</div>
                                <div>{t('category')}</div>
                                <div>{t('amount')}</div>
                                <div>{t('status')}</div>
                            </div>
                            <div className="flex flex-col items-center justify-center h-[300px] gap-4">
                                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300">
                                    <CreditCard className="w-8 h-8" />
                                </div>
                                <span className="text-sm text-gray-400">{t('noData')}</span>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>

            {/* Nested Edit Profile Dialog */}
            <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                <DialogContent className="max-w-[400px] p-6 rounded-2xl bg-white">
                    <DialogTitle className="sr-only">{t('editProfile')}</DialogTitle>
                    <div className="flex flex-col items-center gap-6">
                        {/* Avatar Upload */}
                        <div className="relative group">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="hidden"
                            />
                            <div
                                className="relative group cursor-pointer"
                                onClick={handleAvatarClick}
                            >
                                <div className="w-20 h-20 bg-[#00D2A0] rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                                    {editForm.avatarUrl ? (
                                        <img src={editForm.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{editForm.username[0]?.toUpperCase() || displayInitial}</span>
                                    )}
                                </div>
                                {uploadingAvatar ? (
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md">
                                            <Camera className="w-3 h-3 text-gray-600" />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="w-full space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-red-500 flex items-center gap-1">
                                    * {t('username')}
                                </label>
                                <Input
                                    value={editForm.username}
                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                    className="h-10 text-sm"
                                    placeholder="1-40 characters, letters, numbers, and -"
                                    maxLength={40}
                                />
                                <p className="text-[10px] text-gray-400">{t('usernameHint')}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700">
                                    {t('bio')}
                                </label>
                                <Textarea
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    placeholder={t('bioPlaceholder')}
                                    className="min-h-[100px] text-sm resize-none"
                                    maxLength={200}
                                />
                                <p className="text-[10px] text-gray-400 text-right">{editForm.bio.length}/200</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full mt-2">
                            <Button
                                variant="outline"
                                className="flex-1 h-10 rounded-lg border-gray-200 hover:bg-gray-50"
                                onClick={() => {
                                    setIsEditingProfile(false);
                                    // Reset form to original values
                                    if (profile) {
                                        setEditForm({
                                            username: profile.username || authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || "",
                                            bio: profile.bio || "",
                                            avatarUrl: profile.avatar_url || authUser?.user_metadata?.avatar_url || ""
                                        });
                                    }
                                }}
                                disabled={isSaving}
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                                className="flex-1 h-10 rounded-lg bg-black hover:bg-gray-800 text-white"
                                onClick={handleSave}
                                disabled={isSaving || uploadingAvatar}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    t('save')
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
