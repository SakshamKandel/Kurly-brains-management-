import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/invoices/[id] - Get single invoice
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                client: true,
                items: true,
                creator: {
                    select: { firstName: true, lastName: true, email: true }
                }
            }
        });

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        return NextResponse.json(invoice);

    } catch (error: any) {
        console.error("Error fetching invoice:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch invoice" }, { status: 500 });
    }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const {
            clientName,
            clientEmail,
            clientAddress,
            items,
            status,
            notes,
            issueDate,
            dueDate,
            taxRate,
            billedByName,
            billedByPosition
        } = body;

        // Check existence
        const existingInvoice = await prisma.invoice.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!existingInvoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        // Handle Client Update (or create new if name changed significantly? For now update generic client if linked)
        // If the invoice has a clientId, we update that client. 
        if (existingInvoice.clientId) {
            await prisma.client.update({
                where: { id: existingInvoice.clientId },
                data: {
                    name: clientName,
                    email: clientEmail,
                    address: clientAddress
                }
            });
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

        // Update Invoice
        // We delete all existing items and recreate them to handle additions/removals easily
        const updatedInvoice = await prisma.invoice.update({
            where: { id },
            data: {
                status: status || existingInvoice.status,
                issueDate: issueDate ? new Date(issueDate) : existingInvoice.issueDate,
                dueDate: dueDate ? new Date(dueDate) : existingInvoice.dueDate,
                subtotal,
                taxRate: taxRate || 0,
                taxAmount,
                total,
                notes,
                billedByName,
                billedByPosition,
                items: {
                    deleteMany: {},
                    create: invoiceItems
                }
            },
            include: {
                client: true,
                items: true
            }
        });

        return NextResponse.json(updatedInvoice);

    } catch (error) {
        console.error("Error updating invoice:", error);
        return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
    }
}

// DELETE /api/invoices/[id] - Delete invoice
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Optional: Check permissions (only creator or admin can delete?)

        await prisma.invoice.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error deleting invoice:", error);
        return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
    }
}
