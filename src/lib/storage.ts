import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g., https://pub-xxx.r2.dev

const S3 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || "",
        secretAccessKey: R2_SECRET_ACCESS_KEY || "",
    },
});

export async function uploadToR2(
    file: Buffer,
    filename: string,
    contentType: string
): Promise<string> {
    if (!R2_BUCKET_NAME) {
        throw new Error("R2_BUCKET_NAME is not defined");
    }

    const uniqueFilename = `${Date.now()}-${filename}`;
    // Sanitize filename to prevent issues with special characters
    const sanitizedKey = uniqueFilename.replace(/[^a-zA-Z0-9.-]/g, "_");

    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: sanitizedKey,
        Body: file,
        ContentType: contentType,
    });

    console.log("Starting R2 Upload...", {
        bucket: R2_BUCKET_NAME,
        key: sanitizedKey,
        size: file.length,
        hasCreds: !!R2_ACCESS_KEY_ID && !!R2_SECRET_ACCESS_KEY
    });

    try {
        await S3.send(command);
        console.log("R2 Upload Successful");

        // If a public URL domain is provided, use it
        if (R2_PUBLIC_URL) {
            return `${R2_PUBLIC_URL}/${sanitizedKey}`;
        }

        // Fallback: If the bucket is public access enabled or if using workers to serve
        // For now, we'll assume the user sets up a public custom domain or R2.dev subdomain
        return `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${sanitizedKey}`;
    } catch (error) {
        console.error("Error uploading to R2:", error);
        throw error;
    }
}
