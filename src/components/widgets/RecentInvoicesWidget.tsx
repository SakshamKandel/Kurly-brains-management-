"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { FileText, ArrowRight } from "lucide-react";
import Badge from "@/components/ui/Badge";

interface InvoicePreview {
    id: string;
    invoiceNumber: string;
    client: { name: string };
    total: number;
    status: string;
    dueDate: string;
}

export default function RecentInvoicesWidget() {
    const [invoices, setInvoices] = useState<InvoicePreview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const res = await fetch("/api/invoices");
                if (res.ok) {
                    const data = await res.json();
                    // Take top 5 recent
                    setInvoices(data.slice(0, 5));
                }
            } catch (error) {
                console.error("Failed to fetch recent invoices", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoices();
    }, []);

    const statusColors: Record<string, "default" | "info" | "warning" | "success" | "error"> = {
        DRAFT: "default",
        COMPLETED: "success"
    };

    return (
        <Card>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "var(--notion-text)" }}>
                <FileText size={18} />
                <span style={{ fontSize: "14px", fontWeight: 600 }}>Recent Invoices</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {loading ? (
                    // Skeletons
                    [1, 2, 3].map(i => (
                        <div key={i} className="skeleton" style={{ height: "40px", width: "100%", borderRadius: "6px" }} />
                    ))
                ) : invoices.length > 0 ? (
                    invoices.map((inv) => (
                        <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`} style={{ textDecoration: "none" }}>
                            <div
                                className="hover-bg"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "8px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid transparent",
                                    transition: "all 0.1s ease",
                                    cursor: "pointer"
                                }}
                            >
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--notion-text)" }}>
                                        {inv.client?.name || "Unknown Client"}
                                    </span>
                                    <span style={{ fontSize: "11px", color: "var(--notion-text-muted)" }}>
                                        {inv.invoiceNumber}
                                    </span>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--notion-text)" }}>
                                        ${inv.total.toLocaleString()}
                                    </span>
                                    <Badge variant={statusColors[inv.status] || "default"} size="sm">
                                        {inv.status}
                                    </Badge>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div style={{ padding: "16px", textAlign: "center", color: "var(--notion-text-muted)", fontSize: "13px", fontStyle: "italic" }}>
                        No invoices found.
                    </div>
                )}
            </div>

            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--notion-divider)", display: "flex", justifyContent: "flex-end" }}>
                <Link href="/dashboard/invoices" style={{ fontSize: "12px", color: "var(--notion-text-secondary)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                    View all <ArrowRight size={12} />
                </Link>
            </div>
        </Card>
    );
}
