import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET all projects (user's projects + projects they're a member of)
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { createdById: session.user.id },
                    { members: { some: { userId: session.user.id } } }
                ]
            },
            include: {
                client: { select: { id: true, name: true } },
                createdBy: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                members: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, avatar: true } }
                    }
                },
                _count: { select: { tasks: true } }
            },
            orderBy: { updatedAt: "desc" }
        });

        return NextResponse.json(projects);
    } catch (error) {
        console.error("Error fetching projects:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST create new project
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admins, managers can create projects
        if (!["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session.user.role || "")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, color, clientId, memberIds } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: "Project name is required" }, { status: 400 });
        }

        const project = await prisma.project.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                color: color || "#3b82f6",
                clientId: clientId || null,
                createdById: session.user.id,
                members: {
                    create: [
                        // Creator is automatically OWNER
                        { userId: session.user.id, role: "OWNER" },
                        // Add additional members
                        ...(memberIds || [])
                            .filter((id: string) => id !== session.user.id)
                            .map((id: string) => ({ userId: id, role: "MEMBER" }))
                    ]
                }
            },
            include: {
                client: { select: { id: true, name: true } },
                createdBy: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                members: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, avatar: true } }
                    }
                },
                _count: { select: { tasks: true } }
            }
        });

        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        console.error("Error creating project:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
