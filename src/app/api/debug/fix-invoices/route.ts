import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
        }
        // Use raw SQL to bypass Prisma's enum validation checks for the "InvoiceStatus" type
        // This forces any status that is NOT 'DRAFT' or 'COMPLETED' to be 'DRAFT'

        // Note: For PostgreSQL, we might need to cast to text first if it's an enum, 
        // but typically Enums are just strings or specific types. 
        // If Prisma manages the Enum in Postgres, we might need to alter the type in DB.
        // But first, let's try to update the values.

        // Since we removed 'PENDING' from schema, we can't trust Prisma types.
        // We simply update everything not in the new allowed list.

        const count = await prisma.$executeRawUnsafe(`
            UPDATE "Invoice" 
            SET "status" = 'DRAFT' 
            WHERE "status" NOT IN ('DRAFT', 'COMPLETED')
        `);

        return NextResponse.json({ success: true, updatedCount: count });
    } catch (error: any) {
        console.error("Fix Check Failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
