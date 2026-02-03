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
        const { startDate, endDate } = await request.json();

        const leave = await prisma.leaveRequest.findUnique({ where: { id } });
        if (!leave) return NextResponse.json({ error: "Leave not found" }, { status: 404 });

        const isAdmin = ["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session.user.role || "");
        if (!isAdmin && leave.requesterId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updated = await prisma.leaveRequest.update({
            where: { id },
            data: {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating leave dates:", error);
        return NextResponse.json({ error: "Failed to update leave dates" }, { status: 500 });
    }
}
