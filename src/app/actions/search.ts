"use server";

import prisma from "@/lib/prisma"; // Assuming this is where prisma client is exported
import { auth } from "@/lib/auth"; // or wherever auth is located to get current user session
import { Prisma } from "@prisma/client";

export type SearchResults = {
    users: { id: string; name: string; email: string; avatar: string | null; role: string }[];
    tasks: { id: string; title: string; priority: string; status: string }[];
    invoices: { id: string; invoiceNumber: string; clientName: string; total: number; status: string }[];
    messages: { id: string; content: string; senderName: string; createdAt: Date }[];
};

export async function globalSearch(query: string): Promise<SearchResults> {
    if (!query || query.length < 2) {
        return { users: [], tasks: [], invoices: [], messages: [] };
    }

    // TODO: Add proper auth check
    // const session = await auth();
    // if (!session?.user) return ...

    const limit = 5;

    const [users, tasks, invoices, messages] = await Promise.all([
        // Search Users
        prisma.user.findMany({
            where: {
                OR: [
                    { firstName: { contains: query, mode: "insensitive" } },
                    { lastName: { contains: query, mode: "insensitive" } },
                    { email: { contains: query, mode: "insensitive" } },
                ],
            },
            take: limit,
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
        }),

        // Search Tasks
        prisma.task.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: "insensitive" } },
                ],
            },
            take: limit,
            select: { id: true, title: true, priority: true, status: true },
        }),

        // Search Invoices
        prisma.invoice.findMany({
            where: {
                OR: [
                    { invoiceNumber: { contains: query, mode: "insensitive" } },
                    { client: { name: { contains: query, mode: "insensitive" } } },
                ],
            },
            take: limit,
            include: { client: { select: { name: true } } },
        }),

        // Search Messages
        prisma.message.findMany({
            where: {
                content: { contains: query, mode: "insensitive" },
            },
            take: limit,
            include: { sender: { select: { firstName: true, lastName: true } } },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    return {
        users: users.map((u) => ({
            id: u.id,
            name: `${u.firstName} ${u.lastName}`,
            email: u.email,
            avatar: u.avatar,
            role: u.role,
        })),
        tasks: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            status: t.status,
        })),
        invoices: invoices.map((i) => ({
            id: i.id,
            invoiceNumber: i.invoiceNumber,
            clientName: i.client.name,
            total: i.total,
            status: i.status,
        })),
        messages: messages.map((m) => ({
            id: m.id,
            content: m.content.substring(0, 50) + (m.content.length > 50 ? "..." : ""),
            senderName: `${m.sender.firstName} ${m.sender.lastName}`,
            createdAt: m.createdAt,
        })),
    };
}
