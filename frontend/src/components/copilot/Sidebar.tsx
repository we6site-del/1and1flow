"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditor } from "tldraw";
import { createClient } from "@/utils/supabase/client";
import { v4 as uuidv4 } from "uuid";

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const [credits, setCredits] = useState<number | null>(null);
    const [messages, setMessages] = useState<Array<{ id: string, role: string, content: string }>>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const editor = useEditor();
    const supabase = createClient();

    useEffect(() => {
        const fetchCredits = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from("profiles").select("credits").eq("id", user.id).single();
                if (data) setCredits(data.credits);
            }
        };
        fetchCredits();

        // Subscribe to credit updates
        const channel = supabase.channel('credits')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload: any) => {
                setCredits(payload.new.credits);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleBuyCredits = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || typeof window === 'undefined') return;

        try {
            const res = await fetch(`/api/stripe/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user.id,
                    redirect_url: window.location.origin
                })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error("Checkout error:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { id: uuidv4(), role: "user", content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        // Simplified: Just echo back for now
        // In production, this would call your AI API
        setTimeout(() => {
            const assistantMessage = {
                id: uuidv4(),
                role: "assistant",
                content: "AI Copilot 功能正在开发中。目前您可以使用画布上的 AI 节点来生成设计。"
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
        }, 1000);
    };

    if (!isOpen) {
        return (
            <Button
                className="fixed top-4 right-4 z-[1000] rounded-full shadow-lg"
                size="icon"
                onClick={() => setIsOpen(true)}
            >
                <MessageCircle className="w-5 h-5" />
            </Button>
        );
    }

    return (
        <div className="fixed top-0 right-0 h-screen w-[350px] bg-white border-l border-gray-200 shadow-xl z-[1000] flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                    <h2 className="font-semibold text-sm">Fashion Copilot</h2>
                    <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">Senior Designer Agent</p>
                        {credits !== null && (
                            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                {credits} Credits
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleBuyCredits}>
                        Buy
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm mt-10">
                        <p>你好！我是你的设计助手。</p>
                        <p>使用画布上的 AI 节点来生成设计。</p>
                    </div>
                )}
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={cn(
                            "flex w-full",
                            m.role === "user" ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                                m.role === "user"
                                    ? "bg-black text-white"
                                    : "bg-gray-100 text-gray-800"
                            )}
                        >
                            {m.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg px-3 py-2">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 bg-white">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="输入消息..."
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={isLoading}>
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
