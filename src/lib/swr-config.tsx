"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";

interface SWRProviderProps {
    children: React.ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
    return (
        <SWRConfig
            value={{
                fetcher,
                revalidateOnFocus: false, // Don't revalidate on window focus (prevents jarring updates)
                revalidateOnReconnect: true, // Do revalidate when internet comes back
                dedupingInterval: 5000, // Dedupe requests within 5 seconds
                keepPreviousData: true, // Keep old data while fetching (no loading flash)
                shouldRetryOnError: false, // Don't retry infinitely on 404/500
            }}
        >
            {children}
        </SWRConfig>
    );
}
