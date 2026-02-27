import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST respond to meeting invitation (accept/decline/tentative)
export async function POST(
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
        const { status } = body; // ACCEPTED, DECLINED, TENTATIVE

        if (!["ACCEPTED", "DECLINED", "TENTATIVE"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        // Find the attendee record
        const attendee = await prisma.meetingAttendee.findUnique({
            where: {
                meetingId_userId: {
                    meetingId: id,
                    userId: session.user.id
                }
            }
        });

        if (!attendee) {
            return NextResponse.json({ error: "You are not invited to this meeting" }, { status: 404 });
        }

        const updated = await prisma.meetingAttendee.update({
            where: { id: attendee.id },
            data: {
                status,
                respondedAt: new Date()
            },
            include: {
                meeting: {
                    include: {
                        createdBy: { select: { id: true, firstName: true, lastName: true } }
                    }
                },
                user: { select: { id: true, firstName: true, lastName: true } }
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error responding to meeting:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
