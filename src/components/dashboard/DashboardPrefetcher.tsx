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
    useSWR(shouldFetch ? "/api/tasks" : null, fetcher, {
        revalidateOnFocus: false, // Don't aggressive refetch
        focusThrottleInterval: 300000, // 5 mins
        dedupingInterval: 60000, // 1 min dedupe
    });

    useSWR(shouldFetch ? "/api/credentials" : null, fetcher, {
        revalidateOnFocus: false,
        focusThrottleInterval: 300000,
        dedupingInterval: 60000,
    });

    useSWR(shouldFetch ? "/api/conversations" : null, fetcher, {
        revalidateOnFocus: false,
        focusThrottleInterval: 300000,
        dedupingInterval: 60000,
    });

    // Phase 2: Other Data (Directory, Attendance, Leaves, Announcements)
    useSWR(shouldFetch ? "/api/users" : null, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    useSWR(shouldFetch ? "/api/attendance" : null, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    useSWR(shouldFetch ? "/api/leaves" : null, fetcher, {
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
