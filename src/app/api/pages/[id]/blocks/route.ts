import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/pages/[id]/blocks - Add block
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { type, content, order } = body;

        const block = await prisma.block.create({
            data: {
                type,
                content,
                order,
                pageId: id
            }
        });

        return NextResponse.json(block);
    } catch (error) {
        console.error("POST Block Error:", error);
        return NextResponse.json({ error: "Failed to create block" }, { status: 500 });
    }
}

// PATCH /api/pages/[id]/blocks - Update multiple blocks (reorder or content)
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { blocks } = body; // Array of blocks to update

        // Verify page ownership
        const page = await prisma.customPage.findFirst({
            where: { id, userId: session.user.id }
        });
        if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Transaction for bulk updates
        await prisma.$transaction(
            blocks.map((block: any) =>
                prisma.block.update({
                    where: { id: block.id },
                    data: {
                        ...(block.content && { content: block.content }),
                        ...(block.order !== undefined && { order: block.order }),
                        ...(block.type && { type: block.type })
                    }
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Block update failed:", error);
        return NextResponse.json({ error: "Failed to update blocks" }, { status: 500 });
    }
}

// DELETE /api/pages/[id]/blocks - Delete block
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const blockId = searchParams.get("blockId");

        if (!blockId) return NextResponse.json({ error: "Block ID required" }, { status: 400 });

        // Verify ownership via page relation
        const block = await prisma.block.findUnique({
            where: { id: blockId },
            include: { page: true }
        });

        if (!block || block.page.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.block.delete({
            where: { id: blockId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete block" }, { status: 500 });
    }
}
