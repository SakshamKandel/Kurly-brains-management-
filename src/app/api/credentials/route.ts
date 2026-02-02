import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch credentials (admin sees all, staff sees assigned + public)
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        let credentials;

        if (user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "SUPER_ADMIN") {
            // Admins/Managers/Super Admins see all credentials
            credentials = await prisma.clientCredential.findMany({
                include: {
                    assignedTo: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                    createdBy: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
        } else {
            // Staff sees:
            // 1. Assigned to them
            // 2. Created by them
            // 3. Visibility is PUBLIC
            // 4. Visibility is TEAM (for now, treated same as PUBLIC until Team logic is fully fleshed out, or we can restrict it)
            credentials = await prisma.clientCredential.findMany({
                where: {
                    OR: [
                        { assignedToId: session.user.id },
                        { createdById: session.user.id },
                        { visibility: "PUBLIC" },
                        { visibility: "TEAM" }, // Broad sharing for now as requested "Client credentials should be there for ... everyone"
                    ]
                },
                include: {
                    assignedTo: { // Might be null if public/team logic allows unassigned, but schema says assignedToId is String (required).
                        // We should probably check if we can relax assignedToId in schema or just assign to creator/admin as placeholder.
                        // For now, let's assume assignedTo is still required but visibility overrides access.
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                    createdBy: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
        }

        return NextResponse.json(credentials);
    } catch (error) {
        console.error("Error fetching credentials:", error);
        return NextResponse.json({ error: "Failed to fetch credentials", details: String(error) }, { status: 500 });
    }
}

// POST - Create new credential (admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        // Allow any authenticated user to create credentials (as requested)
        // if (user?.role !== "ADMIN" && user?.role !== "MANAGER" && user?.role !== "SUPER_ADMIN") {
        //    return NextResponse.json({ error: "Only admins/managers can create credentials" }, { status: 403 });
        // }

        const body = await request.json();
        const { clientName, serviceName, username, password, apiKey, url, notes, assignedToId, visibility } = body;

        // For PUBLIC/TEAM visibility, if no assignee is selected, assign to the creator (admin/manager)
        // just to satisfy the database constraint requiring a valid User ID.
        const finalAssignedToId = assignedToId || (visibility !== 'PRIVATE' ? session.user.id : null);

        if (!clientName || !serviceName || !password || !finalAssignedToId) {
            return NextResponse.json(
                { error: "Client name, service name, password, and assignee are required" },
                { status: 400 }
            );
        }

        const credential = await prisma.clientCredential.create({
            data: {
                clientName,
                serviceName,
                username,
                password, // Note: In production, encrypt this before storing
                apiKey,
                url,
                notes,
                createdById: session.user.id,
                assignedToId: finalAssignedToId,
                visibility: visibility || "PRIVATE",
            },
            include: {
                assignedTo: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });

        return NextResponse.json(credential, { status: 201 });
    } catch (error) {
        console.error("Error creating credential:", error);
        // Log formatted error for debugging
        if (error instanceof Error) {
            console.error("Stack:", error.stack);
            console.error("Message:", error.message);
        }
        return NextResponse.json({ error: "Failed to create credential", details: String(error) }, { status: 500 });
    }
}

// DELETE - Delete credential (admin only)
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (user?.role !== "ADMIN" && user?.role !== "MANAGER" && user?.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Only admins can delete credentials" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Credential ID required" }, { status: 400 });
        }

        await prisma.clientCredential.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting credential:", error);
        return NextResponse.json({ error: "Failed to delete credential" }, { status: 500 });
    }
}
