import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

// GET /api/payees - List all payees with bank/salary info (Admin+ only)
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // RBAC: strictly filter who can be seen
        const where: any = {
            status: "ACTIVE", // Only active users
        };

        if (session.user.role === "SUPER_ADMIN") {
            // Super Admin sees everyone, including inactive
            delete where.status;
        } else if (session.user.role === "ADMIN") {
            // Admin sees Staff, other Admins, and themselves
            where.OR = [
                { role: "STAFF" },
                { role: "ADMIN" },
                { id: session.user.id }
            ];
        } else {
            // Staff sees only themselves
            where.id = session.user.id;
        }

        const payees = await prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                department: true,
                position: true,
                role: true,
                status: true,
                bankDetails: {
                    select: {
                        id: true,
                        bankName: true,
                        accountNumber: true,
                        accountHolder: true,
                        accountType: true,
                        country: true,
                    },
                },
                salaryInfo: {
                    select: {
                        id: true,
                        baseSalary: true,
                        currency: true,
                        payFrequency: true,
                        paymentMethod: true,
                        type: true, // Added new field
                    },
                },
                paymentsReceived: {
                    take: 1,
                    orderBy: { paymentDate: "desc" },
                    select: {
                        id: true,
                        paymentDate: true,
                        status: true,
                        netPay: true,
                    },
                },
            },
            orderBy: [
                { role: "asc" },
                { firstName: "asc" },
            ],
        });

        // Mask account numbers (show only last 4 digits)
        const maskedPayees = payees.map((payee) => ({
            ...payee,
            bankDetails: payee.bankDetails
                ? {
                    ...payee.bankDetails,
                    accountNumber: payee.bankDetails.accountNumber
                        ? `****${payee.bankDetails.accountNumber.slice(-4)}`
                        : null,
                }
                : null,
        }));

        // Audit Log for Viewing List
        await createAuditLog({
            userId: session.user.id,
            action: "VIEW",
            resource: "USER",
            details: { count: payees.length, type: "PAYEES_LIST" }
        });

        return NextResponse.json(maskedPayees);
    } catch (error) {
        console.error("Error fetching payees:", error);
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}

// POST /api/payees - Create new payee info (add bank/salary to existing user)
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only Admin and Super Admin can add payee info
        if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { userId, bankDetails, salaryInfo } = body;

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Role-based restrictions: Admin can only add for Staff
        if (session.user.role === "ADMIN" && user.role !== "STAFF") {
            return NextResponse.json(
                { error: "Admin can only manage Staff payee information" },
                { status: 403 }
            );
        }

        const result: Record<string, object> = {};

        // Create bank details if provided
        if (bankDetails) {
            const existingBank = await prisma.bankDetails.findUnique({
                where: { userId },
            });

            if (existingBank) {
                result.bankDetails = await prisma.bankDetails.update({
                    where: { userId },
                    data: {
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
            } else {
                result.bankDetails = await prisma.bankDetails.create({
                    data: {
                        userId,
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
            }
        }

        // Create salary info if provided
        if (salaryInfo) {
            const existingSalary = await prisma.salaryInfo.findUnique({
                where: { userId },
            });

            if (existingSalary) {
                result.salaryInfo = await prisma.salaryInfo.update({
                    where: { userId },
                    data: {
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
            } else {
                result.salaryInfo = await prisma.salaryInfo.create({
                    data: {
                        userId,
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
            }
        }

        // Audit Log for Bank Details
        if (bankDetails) {
            await createAuditLog({
                userId: session.user.id,
                action: result.bankDetails && 'createdAt' in (result.bankDetails as any) && (result.bankDetails as any).createdAt === (result.bankDetails as any).updatedAt ? "CREATE" : "UPDATE",
                resource: "BANK_DETAILS",
                resourceId: (result.bankDetails as any)?.id,
                details: { userId, bankName: bankDetails.bankName, accountType: bankDetails.accountType }
            });
        }

        // Audit Log for Salary Info
        if (salaryInfo) {
            await createAuditLog({
                userId: session.user.id,
                action: result.salaryInfo && 'createdAt' in (result.salaryInfo as any) && (result.salaryInfo as any).createdAt === (result.salaryInfo as any).updatedAt ? "CREATE" : "UPDATE",
                resource: "SALARY_INFO",
                resourceId: (result.salaryInfo as any)?.id,
                details: { userId, baseSalary: salaryInfo.baseSalary, currency: salaryInfo.currency }
            });
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating payee:", error);
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
}
