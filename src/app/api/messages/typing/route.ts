import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// In-memory store for typing status (in production, use Redis)
// Map<conversationKey, { userId: string, timestamp: number }>
const typingStore = new Map<string, { userId: string; userName: string; timestamp: number }>();

// Clean up old entries every minute
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of typingStore.entries()) {
        if (now - value.timestamp > 5000) {
            typingStore.delete(key);
        }
    }
}, 60000);

// POST - Update typing status
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { otherUserId, isTyping } = body;

        if (!otherUserId) {
            return NextResponse.json({ error: "Missing otherUserId" }, { status: 400 });
        }

        // Create a unique key for the conversation (sorted user IDs)
        const conversationKey = [session.user.id, otherUserId].sort().join("-");
        const userKey = `${conversationKey}:${session.user.id}`;

        if (isTyping) {
            typingStore.set(userKey, {
                userId: session.user.id,
                userName: session.user.name || "Someone",
                timestamp: Date.now(),
            });
        } else {
            typingStore.delete(userKey);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating typing status:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET - Check if other user is typing
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const otherUserId = searchParams.get("otherUserId");

        if (!otherUserId) {
            return NextResponse.json({ error: "Missing otherUserId" }, { status: 400 });
        }

        // Create a unique key for the conversation
        const conversationKey = [session.user.id, otherUserId].sort().join("-");
        const otherUserKey = `${conversationKey}:${otherUserId}`;

        const typingData = typingStore.get(otherUserKey);
        const now = Date.now();

        // Check if typing status is still valid (within 5 seconds)
        if (typingData && now - typingData.timestamp < 5000) {
            return NextResponse.json({
                isTyping: true,
                userName: typingData.userName,
            });
        }

        return NextResponse.json({ isTyping: false });
    } catch (error) {
        console.error("Error checking typing status:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
