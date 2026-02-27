import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // All authenticated users can access dashboard stats

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalUsers,
            activeUsers,
            totalTasks,
            completedTasks,
            pendingLeaves,
            todayAttendance,
            unreadMessages,
            newAnnouncements,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { status: "ACTIVE" } }),
            prisma.task.count(),
            prisma.task.count({ where: { status: "COMPLETED" } }),
            prisma.leaveRequest.count({ where: { status: "PENDING" } }),
            prisma.attendance.count({
                where: {
                    date: {
                        gte: today,
                    },
                },
            }),
            prisma.message.count({
                where: {
                    isRead: false,
                    receiverId: session.user.id,
                },
            }),
            prisma.announcement.count({
                where: {
                    isPublished: true,
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gte: new Date() } },
                    ],
                },
            }),
        ]);

        // Get recent activity
        const recentTasks = await prisma.task.findMany({
            take: 5,
            orderBy: { updatedAt: "desc" },
            include: {
                assignee: { select: { firstName: true, lastName: true } },
            },
        });

        const recentActivity = recentTasks.map((task) => ({
            id: task.id,
            type: "task" as const,
            title: task.title,
            description: task.assignee
                ? `Assigned to ${task.assignee.firstName} ${task.assignee.lastName}`
                : "Unassigned",
            time: formatTimeAgo(task.updatedAt),
        }));

        return NextResponse.json({
            stats: {
                totalUsers,
                activeUsers,
                totalTasks,
                completedTasks,
                pendingLeaves,
                todayAttendance,
                unreadMessages,
                newAnnouncements,
                activeTasks: totalTasks - completedTasks,
            },
            recentActivity,
        }, {
            headers: {
                'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
            }
        });
    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json(
            { error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}
