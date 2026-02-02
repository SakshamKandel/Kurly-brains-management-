import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notifications - Fetch user notifications
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const notifications: any[] = [];

        // Get recent tasks assigned to user (last 7 days)
        try {
            const recentTasks = await prisma.task.findMany({
                where: {
                    assigneeId: userId,
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: {
                    id: true,
                    title: true,
                    createdAt: true,
                    status: true
                }
            });

            for (const task of recentTasks) {
                notifications.push({
                    id: `task-${task.id}`,
                    type: "task",
                    title: "New task assigned",
                    description: task.title,
                    time: getRelativeTime(task.createdAt),
                    read: task.status !== "TODO",
                    href: "/dashboard/tasks"
                });
            }
        } catch (e) {
            console.error("Failed to fetch task notifications:", e);
        }

        // Get recent messages sent TO this user (last 24 hours)
        try {
            const recentMessages = await prisma.message.findMany({
                where: {
                    OR: [
                        // Messages where user is the receiver
                        { receiverId: userId },
                        // Messages in conversations where user is a member (but not sender)
                        {
                            conversation: {
                                members: {
                                    some: { userId: userId }
                                }
                            },
                            senderId: { not: userId }
                        }
                    ],
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    },
                    isRead: false
                },
                orderBy: { createdAt: "desc" },
                take: 5,
                include: {
                    sender: { select: { firstName: true, lastName: true } }
                }
            });

            for (const msg of recentMessages) {
                const senderName = msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : "Someone";
                notifications.push({
                    id: `msg-${msg.id}`,
                    type: "message",
                    title: `Message from ${senderName}`,
                    description: msg.content.length > 40 ? msg.content.substring(0, 40) + "..." : msg.content,
                    time: getRelativeTime(msg.createdAt),
                    read: msg.isRead,
                    href: "/dashboard/messages"
                });
            }
        } catch (e) {
            console.error("Failed to fetch message notifications:", e);
        }

        // Get leave request updates (last 7 days)
        try {
            const leaveUpdates = await prisma.leaveRequest.findMany({
                where: {
                    requesterId: userId,
                    updatedAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    },
                    status: { in: ["APPROVED", "REJECTED"] }
                },
                orderBy: { updatedAt: "desc" },
                take: 3
            });

            for (const leave of leaveUpdates) {
                notifications.push({
                    id: `leave-${leave.id}`,
                    type: "leave",
                    title: `Leave ${leave.status.toLowerCase()}`,
                    description: `${leave.type} leave request`,
                    time: getRelativeTime(leave.updatedAt),
                    read: true,
                    href: "/dashboard/leaves"
                });
            }
        } catch (e) {
            console.error("Failed to fetch leave notifications:", e);
        }

        // Sort by most recent
        notifications.sort((a, b) => {
            const timeA = parseRelativeTime(a.time);
            const timeB = parseRelativeTime(b.time);
            return timeA - timeB;
        });

        return NextResponse.json(notifications.slice(0, 10));
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return NextResponse.json([], { status: 200 });
    }
}

function getRelativeTime(date: Date): string {
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

function parseRelativeTime(time: string): number {
    if (time === "Just now") return 0;
    const match = time.match(/(\d+)([mhd])/);
    if (!match) return 999999;
    const value = parseInt(match[1]);
    const unit = match[2];
    if (unit === "m") return value;
    if (unit === "h") return value * 60;
    if (unit === "d") return value * 1440;
    return 999999;
}
