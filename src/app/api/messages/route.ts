import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET messages between current user and another user
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUserId = session.user.id;
        const { searchParams } = new URL(request.url);
        const otherUserId = searchParams.get("userId");

        if (!otherUserId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        // Find a direct conversation between these two users using user1Id/user2Id
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                isGroup: false,
                OR: [
                    { user1Id: currentUserId, user2Id: otherUserId },
                    { user1Id: otherUserId, user2Id: currentUserId },
                ],
            },
        });

        if (!existingConversation) {
                return NextResponse.json([]);
        }


        // Get messages from that conversation
        const messages = await prisma.message.findMany({
            where: { conversationId: existingConversation.id },
            select: {
                id: true,
                content: true,
                attachments: true,
                isRead: true,
                createdAt: true,
                senderId: true,
                receiverId: true,
                conversationId: true,
                sender: { select: { id: true, firstName: true, lastName: true } },
                receiver: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Send a new message (auto-creates conversation if needed)
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUserId = session.user.id;
        const body = await request.json();
        const receiverId: string = body.receiverId;
        const content: string = body.content;
        const attachments: string[] = body.attachments || [];

        if (!receiverId || (!content && attachments.length === 0)) {
            return NextResponse.json({ error: "Missing receiverId or content/attachments" }, { status: 400 });
        }

        // Find or create a direct conversation between these users
        let conversation = await prisma.conversation.findFirst({
            where: {
                isGroup: false,
                OR: [
                    { user1Id: currentUserId, user2Id: receiverId },
                    { user1Id: receiverId, user2Id: currentUserId },
                ],
            },
        });

        if (!conversation) {
            // Create new direct conversation
            conversation = await prisma.conversation.create({
                data: {
                    isGroup: false,
                    user1Id: currentUserId,
                    user2Id: receiverId,
                },
            });
        }

        // Create the message
        const message = await prisma.message.create({
            data: {
                content: content || "",
                attachments,
                conversationId: conversation.id,
                senderId: currentUserId,
                receiverId: receiverId,
            },
            include: {
                sender: { select: { id: true, firstName: true, lastName: true } },
                receiver: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
        });

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
