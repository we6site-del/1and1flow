"use client";

import LeftNav from "./components/LeftNav";
import Header from "./components/Header";

export default function HomeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />
            <div className="flex-1 relative">
                <LeftNav />
                <div className="pl-20">
                    {children}
                </div>
            </div>
        </div>
    );
}
