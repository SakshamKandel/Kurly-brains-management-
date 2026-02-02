import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const preferences = await prisma.userPreferences.findUnique({
            where: { userId: session.user.id },
        });

        // Return empty defaults if no preferences exist
        return NextResponse.json(preferences || {
            navOrder: null,
            favorites: [],
            groups: [],
            workModes: {},
            activeWorkMode: null,
        });
    } catch (error) {
        console.error("Error fetching preferences:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { navOrder, favorites, groups, workModes, activeWorkMode } = body;

        const preferences = await prisma.userPreferences.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                navOrder: navOrder ?? undefined,
                favorites: favorites ?? undefined,
                groups: groups ?? undefined,
                workModes: workModes ?? undefined,
                activeWorkMode: activeWorkMode ?? undefined,
            },
            update: {
                ...(navOrder !== undefined && { navOrder }),
                ...(favorites !== undefined && { favorites }),
                ...(groups !== undefined && { groups }),
                ...(workModes !== undefined && { workModes }),
                ...(activeWorkMode !== undefined && { activeWorkMode }),
            },
        });

        return NextResponse.json(preferences);
    } catch (error) {
        console.error("Error updating preferences:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
