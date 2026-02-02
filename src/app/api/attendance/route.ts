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
        const userId = searchParams.get("userId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const isAdmin = session.user.role === "ADMIN" || session.user.role === "MANAGER" || session.user.role === "SUPER_ADMIN";
        const targetUserId = isAdmin && userId ? userId : session.user.id;

        const attendance = await prisma.attendance.findMany({
            where: {
                userId: targetUserId,
                ...(startDate && endDate && {
                    date: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    },
                }),
            },
            orderBy: { date: "desc" },
            take: 30,
        });

        return NextResponse.json(attendance);
    } catch (error) {
        console.error("Error fetching attendance:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { action } = await request.json();
        // Use ISO string to ensure we look for "YYYY-MM-DD" regardless of local time
        // This relies on the server time, but ensures consistency for the record
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        // Adjust for timezone offset if necessary, but for now simple midnight start is safer than setHours
        // actually, let's just use the strict Date object which Prisma maps to @db.Date

        if (action === "clock-in") {

            // Check if already clocked in today
            const existing = await prisma.attendance.findUnique({
                where: {
                    userId_date: {
                        userId: session.user.id,
                        date: startOfDay,
                    },
                },
            });

            if (existing) {
                return NextResponse.json({ error: "Already clocked in today" }, { status: 400 });
            }

            const now = new Date();
            const clockInHour = now.getHours();
            let status: "PRESENT" | "LATE" = "PRESENT";

            // If after 9:30 AM, mark as late
            if (clockInHour >= 10 || (clockInHour === 9 && now.getMinutes() > 30)) {
                status = "LATE";
            }

            const attendance = await prisma.attendance.create({
                data: {
                    userId: session.user.id,
                    date: startOfDay,
                    clockIn: now,
                    status,
                },
            });

            return NextResponse.json(attendance, { status: 201 });
        }

        if (action === "clock-out") {
            const attendance = await prisma.attendance.findUnique({
                where: {
                    userId_date: {
                        userId: session.user.id,
                        date: startOfDay,
                    },
                },
            });

            if (!attendance) {
                return NextResponse.json({ error: "Not clocked in today" }, { status: 400 });
            }

            if (attendance.clockOut) {
                return NextResponse.json({ error: "Already clocked out" }, { status: 400 });
            }

            const updated = await prisma.attendance.update({
                where: { id: attendance.id },
                data: { clockOut: new Date() },
            });

            return NextResponse.json(updated);
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Error updating attendance:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
