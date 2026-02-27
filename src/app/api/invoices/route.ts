import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, role: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // PERMISSIONS:
        // SUPER_ADMIN: See ALL invoices.
        // ADMIN/MANAGER: See invoices they created.
        // STAFF: See nothing (or maybe their own if we allowed staff invoicing, but sticking to Admin for now)

        const isSuperAdmin = user.role === "SUPER_ADMIN";

        const invoices = await prisma.invoice.findMany({
            where: isSuperAdmin ? {} : { creatorId: user.id },
            include: {
                client: true,
                items: true
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(invoices);
    } catch (error) {
        console.error("Error fetching invoices:", error);
        return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, role: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Only ADMIN, MANAGER, and SUPER_ADMIN can create invoices
        if (!["ADMIN", "MANAGER", "SUPER_ADMIN"].includes(user.role)) {
            return NextResponse.json({ error: "Only admins/managers can create invoices" }, { status: 403 });
        }

        const body = await request.json();
        const { clientName, clientEmail, clientAddress, items, status, notes, issueDate, dueDate, taxRate, billedByName, billedByPosition } = body;

        if (!clientName || !items || items.length === 0) {
            return NextResponse.json({ error: "Missing required fields (Client Name or Items)" }, { status: 400 });
        }

        // Handle Client: Create a new client on the fly for this invoice
        // In a real app, you might search for existing clients by email first, but for now we'll create new or just store text if schema allows.
        // Assuming schema requires a Client relation, let's create one.

        let clientId = body.clientId;

        if (!clientId && clientName) {
            // Create a new generic client for this invoice if not selecting from dropdown
            // To prevent clogging DB with duplicate "John Doe", we could search by name/email first.
            const existingClient = await prisma.client.findFirst({
                where: {
                    name: clientName,
                    email: clientEmail || undefined
                }
            });

            if (existingClient) {
                clientId = existingClient.id;
            } else {
                const newClient = await prisma.client.create({
                    data: {
                        name: clientName,
                        email: clientEmail || "",
                        address: clientAddress || "",
                        phone: "",
                        status: "ACTIVE"
                    }
                });
                clientId = newClient.id;
            }
        }

        // Calculate totals
        let subtotal = 0;
        const invoiceItems = items.map((item: any) => {
            const total = item.quantity * item.unitPrice;
            subtotal += total;
            return {
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total
            };
        });

        const taxAmount = subtotal * (taxRate || 0);
        const total = subtotal + taxAmount;

        // Generate unique Invoice Number using timestamp + random suffix
        const year = new Date().getFullYear();
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        const ts = Date.now().toString().slice(-6);
        const invoiceNumber = `INV-${year}-${ts}-${rand}`;

        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                status: status || "DRAFT",
                issueDate: new Date(issueDate || Date.now()),
                dueDate: dueDate ? new Date(dueDate) : null,
                clientId,
                creatorId: user.id,
                subtotal,
                taxRate: taxRate || 0,
                taxAmount,
                total,
                notes,
                billedByName,
                billedByPosition,
                items: {
                    create: invoiceItems
                }
            },
            include: {
                client: true,
                items: true
            }
        });

        return NextResponse.json(invoice);

    } catch (error) {
        console.error("Error creating invoice:", error);
        return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
    }
}
