import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET all conversations for current user (DM + Groups)
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUserId = session.user.id;

        // Fetch DM conversations (user1Id/user2Id pattern)
        const dmConversations = await prisma.conversation.findMany({
            where: {
                isGroup: false,
                OR: [
                    { user1Id: currentUserId },
                    { user2Id: currentUserId }
                ]
            },
            include: {
                user1: { select: { id: true, firstName: true, lastName: true, avatar: true, lastActive: true } },
                user2: { select: { id: true, firstName: true, lastName: true, avatar: true, lastActive: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Fetch group conversations (ConversationMember pattern)
        const groupConversations = await prisma.conversation.findMany({
            where: {
                isGroup: true,
                members: {
                    some: { userId: currentUserId }
                }
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, avatar: true, lastActive: true } }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Format DM conversations
        const formattedDMs = await Promise.all(
            dmConversations.map(async (conv) => {
                const unreadCount = await prisma.message.count({
                    where: {
                        conversationId: conv.id,
                        receiverId: currentUserId,
                        isRead: false
                    }
                });

                const otherUser = conv.user1Id === currentUserId ? conv.user2 : conv.user1;
                const lastMessage = conv.messages[0] || null;

                return {
                    id: conv.id,
                    isGroup: false,
                    name: conv.name,
                    otherUser,
                    memberDetails: null,
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

        // Format group conversations
        const formattedGroups = await Promise.all(
            groupConversations.map(async (conv) => {
                const unreadCount = await prisma.message.count({
                    where: {
                        conversationId: conv.id,
                        isRead: false,
                        senderId: { not: currentUserId },
                    }
                });

                const lastMessage = conv.messages[0] || null;

                return {
                    id: conv.id,
                    isGroup: true,
                    name: conv.name,
                    otherUser: null,
                    memberDetails: conv.members.map(m => m.user),
                    memberCount: conv.members.length,
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

        // Combine and sort by updatedAt
        const allConversations = [...formattedDMs, ...formattedGroups].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        return NextResponse.json(allConversations);
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
            if (!name || !memberIds || memberIds.length < 1) {
                return NextResponse.json({ error: "Group needs a name and at least 1 other member" }, { status: 400 });
            }

            // Deduplicate and include current user
            const allMemberIds = [...new Set([currentUserId, ...memberIds])];

            const conversation = await prisma.conversation.create({
                data: {
                    name,
                    isGroup: true,
                    members: {
                        create: allMemberIds.map(userId => ({ userId }))
                    }
                },
                include: {
                    members: {
                        include: {
                            user: { select: { id: true, firstName: true, lastName: true, avatar: true } }
                        }
                    }
                }
            });

            return NextResponse.json({
                ...conversation,
                memberDetails: conversation.members.map(m => m.user),
            }, { status: 201 });
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
