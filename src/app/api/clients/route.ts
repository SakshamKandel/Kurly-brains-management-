import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true }
        });

        // Clients: Super Admin sees all? Or everyone sees all clients?
        // Usually clients are shared resources in a company.
        // I will return ALL clients for simplicity so admins can bill any client.

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
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const body = await request.json();
        const { name, email, address, logo } = body;

        if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

        const client = await prisma.client.create({
            data: {
                name,
                email,
                address,
                logo,
                creatorId: user.id
            }
        });

        return NextResponse.json(client);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
    }
}
