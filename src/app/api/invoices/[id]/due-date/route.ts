import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { dueDate } = await request.json();

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true }
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const invoice = await prisma.invoice.findUnique({ where: { id } });
        if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

        const isAdmin = ["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user.role || "");
        if (!isAdmin && invoice.creatorId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updated = await prisma.invoice.update({
            where: { id },
            data: {
                dueDate: dueDate ? new Date(dueDate) : null,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating invoice due date:", error);
        return NextResponse.json({ error: "Failed to update invoice due date" }, { status: 500 });
    }
}
