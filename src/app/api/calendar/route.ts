import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });

        const isAdmin = ["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user?.role || "");

        const [tasks, leaves, invoices] = await Promise.all([
            prisma.task.findMany({
                where: isAdmin ? {} : { OR: [{ creatorId: userId }, { assigneeId: userId }] },
                select: {
                    id: true,
                    title: true,
                    dueDate: true,
                    priority: true,
                    status: true,
                }
            }),
            prisma.leaveRequest.findMany({
                where: isAdmin ? {} : { requesterId: userId },
                select: {
                    id: true,
                    type: true,
                    status: true,
                    startDate: true,
                    endDate: true,
                }
            }),
            prisma.invoice.findMany({
                where: isAdmin ? {} : { creatorId: userId },
                select: {
                    id: true,
                    invoiceNumber: true,
                    dueDate: true,
                    status: true,
                    total: true,
                    client: { select: { name: true } }
                }
            }),
        ]);

        const events = [
            ...tasks.map(t => ({
                id: `task-${t.id}`,
                sourceId: t.id,
                type: "task",
                title: t.title,
                date: t.dueDate || new Date().toISOString(),
                meta: `${t.status} • ${t.priority}`,
                href: `/dashboard/tasks?id=${t.id}`,
                isUndated: !t.dueDate
            })),
            ...leaves.flatMap(l => {
                const days: any[] = [];
                const start = new Date(l.startDate);
                const end = new Date(l.endDate);
                const spanDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    days.push({
                        id: `leave-${l.id}-${d.toISOString().slice(0, 10)}`,
                        sourceId: l.id,
                        type: "leave",
                        title: `${l.type} Leave`,
                        date: new Date(d),
                        endDate: l.endDate,
                        startDate: l.startDate,
                        spanDays,
                        meta: l.status,
                        href: "/dashboard/leaves"
                    });
                }
                return days;
            }),
            ...invoices.map(i => ({
                id: `invoice-${i.id}`,
                sourceId: i.id,
                type: "invoice",
                title: `Invoice ${i.invoiceNumber}`,
                date: i.dueDate || new Date().toISOString(),
                meta: `${i.client?.name || "Client"} • $${i.total}`,
                href: `/dashboard/invoices/${i.id}`,
                isUndated: !i.dueDate
            })),
        ];

        return NextResponse.json({ events });
    } catch (error) {
        console.error("Calendar API error:", error);
        return NextResponse.json({ error: "Failed to load calendar" }, { status: 500 });
    }
}
