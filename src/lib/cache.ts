import { unstable_cache } from "next/cache";

// Cache configuration for different data types
export const CACHE_TAGS = {
    USERS: "users",
    TASKS: "tasks",
    MESSAGES: "messages",
    NOTIFICATIONS: "notifications",
    STATS: "stats",
    LEAVES: "leaves",
    ATTENDANCE: "attendance",
    ANNOUNCEMENTS: "announcements",
} as const;

// Cache durations in seconds
export const CACHE_DURATIONS = {
    SHORT: 30,       // 30 seconds - for rapidly changing data
    MEDIUM: 60 * 2,  // 2 minutes - for moderately changing data
    LONG: 60 * 5,    // 5 minutes - for stable data
    STATIC: 60 * 15, // 15 minutes - for rarely changing data
} as const;

// Revalidation helper - call after mutations
export async function revalidateCache(tags: string[]) {
    const { revalidateTag } = await import("next/cache");
    for (const tag of tags) {
        revalidateTag(tag);
    }
}

// Memory cache for frequently accessed data (client-side)
const memoryCache = new Map<string, { data: any; expiry: number }>();

export function getFromMemoryCache<T>(key: string): T | null {
    const cached = memoryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
        return cached.data as T;
    }
    memoryCache.delete(key);
    return null;
}

export function setMemoryCache(key: string, data: any, ttlSeconds: number) {
    memoryCache.set(key, {
        data,
        expiry: Date.now() + ttlSeconds * 1000,
    });
}

// Debounce utility for reducing API calls
export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

// Throttle utility for rate limiting
export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

// Request deduplication - prevents duplicate concurrent requests
const pendingRequests = new Map<string, Promise<any>>();

export async function deduplicatedFetch<T>(
    key: string,
    fetchFn: () => Promise<T>
): Promise<T> {
    const pending = pendingRequests.get(key);
    if (pending) return pending;

    const promise = fetchFn().finally(() => {
        pendingRequests.delete(key);
    });

    pendingRequests.set(key, promise);
    return promise;
}
