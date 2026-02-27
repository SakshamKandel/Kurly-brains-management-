import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export type AuditAction =
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "VIEW"
    | "LOGIN"
    | "LOGOUT"
    | "APPROVE"
    | "REJECT";

export type AuditResource =
    | "USER"
    | "PAYMENT"
    | "BANK_DETAILS"
    | "SALARY_INFO"
    | "CUSTOM_BANK"
    | "INVOICE"
    | "CLIENT"
    | "CREDENTIAL";

interface AuditLogParams {
    userId: string;
    action: AuditAction;
    resource: AuditResource;
    resourceId?: string;
    details?: Record<string, any>;
}

/**
 * Creates an audit log entry in the database.
 * This function should be called inside API routes or server actions.
 */
export async function createAuditLog({
    userId,
    action,
    resource,
    resourceId,
    details,
}: AuditLogParams) {
    try {
        const headersList = await headers();
        const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
        const userAgent = headersList.get("user-agent") || "unknown";

        await prisma.auditLog.create({
            data: {
                userId,
                action,
                resource,
                resourceId,
                details: details ? JSON.stringify(details) : undefined,
                ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress, // Handle array if multiple IPs
                userAgent,
            },
        });
    } catch (error) {
        // We don't want to crash the application if logging fails, but we should log the error
        console.error("Failed to create audit log:", error);
    }
}
