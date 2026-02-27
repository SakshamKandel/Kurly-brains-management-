import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
    const key = process.env.CREDENTIALS_ENCRYPTION_KEY;
    if (!key) {
        console.warn("[crypto] CREDENTIALS_ENCRYPTION_KEY not set — storing credentials without encryption");
        return Buffer.alloc(0);
    }
    // Key must be 32 bytes (64 hex chars) for AES-256
    return Buffer.from(key, "hex");
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a combined string: iv:encrypted:authTag (hex-encoded).
 * If no encryption key is configured, returns the plaintext as-is.
 */
export function encrypt(text: string): string {
    const key = getKey();
    if (key.length === 0) return text;

    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${encrypted}:${authTag.toString("hex")}`;
}

/**
 * Decrypt a string that was encrypted with encrypt().
 * If the input doesn't look encrypted (no colons), returns it as-is
 * (handles legacy plaintext values gracefully).
 */
export function decrypt(encryptedText: string): string {
    const key = getKey();
    if (key.length === 0) return encryptedText;

    // Legacy plaintext detection: encrypted strings always have exactly 2 colons
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
        return encryptedText; // Return as-is (legacy plaintext)
    }

    const [ivHex, encrypted, authTagHex] = parts;

    try {
        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");
        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch {
        // If decryption fails, it might be a legacy plaintext value
        return encryptedText;
    }
}
