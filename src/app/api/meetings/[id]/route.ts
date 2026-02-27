import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET single meeting
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const meeting = await prisma.meeting.findUnique({
            where: { id },
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
                attendees: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } }
                    }
                }
            }
        });

        if (!meeting) {
            return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
        }

        // Check access
        const isAttendee = meeting.attendees.some(a => a.userId === session.user.id);
        const isCreator = meeting.createdById === session.user.id;

        if (!isAttendee && !isCreator) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        return NextResponse.json(meeting);
    } catch (error) {
        console.error("Error fetching meeting:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT update meeting
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { title, description, startTime, endTime, location, isVirtual, meetLink } = body;

        const meeting = await prisma.meeting.findUnique({ where: { id } });

        if (!meeting) {
            return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
        }

        // Only creator or admin can edit
        const isCreatorOrAdmin = meeting.createdById === session.user.id || ["ADMIN", "SUPER_ADMIN"].includes(session.user.role || "");
        if (!isCreatorOrAdmin) {
            return NextResponse.json({ error: "Only the meeting organizer or admin can edit" }, { status: 403 });
        }

        const updated = await prisma.meeting.update({
            where: { id },
            data: {
                title: title?.trim(),
                description: description?.trim(),
                startTime: startTime ? new Date(startTime) : undefined,
                endTime: endTime ? new Date(endTime) : undefined,
                location: location?.trim(),
                isVirtual,
                meetLink: meetLink?.trim()
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

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating meeting:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE meeting
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const meeting = await prisma.meeting.findUnique({ where: { id } });

        if (!meeting) {
            return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
        }

        // Only creator or admin can delete
        if (meeting.createdById !== session.user.id && !["ADMIN", "SUPER_ADMIN"].includes(session.user.role || "")) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        await prisma.meeting.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting meeting:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
