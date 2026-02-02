import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const isAdmin = session.user.role === "ADMIN" || session.user.role === "MANAGER" || session.user.role === "SUPER_ADMIN";

        const leaves = await prisma.leaveRequest.findMany({
            where: {
                ...(!isAdmin && { requesterId: session.user.id }),
                ...(status && status !== "all" && { status: status as "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" }),
            },
            include: {
                requester: { select: { id: true, firstName: true, lastName: true } },
                approver: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(leaves);
    } catch (error) {
        console.error("Error fetching leaves:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { type, startDate, endDate, reason } = await request.json();

        if (!type || !startDate || !endDate || !reason) {
            return NextResponse.json({ error: "All fields required" }, { status: 400 });
        }

        const leave = await prisma.leaveRequest.create({
            data: {
                type,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                requesterId: session.user.id,
            },
            include: {
                requester: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        return NextResponse.json(leave, { status: 201 });
    } catch (error) {
        console.error("Error creating leave:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
