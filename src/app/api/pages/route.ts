import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/pages - List user pages
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const pages = await prisma.customPage.findMany({
            where: { userId: session.user.id },
            orderBy: [
                { order: 'asc' },
                { updatedAt: 'desc' }
            ],
            select: {
                id: true,
                title: true,
                icon: true,
                updatedAt: true,
                _count: {
                    select: { blocks: true }
                }
            }
        });

        return NextResponse.json(pages);
    } catch (error) {
        console.error("Failed to fetch pages:", error);
        return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
    }
}

// POST /api/pages - Create new page
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title = "Untitled", icon = "📄", type = "note" } = body;

        // Create page
        const page = await prisma.customPage.create({
            data: {
                title,
                icon,
                userId: session.user.id,
                // Add initial blocks based on template type
                blocks: {
                    create: getInitialBlocks(type)
                }
            },
            select: {
                id: true,
                title: true,
                icon: true,
                updatedAt: true,
                _count: {
                    select: { blocks: true }
                }
            }
        });

        return NextResponse.json(page);
    } catch (error) {
        console.error("Failed to create page:", error);
        return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
    }
}

function getInitialBlocks(type: string) {
    // Always return a simple empty text block for the "infinity mood board" style
    return [
        { type: "text", content: { text: "" }, order: 0 }
    ];
}
