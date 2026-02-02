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

        // Only managers and admins can approve
        if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role || "")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const { status } = await request.json();

        if (!["APPROVED", "REJECTED"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const leave = await prisma.leaveRequest.update({
            where: { id },
            data: {
                status,
                approverId: session.user.id,
            },
            include: {
                requester: { select: { id: true, firstName: true, lastName: true } },
                approver: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        return NextResponse.json(leave);
    } catch (error) {
        console.error("Error updating leave:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
