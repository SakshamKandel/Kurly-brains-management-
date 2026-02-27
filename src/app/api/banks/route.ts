import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/banks - Get all custom banks (merged with static banks)
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const country = searchParams.get("country");

        const where: Record<string, unknown> = { isApproved: true };
        if (country) where.country = country;

        const customBanks = await prisma.customBank.findMany({
            where,
            select: {
                id: true,
                country: true,
                name: true,
                code: true,
                isDigital: true,
                addedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                createdAt: true,
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json(customBanks);
    } catch (error) {
        console.error("Error fetching custom banks:", error);
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}

// POST /api/banks - Add a new custom bank
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { country, name, code, isDigital } = body;

        if (!country || !name) {
            return NextResponse.json(
                { error: "Country and bank name are required" },
                { status: 400 }
            );
        }

        // Check if bank already exists (static banks check would be done client-side)
        const existingBank = await prisma.customBank.findUnique({
            where: {
                country_name: {
                    country,
                    name,
                },
            },
        });

        if (existingBank) {
            return NextResponse.json(
                { error: "This bank already exists for the selected country" },
                { status: 400 }
            );
        }

        const customBank = await prisma.customBank.create({
            data: {
                country,
                name,
                code: code || null,
                isDigital: isDigital || false,
                addedById: session.user.id,
                isApproved: true, // Auto-approve for now
            },
            include: {
                addedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        return NextResponse.json(customBank, { status: 201 });
    } catch (error) {
        console.error("Error creating custom bank:", error);
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}

// DELETE /api/banks - Delete a custom bank (Admin+ only)
export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only Admin and Super Admin can delete custom banks
        if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Bank ID is required" }, { status: 400 });
        }

        await prisma.customBank.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting custom bank:", error);
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}
