import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToR2 } from "@/lib/storage";

// Allowed file types
const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "File type not allowed. Allowed types: images, PDF, DOC, TXT" },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 10MB" },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to R2
        try {
            const url = await uploadToR2(buffer, file.name, file.type);

            return NextResponse.json({
                url,
                filename: file.name,
                type: file.type,
                size: file.size,
            });
        } catch (uploadError) {
            console.error("R2 Upload Error:", uploadError);
            // Check if it's a configuration error
            if (!process.env.R2_ACCOUNT_ID || !process.env.R2_BUCKET_NAME) {
                return NextResponse.json(
                    { error: "Storage configuration missing. Please check server logs." },
                    { status: 503 }
                );
            }
            throw uploadError;
        }

    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }
}
