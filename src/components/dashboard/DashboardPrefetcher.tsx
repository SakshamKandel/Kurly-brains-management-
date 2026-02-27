"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPrefetcher() {
    // We delay prefetching to strictly prioritize the current page's resources
    const [shouldFetch, setShouldFetch] = useState(false);

    useEffect(() => {
        // Wait 0.5 seconds (Aggressive Mode)
        const timer = setTimeout(() => {
            setShouldFetch(true);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    // These hooks will only run when shouldFetch is true
    // We pass null to useSWR when false to disable it
    // 1. Dashboard Data (Critical for "Blink" speed on back navigation)
    useSWR(shouldFetch ? "/api/admin/stats" : null, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    useSWR(shouldFetch ? "/api/tasks?limit=5" : null, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    // 2. Main Sections (Prefetch for instant navigation)
    useSWR(shouldFetch ? "/api/tasks" : null, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    useSWR(shouldFetch ? "/api/credentials" : null, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    useSWR(shouldFetch ? "/api/invoices" : null, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    useSWR(shouldFetch ? "/api/conversations" : null, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    // 3. Secondary Data
    useSWR(shouldFetch ? "/api/users" : null, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    useSWR(shouldFetch ? "/api/announcements" : null, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    // Invisible component
    return null;
}
