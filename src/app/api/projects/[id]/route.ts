import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET single project
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                client: { select: { id: true, name: true, email: true } },
                createdBy: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                members: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } }
                    }
                },
                tasks: {
                    include: {
                        assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } }
                    },
                    orderBy: { updatedAt: "desc" }
                },
                _count: { select: { tasks: true } }
            }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Check access
        const isMember = project.members.some(m => m.userId === session.user.id);
        const isCreator = project.createdById === session.user.id;
        const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role || "");

        if (!isMember && !isCreator && !isAdmin) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        return NextResponse.json(project);
    } catch (error) {
        console.error("Error fetching project:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT update project
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name, description, color, status, clientId } = body;

        // Check if user can edit (owner or admin)
        const project = await prisma.project.findUnique({
            where: { id },
            include: { members: true }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const isOwner = project.members.some(m => m.userId === session.user.id && m.role === "OWNER");
        const isProjectAdmin = project.members.some(m => m.userId === session.user.id && m.role === "ADMIN");
        const isSuperAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role || "");

        if (!isOwner && !isProjectAdmin && !isSuperAdmin) {
            return NextResponse.json({ error: "Not authorized to edit this project" }, { status: 403 });
        }

        const updated = await prisma.project.update({
            where: { id },
            data: {
                name: name?.trim(),
                description: description?.trim(),
                color,
                status,
                clientId
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

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating project:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE project
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const project = await prisma.project.findUnique({
            where: { id },
            include: { members: true }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Only owner or super admin can delete
        const isOwner = project.members.some(m => m.userId === session.user.id && m.role === "OWNER");
        const isSuperAdmin = session.user.role === "SUPER_ADMIN";

        if (!isOwner && !isSuperAdmin) {
            return NextResponse.json({ error: "Only project owner can delete" }, { status: 403 });
        }

        await prisma.project.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting project:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
