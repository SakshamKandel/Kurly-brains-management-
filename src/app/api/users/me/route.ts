import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
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
                managerId: true,
                manager: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                },
                // Stats
                tasksAssigned: { where: { status: "COMPLETED" } },
                messagesSent: true,
                attendance: { where: { status: "PRESENT" } },
                leaveRequests: { where: { status: "APPROVED" } },
                tasksCreated: { where: { status: { not: "COMPLETED" } } } // Pending tasks
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Transform data for frontend
        const profileData = {
            ...user,
            stats: {
                tasksCompleted: user.tasksAssigned.length,
                messagesSent: user.messagesSent.length,
                daysAttended: user.attendance.length,
                leaveDaysUsed: user.leaveRequests.reduce((acc, curr) => {
                    const start = new Date(curr.startDate);
                    const end = new Date(curr.endDate);
                    const diffTime = Math.abs(end.getTime() - start.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    return acc + diffDays;
                }, 0),
                pendingTasks: user.tasksCreated.length
            }
        };

        return NextResponse.json(profileData);
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            firstName, lastName, phone, department, position, avatar,
            currentPassword, newPassword
        } = body;

        // Password Update Logic
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: "Current password required" }, { status: 400 });
            }

            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
            });

            if (!user) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            const isValid = await bcrypt.compare(currentPassword, user.password);
            if (!isValid) {
                return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 12);
            await prisma.user.update({
                where: { id: session.user.id },
                data: { password: hashedPassword, mustChangePassword: false },
            });

            return NextResponse.json({ success: true, message: "Password updated" });
        }

        // Profile Update Logic
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                firstName,
                lastName,
                phone,
                department,
                position,
                avatar
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
