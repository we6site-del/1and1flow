"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export default function AuthCodeError() {
    const t = useTranslations("Auth");
    const router = useRouter();
    const locale = useLocale();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="mx-auto flex w-full flex-col items-center justify-center space-y-6 sm:w-[350px]">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-destructive">
                        Authentication Error
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        There was an issue signing you in. This might be due to a network error or an expired session.
                    </p>
                </div>
                <Button
                    onClick={() => router.push(`/${locale}/login`)}
                    className="w-full"
                >
                    Return to Login
                </Button>
            </div>
        </div>
    );
}
