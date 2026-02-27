import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE - Delete a group conversation (creator or admin only)
export async function DELETE(
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
            include: {
                members: true,
            },
        });

        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }

        if (!conversation.isGroup) {
            return NextResponse.json({ error: "Cannot delete a direct conversation" }, { status: 400 });
        }

        // Only the first member (creator) or admin/super_admin can delete
        const isCreator = conversation.members[0]?.userId === session.user.id;
        const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role || "");

        if (!isCreator && !isAdmin) {
            return NextResponse.json({ error: "Only the group creator or admin can delete this group" }, { status: 403 });
        }

        // Delete conversation (cascades to members and messages)
        await prisma.conversation.delete({ where: { id } });

        return NextResponse.json({ message: "Group deleted" });
    } catch (error) {
        console.error("Error deleting conversation:", error);
        return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
    }
}
