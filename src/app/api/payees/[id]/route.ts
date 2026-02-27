import { NextResponse } from "next/server"; // Built at 12:25 PM
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

// GET /api/payees/[id] - Get payee details
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

        // Fetch payee to check role
        const payee = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                phone: true,
                department: true,
                position: true,
                role: true,
                status: true,
                bankDetails: true,
                salaryInfo: session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN",
                paymentsReceived: {
                    orderBy: { paymentDate: "desc" },
                    take: 10,
                    include: {
                        payer: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });

        if (!payee) {
            return NextResponse.json({ error: "Payee not found" }, { status: 404 });
        }

        // RBAC Check for View
        let canView = false;
        if (session.user.role === "SUPER_ADMIN") {
            canView = true;
        } else if (session.user.id === id) {
            canView = true;
        } else if (session.user.role === "ADMIN") {
            if (payee.role === "STAFF") {
                canView = true;
            }
        }

        if (!canView) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Mask account number for non-owners unless Admin/Super Admin
        const isOwnerOrAdmin =
            session.user.id === id ||
            session.user.role === "ADMIN" ||
            session.user.role === "SUPER_ADMIN";

        const response = {
            ...payee,
            bankDetails: payee.bankDetails
                ? {
                    ...payee.bankDetails,
                    accountNumber: isOwnerOrAdmin
                        ? payee.bankDetails.accountNumber
                        : `****${payee.bankDetails.accountNumber.slice(-4)}`,
                }
                : null,
        };

        // Audit Log for Viewing Single Payee
        await createAuditLog({
            userId: session.user.id,
            action: "VIEW",
            resource: "USER",
            resourceId: id,
            details: { type: "PAYEE_DETAILS" }
        });

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching payee:", error);
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}

// PUT /api/payees/[id] - Update bank/salary details
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
        const { bankDetails, salaryInfo } = body;

        // Get the target user
        const targetUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Permission check (Strict RBAC)
        const isAdmin = session.user.role === "ADMIN";
        const isSuperAdmin = session.user.role === "SUPER_ADMIN";

        let canEditBank = false;
        let canEditSalary = false;

        if (isSuperAdmin) {
            canEditBank = true;
            canEditSalary = true;
        } else if (isAdmin) {
            if (targetUser.role === "STAFF") {
                canEditBank = true;
                canEditSalary = true;
            }
        }

        const result: Record<string, any> = {};

        // Update bank details
        if (bankDetails && canEditBank) {
            result.bankDetails = await prisma.bankDetails.upsert({
                where: { userId: id },
                update: {
                    bankName: bankDetails.bankName,
                    bankCode: bankDetails.bankCode || null,
                    branchName: bankDetails.branchName || null,
                    branchCode: bankDetails.branchCode || null,
                    accountNumber: bankDetails.accountNumber,
                    accountHolder: bankDetails.accountHolder,
                    accountType: bankDetails.accountType || "SAVINGS",
                    country: bankDetails.country || "NP",
                },
                create: {
                    userId: id,
                    bankName: bankDetails.bankName,
                    bankCode: bankDetails.bankCode || null,
                    branchName: bankDetails.branchName || null,
                    branchCode: bankDetails.branchCode || null,
                    accountNumber: bankDetails.accountNumber,
                    accountHolder: bankDetails.accountHolder,
                    accountType: bankDetails.accountType || "SAVINGS",
                    country: bankDetails.country || "NP",
                },
            });
        } else if (bankDetails && !canEditBank) {
            return NextResponse.json({ error: "Permission denied for bank details" }, { status: 403 });
        }

        // Update salary info
        if (salaryInfo && canEditSalary) {
            result.salaryInfo = await prisma.salaryInfo.upsert({
                where: { userId: id },
                update: {
                    baseSalary: salaryInfo.baseSalary,
                    currency: salaryInfo.currency || "NPR",
                    payFrequency: salaryInfo.payFrequency || "MONTHLY",
                    paymentMethod: salaryInfo.paymentMethod || "BANK_TRANSFER",
                    type: salaryInfo.type !== undefined ? salaryInfo.type : undefined,
                    taxDeduction: salaryInfo.taxDeduction || 0,
                    otherDeductions: salaryInfo.otherDeductions || 0,
                    deductionNotes: salaryInfo.deductionNotes || null,
                },
                create: {
                    userId: id,
                    baseSalary: salaryInfo.baseSalary,
                    currency: salaryInfo.currency || "NPR",
                    payFrequency: salaryInfo.payFrequency || "MONTHLY",
                    paymentMethod: salaryInfo.paymentMethod || "BANK_TRANSFER",
                    type: salaryInfo.type || "FIXED",
                    taxDeduction: salaryInfo.taxDeduction || 0,
                    otherDeductions: salaryInfo.otherDeductions || 0,
                    deductionNotes: salaryInfo.deductionNotes || null,
                },
            });
        } else if (salaryInfo && !canEditSalary) {
            return NextResponse.json({ error: "Permission denied for salary info" }, { status: 403 });
        }

        // Audit Logs
        if (bankDetails && canEditBank) {
            await createAuditLog({
                userId: session.user.id,
                action: "UPDATE",
                resource: "BANK_DETAILS",
                resourceId: result.bankDetails?.id,
                details: { targetUserId: id }
            });
        }

        if (salaryInfo && canEditSalary) {
            await createAuditLog({
                userId: session.user.id,
                action: "UPDATE",
                resource: "SALARY_INFO",
                resourceId: result.salaryInfo?.id,
                details: { targetUserId: id }
            });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error updating payee:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/payees/[id] - Remove payee info
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;

        await prisma.$transaction([
            prisma.bankDetails.deleteMany({ where: { userId: id } }),
            prisma.salaryInfo.deleteMany({ where: { userId: id } }),
        ]);

        await createAuditLog({
            userId: session.user.id,
            action: "DELETE",
            resource: "USER",
            resourceId: id,
            details: { type: "PAYEE_INFO_DELETE" }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting payee:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
