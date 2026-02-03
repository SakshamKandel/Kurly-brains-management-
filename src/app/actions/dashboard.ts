"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export type AttentionItem = {
    id: string;
    type: 'leave' | 'invoice' | 'task' | 'message';
    title: string;
    subtitle: string;
    severity: 'high' | 'medium' | 'low';
    date: Date;
    actions: readonly ('approve' | 'reject' | 'view' | 'complete')[];
    metadata?: any;
};

export async function getAttentionItems(): Promise<AttentionItem[]> {
    const session = await auth();
    if (!session?.user) return [];

    const userId = session.user.id;
    const userRole = session.user.role;
    const items: AttentionItem[] = [];

    // 1. Pending Leaves (For Managers/Admins)
    if (userRole === "ADMIN" || userRole === "MANAGER" || userRole === "SUPER_ADMIN") {
        const pendingLeaves = await prisma.leaveRequest.findMany({
            where: { status: "PENDING" },
            include: { requester: true },
            orderBy: { createdAt: "asc" },
            take: 5
        });

        items.push(...pendingLeaves.map(leave => ({
            id: leave.id,
            type: 'leave' as const,
            title: `${leave.requester.firstName} requested ${leave.type.toLowerCase()} leave`,
            subtitle: `${leave.reason || "No reason provided"}`,
            severity: 'high' as const,
            date: leave.createdAt,
            actions: ['approve', 'reject'] as const,
            metadata: { requesterId: leave.requesterId }
        })));
    }

    // 2. Overdue/Draft Invoices (For Admins)
    if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
        // TODO: Add DueDate logic when added to schema, for now use status
        const draftInvoices = await prisma.invoice.findMany({
            where: { status: "DRAFT" }, // Assuming Draft needs attention to be sent
            include: { client: true },
            take: 3,
            orderBy: { updatedAt: "desc" }
        });
        items.push(...draftInvoices.map(inv => ({
            id: inv.id,
            type: 'invoice' as const,
            title: `Draft Invoice #${inv.invoiceNumber}`,
            subtitle: `For ${inv.client.name} - $${inv.total}`,
            severity: 'medium' as const,
            date: inv.updatedAt,
            actions: ['view'] as const
        })));
    }

    // 3. User's Tasks (Due Soon or High Priority)
    const myTasks = await prisma.task.findMany({
        where: {
            assigneeId: userId,
            status: { not: "COMPLETED" },
            OR: [
                { priority: "URGENT" },
                { priority: "HIGH" }
            ]
        },
        take: 5,
        orderBy: { createdAt: "desc" }
    });

    items.push(...myTasks.map(task => ({
        id: task.id,
        type: 'task' as const,
        title: task.title,
        subtitle: `${task.priority} Priority`,
        severity: task.priority === 'URGENT' ? 'high' as const : 'medium' as const,
        date: task.createdAt,
        actions: ['complete', 'view'] as const
    })));

    // 4. Unread Messages
    const unreadMessages = await prisma.message.findMany({
        where: {
            receiverId: userId,
            isRead: false
        },
        include: { sender: true },
        take: 5,
        orderBy: { createdAt: "desc" }
    });

    items.push(...unreadMessages.map(msg => ({
        id: msg.id,
        type: 'message' as const,
        title: `Message from ${msg.sender.firstName}`,
        subtitle: msg.content.substring(0, 40),
        severity: 'medium' as const,
        date: msg.createdAt,
        actions: ['view'] as const
    })));

    // Sort by severity (High first) then Date
    return items.sort((a, b) => {
        const severityMap = { high: 3, medium: 2, low: 1 };
        if (severityMap[a.severity] !== severityMap[b.severity]) {
            return severityMap[b.severity] - severityMap[a.severity];
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
}

// Action to process items (Sample implementation)
export async function processAction(itemId: string, action: string, type: string) {
    const session = await auth();
    if (!session?.user) return { success: false, message: "Unauthorized" };

    try {
        if (type === 'leave') {
            if (action === 'approve') {
                await prisma.leaveRequest.update({ where: { id: itemId }, data: { status: 'APPROVED', approverId: session.user.id } });
            } else if (action === 'reject') {
                await prisma.leaveRequest.update({ where: { id: itemId }, data: { status: 'REJECTED', approverId: session.user.id } });
            }
        } else if (type === 'task' && action === 'complete') {
            await prisma.task.update({ where: { id: itemId }, data: { status: 'COMPLETED' } });
        }

        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to process action" };
    }
}
