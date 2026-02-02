import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch user data and stats in parallel
        const [user, tasksCompleted, messagesSent, daysAttended, leaveDaysUsed, pendingTasks, recentActivity] = await Promise.all([
            prisma.user.findUnique({
                where: { id: session.user.id },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    department: true,
                    position: true,
                    avatar: true,
                    role: true,
                    status: true,
                    createdAt: true,
                    mustChangePassword: true,
                    managerId: true,
                    manager: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            }),
            // Count completed tasks assigned to user
            prisma.task.count({
                where: {
                    assigneeId: session.user.id,
                    status: "COMPLETED",
                },
            }),
            // Count messages sent by user
            prisma.message.count({
                where: {
                    senderId: session.user.id,
                },
            }),
            // Count attendance days
            prisma.attendance.count({
                where: {
                    userId: session.user.id,
                    status: { in: ["PRESENT", "LATE", "HALF_DAY"] },
                },
            }),
            // Count approved leave days
            prisma.leaveRequest.count({
                where: {
                    requesterId: session.user.id,
                    status: "APPROVED",
                },
            }),
            // Count pending/in-progress tasks
            prisma.task.count({
                where: {
                    assigneeId: session.user.id,
                    status: { in: ["TODO", "IN_PROGRESS", "REVIEW"] },
                },
            }),
            // Get recent activity (last 5 tasks)
            prisma.task.findMany({
                where: {
                    OR: [
                        { assigneeId: session.user.id },
                        { creatorId: session.user.id },
                    ],
                },
                orderBy: { updatedAt: "desc" },
                take: 5,
                select: {
                    id: true,
                    title: true,
                    status: true,
                    updatedAt: true,
                },
            }),
        ]);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            ...user,
            stats: {
                tasksCompleted,
                messagesSent,
                daysAttended,
                leaveDaysUsed,
                pendingTasks,
            },
            recentActivity,
        });
    } catch (error) {
        console.error("Get profile error:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { firstName, lastName, phone, department, position, currentPassword, newPassword, isForceChange } = body;

        const updateData: any = {
            firstName,
            lastName,
            phone,
            department,
            position,
        };

        // Handle password change
        if ((currentPassword && newPassword) || (isForceChange && newPassword)) {
            const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });

            if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

            // If it's a forced change, verify the user actually needs to change it
            if (isForceChange) {
                if (!currentUser.mustChangePassword) {
                    return NextResponse.json({ error: "Password change not required" }, { status: 400 });
                }
            } else {
                // Regular change requires current password verification
                const isValid = await bcrypt.compare(currentPassword, currentUser.password);
                if (!isValid) {
                    return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
                }
            }

            const hashedPassword = await bcrypt.hash(newPassword, 12);
            updateData.password = hashedPassword;
            // If they were forced to change password, clear the flag
            updateData.mustChangePassword = false;
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                department: true,
                position: true,
                avatar: true,
                role: true,
                status: true,
                createdAt: true,
                mustChangePassword: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Update profile error:", error);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}
