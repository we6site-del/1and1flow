"use client";

import { useList } from "@refinedev/core";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export const dynamic = "force-dynamic";

export default function GenerationsList() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
    const supabase = createClient();
    const { data: listData, isLoading } = useQuery({
        queryKey: ["generations"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("generations")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return { data: data || [] };
        },
    });

    if (isLoading) return <div>Loading...</div>;

    const generations = listData?.data || [];

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Generations</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {generations.map((gen: any) => (
                            <tr key={gen.id}>
                                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={gen.prompt}>{gen.prompt}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${gen.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {gen.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {gen.result_url && (
                                        <a href={gen.result_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" suppressHydrationWarning>
                                    {mounted ? new Date(gen.created_at).toLocaleString() : gen.created_at}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
