import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const clients = await prisma.client.findMany({
            orderBy: { name: "asc" }
        });

        return NextResponse.json(clients);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only ADMIN, MANAGER, SUPER_ADMIN can create clients
        if (!["ADMIN", "MANAGER", "SUPER_ADMIN"].includes(session.user.role || "")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { name, email, address, logo } = body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        if (name.trim().length > 200) {
            return NextResponse.json({ error: "Name is too long (max 200 chars)" }, { status: 400 });
        }

        const client = await prisma.client.create({
            data: {
                name: name.trim(),
                email: email?.trim() || null,
                address: address?.trim() || null,
                logo,
                creatorId: session.user.id
            }
        });

        return NextResponse.json(client);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
    }
}
