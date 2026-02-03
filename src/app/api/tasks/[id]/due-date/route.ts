import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { dueDate } = await request.json();

        const task = await prisma.task.findUnique({ where: { id } });
        if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

        const isAdmin = ["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session.user.role || "");
        if (!isAdmin && task.creatorId !== session.user.id && task.assigneeId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updated = await prisma.task.update({
            where: { id },
            data: {
                dueDate: dueDate ? new Date(dueDate) : null,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating task due date:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
