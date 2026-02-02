import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET all conversations for current user with last message and unread count
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUserId = session.user.id;

        // Get all conversations where user is either user1 or user2
        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [
                    { user1Id: currentUserId },
                    { user2Id: currentUserId }
                ]
            },
            include: {
                user1: { select: { id: true, firstName: true, lastName: true } },
                user2: { select: { id: true, firstName: true, lastName: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        sender: { select: { id: true, firstName: true, lastName: true } }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Get unread counts for each conversation
        const conversationsWithCounts = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await prisma.message.count({
                    where: {
                        conversationId: conv.id,
                        receiverId: currentUserId,
                        isRead: false
                    }
                });

                // Determine the other user
                const otherUser = conv.user1Id === currentUserId ? conv.user2 : conv.user1;
                const lastMessage = conv.messages[0] || null;

                return {
                    id: conv.id,
                    isGroup: conv.isGroup,
                    name: conv.name,
                    otherUser,
                    lastMessage: lastMessage ? {
                        content: lastMessage.content,
                        createdAt: lastMessage.createdAt,
                        senderId: lastMessage.senderId,
                        senderName: `${lastMessage.sender.firstName} ${lastMessage.sender.lastName}`
                    } : null,
                    unreadCount,
                    updatedAt: conv.updatedAt
                };
            })
        );

        return NextResponse.json(conversationsWithCounts);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create a new conversation (group or direct)
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUserId = session.user.id;
        const body = await request.json();
        const { name, memberIds, isGroup } = body;

        if (isGroup) {
            // Create group conversation
            if (!name || !memberIds || memberIds.length < 2) {
                return NextResponse.json({ error: "Group needs name and at least 2 members" }, { status: 400 });
            }

            const conversation = await prisma.conversation.create({
                data: {
                    name,
                    isGroup: true,
                    members: {
                        create: [
                            { userId: currentUserId },
                            ...memberIds.map((id: string) => ({ userId: id }))
                        ]
                    }
                },
                include: {
                    members: {
                        include: {
                            // Note: ConversationMember doesn't have user relation in schema
                        }
                    }
                }
            });

            return NextResponse.json(conversation, { status: 201 });
        } else {
            // Create direct conversation
            const otherUserId = memberIds?.[0];
            if (!otherUserId) {
                return NextResponse.json({ error: "Missing other user ID" }, { status: 400 });
            }

            // Check if conversation already exists
            const existing = await prisma.conversation.findFirst({
                where: {
                    isGroup: false,
                    OR: [
                        { user1Id: currentUserId, user2Id: otherUserId },
                        { user1Id: otherUserId, user2Id: currentUserId }
                    ]
                }
            });

            if (existing) {
                return NextResponse.json(existing);
            }

            // Create new direct conversation
            const conversation = await prisma.conversation.create({
                data: {
                    isGroup: false,
                    user1Id: currentUserId,
                    user2Id: otherUserId
                }
            });

            return NextResponse.json(conversation, { status: 201 });
        }
    } catch (error) {
        console.error("Error creating conversation:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
