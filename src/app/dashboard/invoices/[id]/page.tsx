"use client";

import { use, useState, useEffect } from "react";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { AlertCircle } from "lucide-react";

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use()
    const { id } = use(params);
    const [invoice, setInvoice] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const res = await fetch(`/api/invoices/${id}`);
                if (!res.ok) {
                    const text = await res.text();
                    console.error(`Fetch failed: ${res.status} ${res.statusText}`, text);
                    throw new Error(`Failed to fetch invoice: ${res.status} ${res.statusText}`);
                }
                const data = await res.json();
                setInvoice(data);
            } catch (err) {
                console.error(err);
                setError("Failed to load invoice");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvoice();
    }, [id]);

    if (isLoading) {
        return (
            <div className="fade-in">
                <div style={{ padding: "32px", textAlign: "center", color: "var(--notion-text-muted)" }}>
                    Loading...
                </div>
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="fade-in">
                <DashboardHeader title="Edit Invoice" />
                <div style={{ padding: "64px 32px", textAlign: "center", color: "var(--notion-text-muted)" }}>
                    <AlertCircle size={48} strokeWidth={1} style={{ marginBottom: "16px", opacity: 0.5 }} />
                    <p style={{ marginBottom: "8px", color: "var(--notion-text)" }}>{error || "Invoice not found"}</p>
                </div>
            </div>
        );
    }

    return <InvoiceForm initialData={invoice} isEditing={true} />;
}
