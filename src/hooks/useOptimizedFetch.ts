"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseFetchOptions<T> {
    initialData?: T;
    revalidateOnFocus?: boolean;
    revalidateInterval?: number; // ms
    dedupe?: boolean;
}

// Optimized data fetching hook with caching and deduplication
export function useFetch<T>(
    url: string | null,
    options: UseFetchOptions<T> = {}
) {
    const {
        initialData,
        revalidateOnFocus = false,
        revalidateInterval,
        dedupe = true,
    } = options;

    const [data, setData] = useState<T | undefined>(initialData);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState(!initialData);
    const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());

    const fetchData = useCallback(async () => {
        if (!url) return;

        // Check cache (5 second TTL)
        const cached = cacheRef.current.get(url);
        if (dedupe && cached && Date.now() - cached.timestamp < 5000) {
            setData(cached.data);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();

            cacheRef.current.set(url, { data: json, timestamp: Date.now() });
            setData(json);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Fetch failed"));
        } finally {
            setIsLoading(false);
        }
    }, [url, dedupe]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Revalidate on focus
    useEffect(() => {
        if (!revalidateOnFocus) return;
        const handleFocus = () => fetchData();
        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, [revalidateOnFocus, fetchData]);

    // Revalidate on interval
    useEffect(() => {
        if (!revalidateInterval) return;
        const interval = setInterval(fetchData, revalidateInterval);
        return () => clearInterval(interval);
    }, [revalidateInterval, fetchData]);

    return { data, error, isLoading, refetch: fetchData };
}

// Optimistic update hook
export function useOptimisticUpdate<T>(
    initialData: T,
    updateFn: (data: T) => Promise<T>
) {
    const [data, setData] = useState(initialData);
    const [isUpdating, setIsUpdating] = useState(false);

    const update = useCallback(async (newData: T) => {
        const previousData = data;
        setData(newData); // Optimistic update
        setIsUpdating(true);

        try {
            const result = await updateFn(newData);
            setData(result);
        } catch (error) {
            setData(previousData); // Rollback
            throw error;
        } finally {
            setIsUpdating(false);
        }
    }, [data, updateFn]);

    return { data, update, isUpdating };
}

// Intersection observer hook for lazy loading
export function useInView(options?: IntersectionObserverInit) {
    const [isInView, setIsInView] = useState(false);
    const [ref, setRef] = useState<Element | null>(null);

    useEffect(() => {
        if (!ref) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsInView(entry.isIntersecting);
        }, options);

        observer.observe(ref);
        return () => observer.disconnect();
    }, [ref, options]);

    return { ref: setRef, isInView };
}
