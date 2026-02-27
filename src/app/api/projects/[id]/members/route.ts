import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET project members
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

        const members = await prisma.projectMember.findMany({
            where: { projectId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                        role: true
                    }
                }
            }
        });

        return NextResponse.json(members);
    } catch (error) {
        console.error("Error fetching project members:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST add member to project
export async function POST(
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
        const { userId, role = "MEMBER" } = body;

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Check if user can add members (owner or admin)
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
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        // Check if already a member
        const existing = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId: id, userId } }
        });

        if (existing) {
            return NextResponse.json({ error: "User is already a member" }, { status: 400 });
        }

        const member = await prisma.projectMember.create({
            data: {
                projectId: id,
                userId,
                role
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true
                    }
                }
            }
        });

        return NextResponse.json(member, { status: 201 });
    } catch (error) {
        console.error("Error adding project member:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE remove member from project
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
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const project = await prisma.project.findUnique({
            where: { id },
            include: { members: true }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const member = project.members.find(m => m.userId === userId);
        if (!member) {
            return NextResponse.json({ error: "User is not a member" }, { status: 404 });
        }

        // Cannot remove the owner
        if (member.role === "OWNER") {
            return NextResponse.json({ error: "Cannot remove the project owner" }, { status: 400 });
        }

        const isOwner = project.members.some(m => m.userId === session.user.id && m.role === "OWNER");
        const isProjectAdmin = project.members.some(m => m.userId === session.user.id && m.role === "ADMIN");
        const isSuperAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role || "");

        if (!isOwner && !isProjectAdmin && !isSuperAdmin) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        await prisma.projectMember.delete({
            where: { projectId_userId: { projectId: id, userId } }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing project member:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
