import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET total unread message count for current user
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUserId = session.user.id;

        const unreadCount = await prisma.message.count({
            where: {
                receiverId: currentUserId,
                isRead: false
            }
        });

        return NextResponse.json({ unreadCount });
    } catch (error) {
        console.error("Error fetching unread count:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
