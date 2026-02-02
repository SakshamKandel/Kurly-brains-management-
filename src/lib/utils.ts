// Utility for merging class names
export function cn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(" ");
}
