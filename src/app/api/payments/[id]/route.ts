import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

// GET /api/payments/[id] - Get payment details
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

        const payment = await prisma.payment.findUnique({
            where: { id },
            include: {
                payer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        position: true,
                    },
                },
                payee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        department: true,
                        position: true,
                        email: true,
                        bankDetails: true,
                    },
                },
            },
        });

        if (!payment) {
            return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }

        // Check permissions: Admin+, or the payee themselves
        const canView =
            session.user.id === payment.payeeId ||
            session.user.role === "ADMIN" ||
            session.user.role === "SUPER_ADMIN";

        if (!canView) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Mask bank account for non-admin viewers
        if (payment.payee.bankDetails && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
            payment.payee.bankDetails.accountNumber =
                `****${payment.payee.bankDetails.accountNumber.slice(-4)}`;
        }

        // Audit Log for Viewing Payment
        await createAuditLog({
            userId: session.user.id,
            action: "VIEW",
            resource: "PAYMENT",
            resourceId: id,
            details: { type: "PAYMENT_DETAILS" }
        });

        return NextResponse.json(payment);
    } catch (error) {
        console.error("Error fetching payment:", error);
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}

// PUT /api/payments/[id] - Update payment status
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only Admin and Super Admin can update payments
        if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status, notes } = body;

        const payment = await prisma.payment.findUnique({
            where: { id },
        });

        if (!payment) {
            return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }

        const updatedPayment = await prisma.payment.update({
            where: { id },
            data: {
                status: status || payment.status,
                notes: notes !== undefined ? notes : payment.notes,
            },
            include: {
                payee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        // Audit Log for Updating Payment
        await createAuditLog({
            userId: session.user.id,
            action: "UPDATE",
            resource: "PAYMENT",
            resourceId: id,
            details: { status: updatedPayment.status, notes: updatedPayment.notes }
        });

        return NextResponse.json(updatedPayment);
    } catch (error) {
        console.error("Error updating payment:", error);
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}

// DELETE /api/payments/[id] - Delete a payment (Super Admin only)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only Super Admin can delete payments
        if (session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;

        await prisma.payment.delete({
            where: { id },
        });

        // Audit Log for Deleting Payment
        await createAuditLog({
            userId: session.user.id,
            action: "DELETE",
            resource: "PAYMENT",
            resourceId: id,
            details: { type: "PAYMENT_DELETE" }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting payment:", error);
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}
