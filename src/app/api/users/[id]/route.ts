import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                phone: true,
                department: true,
                position: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

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

        // Only allow users to update their own profile or admins to update any
        const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
        if (session.user.id !== id && !isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Check if updating role of a SUPER_ADMIN (Prevent Demotion)
        const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true } });

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (targetUser.role === "SUPER_ADMIN" && body.role && body.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Cannot change role of a Super Admin" }, { status: 403 });
        }

        // Build update data dynamically
        const updateData: Record<string, unknown> = {};

        if (body.firstName !== undefined) updateData.firstName = body.firstName;
        if (body.lastName !== undefined) updateData.lastName = body.lastName;
        if (body.phone !== undefined) updateData.phone = body.phone;
        if (body.department !== undefined) updateData.department = body.department;
        if (body.position !== undefined) updateData.position = body.position;
        if (body.avatar !== undefined) updateData.avatar = body.avatar;

        // Admin-only fields
        if (isAdmin) {
            if (body.role !== undefined) updateData.role = body.role;
            if (body.status !== undefined) updateData.status = body.status;
            if (body.email !== undefined) updateData.email = body.email;

            // Update password if provided
            if (body.password && body.password.trim()) {
                updateData.password = await bcrypt.hash(body.password, 12);
            }
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                phone: true,
                department: true,
                position: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admins can delete users
        const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
        if (!isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;

        // Prevent deleting yourself
        if (session.user.id === id) {
            return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Enforce role-based deletion rules
        if (session.user.role === "ADMIN") {
            // Admins can only delete STAFF
            if (existingUser.role !== "STAFF") {
                return NextResponse.json({ error: "Admins can only delete Staff members" }, { status: 403 });
            }
        } else if (session.user.role === "SUPER_ADMIN") {
            // Super Admins can delete anyone (except themselves, which is handled above)
            // No additional check needed
        }

        // Delete the user
        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
