import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Create a new group conversation
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, memberIds } = body;

        if (!name || !memberIds || !Array.isArray(memberIds) || memberIds.length < 1) {
            return NextResponse.json(
                { error: "Group name and at least one member required" },
                { status: 400 }
            );
        }

        // Include the current user in members
        const allMemberIds = [...new Set([session.user.id, ...memberIds])];

        // Create the group conversation
        const conversation = await prisma.conversation.create({
            data: {
                isGroup: true,
                name,
                members: {
                    create: allMemberIds.map(userId => ({
                        userId,
                    })),
                },
            },
            include: {
                members: {
                    include: {
                        // We can't include User here directly since userId is just a string
                        // We'll fetch user details separately
                    },
                },
            },
        });

        // Fetch member details
        const members = await prisma.user.findMany({
            where: { id: { in: allMemberIds } },
            select: { id: true, firstName: true, lastName: true },
        });

        return NextResponse.json({
            ...conversation,
            memberDetails: members,
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating group:", error);
        return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
    }
}

// GET - Get all group conversations for current user
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const groups = await prisma.conversation.findMany({
            where: {
                isGroup: true,
                members: {
                    some: { userId: session.user.id },
                },
            },
            include: {
                members: true,
                messages: {
                    take: 1,
                    orderBy: { createdAt: "desc" },
                    include: {
                        sender: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
            },
            orderBy: { updatedAt: "desc" },
        });

        // Enhance with member details and unread count
        const enhancedGroups = await Promise.all(
            groups.map(async (group) => {
                const memberDetails = await prisma.user.findMany({
                    where: { id: { in: group.members.map(m => m.userId) } },
                    select: { id: true, firstName: true, lastName: true },
                });

                const unreadCount = await prisma.message.count({
                    where: {
                        conversationId: group.id,
                        isRead: false,
                        senderId: { not: session.user.id },
                    },
                });

                return {
                    ...group,
                    memberDetails,
                    unreadCount,
                    lastMessage: group.messages[0] || null,
                };
            })
        );

        return NextResponse.json(enhancedGroups);
    } catch (error) {
        console.error("Error fetching groups:", error);
        return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
    }
}
