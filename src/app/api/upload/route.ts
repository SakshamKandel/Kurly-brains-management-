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

        // Validate file content matches declared type (magic bytes check)
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const header = buffer.slice(0, 4);
        const isValidContent = validateFileContent(header, file.type);
        if (!isValidContent) {
            return NextResponse.json(
                { error: "File content does not match declared type" },
                { status: 400 }
            );
        }

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


function validateFileContent(header: Buffer, mimeType: string): boolean {
    // Check magic bytes for common file types
    const hex = header.toString('hex').toLowerCase();
    
    if (mimeType.startsWith('image/jpeg') && hex.startsWith('ffd8ff')) return true;
    if (mimeType === 'image/png' && hex.startsWith('89504e47')) return true;
    if (mimeType === 'image/gif' && (hex.startsWith('47494638'))) return true;
    if (mimeType === 'image/webp' && header.toString('ascii', 0, 4) === 'RIFF') return true;
    if (mimeType === 'application/pdf' && hex.startsWith('25504446')) return true;
    if (mimeType === 'text/plain') return true; // Text files don't have reliable magic bytes
    // For DOCX (ZIP-based), check PK header
    if (mimeType.includes('word') && hex.startsWith('504b0304')) return true;
    
    return false;
}