import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const announcements = await prisma.announcement.findMany({
            where: {
                isPublished: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gte: new Date() } },
                ],
            },
            include: {
                author: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: [{ priority: "desc" }, { publishedAt: "desc" }],
        });

        return NextResponse.json(announcements);
    } catch (error) {
        console.error("Error fetching announcements:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admins can create announcements
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { title, content, priority, expiresAt } = await request.json();

        if (!title || !content) {
            return NextResponse.json({ error: "Title and content required" }, { status: 400 });
        }

        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                priority: priority || "MEDIUM",
                isPublished: true,
                publishedAt: new Date(),
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                authorId: session.user.id,
            },
            include: {
                author: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        return NextResponse.json(announcement, { status: 201 });
    } catch (error) {
        console.error("Error creating announcement:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
