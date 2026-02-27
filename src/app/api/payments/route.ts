import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

// GET /api/payments - List all payments (Admin+ only)
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only Admin and Super Admin can view all payments
        if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const payeeId = searchParams.get("payeeId");
        const status = searchParams.get("status");
        const limit = parseInt(searchParams.get("limit") || "50");

        const where: Record<string, unknown> = {};
        if (payeeId) where.payeeId = payeeId;
        if (status) where.status = status;

        const payments = await prisma.payment.findMany({
            where,
            include: {
                payer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
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
                    },
                },
            },
            orderBy: { paymentDate: "desc" },
            take: limit,
        });

        // Audit Log for Viewing Payments
        await createAuditLog({
            userId: session.user.id,
            action: "VIEW",
            resource: "PAYMENT",
            details: { count: payments.length, type: "PAYMENTS_LIST" }
        });

        return NextResponse.json(payments);
    } catch (error) {
        console.error("Error fetching payments:", error);
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}

// POST /api/payments - Create a new payment (Admin+ only)
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only Admin and Super Admin can create payments
        if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const {
            payeeId,
            paymentDate,
            payPeriodStart,
            payPeriodEnd,
            baseSalary,
            deductions,
            bonuses,
            notes,
            status,
        } = body;

        if (!payeeId || !paymentDate || !payPeriodStart || !payPeriodEnd) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Get payee's salary info for currency
        const payee = await prisma.user.findUnique({
            where: { id: payeeId },
            include: { salaryInfo: true },
        });

        if (!payee) {
            return NextResponse.json({ error: "Payee not found" }, { status: 404 });
        }

        // Role check: Admin can only pay Staff
        if (session.user.role === "ADMIN" && payee.role !== "STAFF") {
            return NextResponse.json(
                { error: "Admin can only process payments for Staff" },
                { status: 403 }
            );
        }

        const salary = baseSalary || payee.salaryInfo?.baseSalary || 0;
        const totalDeductions = deductions || 0;
        const totalBonuses = bonuses || 0;
        const netPay = salary - totalDeductions + totalBonuses;
        const currency = payee.salaryInfo?.currency || "NPR";

        const payment = await prisma.payment.create({
            data: {
                payerId: session.user.id,
                payeeId,
                amount: netPay,
                currency,
                paymentDate: new Date(paymentDate),
                payPeriodStart: new Date(payPeriodStart),
                payPeriodEnd: new Date(payPeriodEnd),
                baseSalary: salary,
                deductions: totalDeductions,
                bonuses: totalBonuses,
                netPay,
                status: status || "PENDING",
                notes: notes || null,
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

        // Audit Log for Payment Creation
        await createAuditLog({
            userId: session.user.id,
            action: "CREATE",
            resource: "PAYMENT",
            resourceId: payment.id,
            details: { payeeId, amount: netPay, currency, status: payment.status }
        });

        return NextResponse.json(payment, { status: 201 });
    } catch (error) {
        console.error("Error creating payment:", error);
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}
