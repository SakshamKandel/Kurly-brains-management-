import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const prefs = await prisma.userPreferences.findUnique({
            where: { userId: session.user.id },
            select: { widgetOrder: true },
        });

        return NextResponse.json({ widgetOrder: prefs?.widgetOrder ?? null });
    } catch (error) {
        console.error("Error fetching widget order:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { widgetOrder } = await request.json();
        if (!Array.isArray(widgetOrder)) {
            return NextResponse.json({ error: "widgetOrder must be an array" }, { status: 400 });
        }

        await prisma.userPreferences.upsert({
            where: { userId: session.user.id },
            create: { userId: session.user.id, widgetOrder },
            update: { widgetOrder },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error saving widget order:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
