import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET all meetings (user's meetings or where they're an attendee)
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const meetings = await prisma.meeting.findMany({
            where: {
                OR: [
                    { createdById: session.user.id },
                    { attendees: { some: { userId: session.user.id } } }
                ]
            },
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                attendees: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, avatar: true } }
                    }
                }
            },
            orderBy: { startTime: "asc" }
        });

        return NextResponse.json(meetings);
    } catch (error) {
        console.error("Error fetching meetings:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST create new meeting
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, startTime, endTime, location, isVirtual, meetLink, attendeeIds } = body;

        if (!title?.trim()) {
            return NextResponse.json({ error: "Meeting title is required" }, { status: 400 });
        }

        if (!startTime || !endTime) {
            return NextResponse.json({ error: "Start and end time are required" }, { status: 400 });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (end <= start) {
            return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
        }

        const meeting = await prisma.meeting.create({
            data: {
                title: title.trim(),
                description: description?.trim() || null,
                startTime: start,
                endTime: end,
                location: location?.trim() || null,
                isVirtual: isVirtual || false,
                meetLink: meetLink?.trim() || null,
                createdById: session.user.id,
                attendees: {
                    create: [
                        // Creator is automatically an attendee with ACCEPTED status
                        { userId: session.user.id, status: "ACCEPTED" },
                        // Add invited attendees with PENDING status
                        ...(attendeeIds || [])
                            .filter((id: string) => id !== session.user.id)
                            .map((id: string) => ({ userId: id, status: "PENDING" }))
                    ]
                }
            },
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                attendees: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, avatar: true } }
                    }
                }
            }
        });

        return NextResponse.json(meeting, { status: 201 });
    } catch (error) {
        console.error("Error creating meeting:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
