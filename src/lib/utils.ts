import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Attempt to use standard implementation if modules exist, mostly for type compatibility if added later.
// However, since dependencies are missing, I will provide a fallback implementation.

export function cn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(" ");
}
