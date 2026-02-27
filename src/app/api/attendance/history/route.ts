import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - All attendance records for all users (admin/superadmin only)
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role || "");
        if (!isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // Default to last 7 days
        const now = new Date();
        const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        const defaultEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const records = await prisma.attendance.findMany({
            where: {
                date: {
                    gte: startDate ? new Date(startDate) : defaultStart,
                    lte: endDate ? new Date(endDate) : defaultEnd,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        department: true,
                    },
                },
            },
            orderBy: [{ date: "desc" }, { clockIn: "desc" }],
            take: 200,
        });

        return NextResponse.json(records);
    } catch (error) {
        console.error("Error fetching attendance history:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
