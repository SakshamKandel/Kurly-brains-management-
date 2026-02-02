import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Fetch counts in parallel for performance
        const [unreadMessages, pendingTasks, pendingLeaves] = await Promise.all([
            // Unread messages count
            prisma.message.count({
                where: {
                    receiverId: userId,
                    isRead: false,
                },
            }),
            // Pending tasks assigned to user
            prisma.task.count({
                where: {
                    assigneeId: userId,
                    status: { in: ["TODO", "IN_PROGRESS"] },
                },
            }),
            // Pending leave requests (for managers/admins)
            session.user.role === "STAFF"
                ? 0
                : prisma.leaveRequest.count({
                    where: { status: "PENDING" },
                }),
        ]);

        return NextResponse.json({
            messages: unreadMessages,
            tasks: pendingTasks,
            leaves: pendingLeaves,
        });
    } catch (error) {
        console.error("Error fetching notification counts:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
