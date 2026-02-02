import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force git update
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

        const announcement = await prisma.announcement.findUnique({
            where: { id },
        });

        if (!announcement) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Allow deletion if:
        // 1. User is SUPER_ADMIN
        // 2. User is ADMIN
        // 3. User is the author
        const isSuperAdmin = session.user.role === "SUPER_ADMIN";
        const isAdmin = session.user.role === "ADMIN";
        const isAuthor = announcement.authorId === session.user.id;

        if (!isSuperAdmin && !isAdmin && !isAuthor) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.announcement.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting announcement:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
