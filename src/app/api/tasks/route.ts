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
        const assigneeId = searchParams.get("assigneeId");

        // Get user role to determine visibility
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        // Build the where clause based on user role
        let whereClause: any = {
            ...(status && status !== "all" && { status: status as "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "CANCELLED" }),
            ...(assigneeId && { assigneeId }),
        };

        // Regular staff can only see tasks they created or are assigned to them
        // Admins, Super Admins, and Managers can see all tasks
        const isPrivilegedRole = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(currentUser?.role || "");

        if (!isPrivilegedRole) {
            whereClause = {
                ...whereClause,
                OR: [
                    { assigneeId: session.user.id },
                    { creatorId: session.user.id },
                ],
            };
        }

        const tasks = await prisma.task.findMany({
            where: whereClause,
            include: {
                creator: { select: { id: true, firstName: true, lastName: true } },
                assignee: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, priority, dueDate, assigneeId } = body;

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                priority: priority || "MEDIUM",
                dueDate: dueDate ? new Date(dueDate) : null,
                creatorId: session.user.id,
                assigneeId: assigneeId || null,
            },
            include: {
                creator: { select: { id: true, firstName: true, lastName: true } },
                assignee: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error("Error creating task:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
