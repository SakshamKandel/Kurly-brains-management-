import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/pages/[id] - Get single page with blocks
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const page = await prisma.customPage.findFirst({
            where: {
                id,
                userId: session.user.id
            },
            include: {
                blocks: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!page) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json(page);
    } catch (error) {
        console.error("GET /api/pages/[id] error:", error);
        return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 });
    }
}

// PATCH /api/pages/[id] - Update page metadata
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        const { title, icon } = body;

        // First verify ownership
        const existingPage = await prisma.customPage.findFirst({
            where: {
                id,
                userId: session.user.id
            }
        });

        if (!existingPage) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const page = await prisma.customPage.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(icon && { icon })
            }
        });

        return NextResponse.json(page);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
    }
}

// DELETE /api/pages/[id] - Delete page
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;

        const result = await prisma.customPage.deleteMany({
            where: {
                id,
                userId: session.user.id
            }
        });

        if (result.count === 0) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
    }
}
