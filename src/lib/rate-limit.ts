/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach per IP/user.
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 60_000);

interface RateLimitOptions {
    windowMs: number;  // Time window in milliseconds
    maxRequests: number; // Max requests per window
}

/**
 * Check rate limit for a given key (usually IP or userId).
 * Returns { allowed: true } or { allowed: false, retryAfterMs }.
 */
export function checkRateLimit(
    key: string,
    options: RateLimitOptions
): { allowed: boolean; retryAfterMs?: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + options.windowMs });
        return { allowed: true };
    }

    if (entry.count >= options.maxRequests) {
        return { allowed: false, retryAfterMs: entry.resetTime - now };
    }

    entry.count++;
    return { allowed: true };
}

/**
 * Extract client identifier from request for rate limiting.
 * Uses X-Forwarded-For header or falls back to a default key.
 */
export function getClientIp(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp;
    return "unknown-ip";
}
