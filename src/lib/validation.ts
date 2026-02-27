/**
 * Input validation utilities for API routes.
 * Prevents excessively long strings, invalid enums, and basic XSS.
 */

/** Validate string length and optionally trim */
export function validateString(
    value: unknown,
    fieldName: string,
    options: { minLength?: number; maxLength?: number; required?: boolean } = {}
): { valid: true; value: string } | { valid: false; error: string } {
    const { minLength = 0, maxLength = 5000, required = false } = options;

    if (value === undefined || value === null || value === "") {
        if (required) return { valid: false, error: `${fieldName} is required` };
        return { valid: true, value: "" };
    }

    if (typeof value !== "string") {
        return { valid: false, error: `${fieldName} must be a string` };
    }

    const trimmed = value.trim();

    if (required && trimmed.length === 0) {
        return { valid: false, error: `${fieldName} is required` };
    }

    if (trimmed.length < minLength) {
        return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
    }

    if (trimmed.length > maxLength) {
        return { valid: false, error: `${fieldName} must be at most ${maxLength} characters` };
    }

    return { valid: true, value: trimmed };
}

/** Validate value is one of the allowed enum values */
export function validateEnum<T extends string>(
    value: unknown,
    fieldName: string,
    allowedValues: T[],
    options: { required?: boolean } = {}
): { valid: true; value: T } | { valid: false; error: string } {
    const { required = false } = options;

    if (value === undefined || value === null || value === "") {
        if (required) return { valid: false, error: `${fieldName} is required` };
        return { valid: true, value: allowedValues[0] };
    }

    if (typeof value !== "string" || !allowedValues.includes(value as T)) {
        return { valid: false, error: `${fieldName} must be one of: ${allowedValues.join(", ")}` };
    }

    return { valid: true, value: value as T };
}

/** Validate a positive number */
export function validateNumber(
    value: unknown,
    fieldName: string,
    options: { min?: number; max?: number; required?: boolean } = {}
): { valid: true; value: number } | { valid: false; error: string } {
    const { min = 0, max = Number.MAX_SAFE_INTEGER, required = false } = options;

    if (value === undefined || value === null) {
        if (required) return { valid: false, error: `${fieldName} is required` };
        return { valid: true, value: 0 };
    }

    const num = typeof value === "string" ? parseFloat(value) : value;

    if (typeof num !== "number" || isNaN(num)) {
        return { valid: false, error: `${fieldName} must be a number` };
    }

    if (num < min || num > max) {
        return { valid: false, error: `${fieldName} must be between ${min} and ${max}` };
    }

    return { valid: true, value: num };
}

/** Strip dangerous HTML/script tags from user input */
export function sanitizeHtml(input: string): string {
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
        .replace(/javascript:/gi, "");
}

/** Validate password complexity */
export function validatePassword(password: string): { valid: boolean; error?: string } {
    if (password.length < 8) {
        return { valid: false, error: "Password must be at least 8 characters" };
    }
    if (password.length > 128) {
        return { valid: false, error: "Password must be at most 128 characters" };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, error: "Password must contain at least one uppercase letter" };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, error: "Password must contain at least one lowercase letter" };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, error: "Password must contain at least one number" };
    }
    return { valid: true };
}
