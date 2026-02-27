import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Leave a group conversation
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const conversation = await prisma.conversation.findUnique({
            where: { id },
            include: { members: true },
        });

        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }

        if (!conversation.isGroup) {
            return NextResponse.json({ error: "Cannot leave a direct conversation" }, { status: 400 });
        }

        // Check if user is a member
        const membership = conversation.members.find(m => m.userId === session.user.id);
        if (!membership) {
            return NextResponse.json({ error: "You are not a member of this group" }, { status: 400 });
        }

        // Remove the member
        await prisma.conversationMember.delete({
            where: { id: membership.id },
        });

        // If the group is now empty or has only 1 member, delete it
        const remainingMembers = await prisma.conversationMember.count({
            where: { conversationId: id },
        });

        if (remainingMembers <= 1) {
            await prisma.conversation.delete({ where: { id } });
            return NextResponse.json({ message: "Left group. Group was deleted (too few members)." });
        }

        return NextResponse.json({ message: "Left group successfully" });
    } catch (error) {
        console.error("Error leaving group:", error);
        return NextResponse.json({ error: "Failed to leave group" }, { status: 500 });
    }
}
