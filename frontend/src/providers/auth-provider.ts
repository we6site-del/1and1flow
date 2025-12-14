"use client";

import { AuthProvider } from "@refinedev/core";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export const authProvider: AuthProvider = {
    login: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return {
                success: false,
                error: {
                    message: "Login failed",
                    name: error.message,
                },
            };
        }

        if (data.session) {
            // Check for admin role if needed, or rely on middleware/RLS
            // For now, allow login, detailed check in `check` or middleware
            return {
                success: true,
                redirectTo: "/admin",
            };
        }

        return {
            success: false,
            error: {
                message: "Login failed",
                name: "Invalid credentials",
            },
        };
    },
    logout: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            return {
                success: false,
                error,
            };
        }
        return {
            success: true,
            redirectTo: "/login",
        };
    },
    onError: async (error) => {
        console.error(error);
        return { error };
    },
    check: async () => {
        const { data } = await supabase.auth.getUser();
        const { user } = data;

        if (user) {
            // Optional: Ensure user is admin
            // const role = user.app_metadata?.role;
            // if (role !== 'admin') {
            //    return { authenticated: false, redirectTo: "/" };
            // }
            return {
                authenticated: true,
            };
        }

        return {
            authenticated: false,
            redirectTo: "/login",
        };
    },
    getPermissions: async () => {
        const { data } = await supabase.auth.getUser();
        return data.user?.app_metadata?.role || "user";
    },
    getIdentity: async () => {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
            return {
                ...data.user,
                name: data.user.email,
            };
        }
        return null;
    },
};
