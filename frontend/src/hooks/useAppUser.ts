import { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";

export function useAppUser() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        let mounted = true;

        const getUser = async () => {
            try {
                const { data: { user: currentUser } } = await supabase.auth.getUser();

                if (!mounted) return;

                setUser(currentUser);

                if (currentUser) {
                    // Poll for profile creation (Trigger latency handling)
                    let profileData = null;
                    const maxRetries = 5;
                    for (let i = 0; i < maxRetries; i++) {
                        const { data } = await supabase
                            .from("profiles")
                            .select("*")
                            .eq("id", currentUser.id)
                            .single();

                        if (data) {
                            profileData = data;
                            break;
                        }
                        // Wait 500ms before retry
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }

                    if (mounted) setProfile(profileData);
                } else {
                    if (mounted) setProfile(null);
                }
            } catch (error) {
                console.error("Error fetching user:", error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", currentUser.id)
                    .single();
                if (mounted) setProfile(profileData);
            } else {
                if (mounted) setProfile(null);
            }
            if (mounted) setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return { user, profile, loading };
}
