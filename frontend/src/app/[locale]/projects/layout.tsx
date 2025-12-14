"use client";

import LeftNav from "../home/components/LeftNav";
import Header from "../home/components/Header";

export default function ProjectsLayout({
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
