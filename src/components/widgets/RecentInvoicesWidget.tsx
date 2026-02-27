"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ArrowRight, Activity } from "lucide-react";
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
        <div className="h-full w-full flex flex-col p-6">
            <div className="flex items-center gap-3 mb-6">
                <FileText size={16} className="text-[var(--brand-cyan)]" />
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[var(--notion-text-secondary)]">
                    Recent Invoices
                </span>
            </div>

            <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="skeleton h-12 w-full rounded-md opacity-20" />
                    ))
                ) : invoices.length > 0 ? (
                    invoices.map((inv) => (
                        <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`} className="group no-underline block">
                            <div className="flex items-center justify-between py-2 px-3 rounded-md transition-all duration-300 hover:bg-[var(--notion-bg-tertiary)] hover:translate-x-1">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-[var(--notion-text)] group-hover:text-[var(--brand-cyan)] transition-colors">
                                        {inv.client?.name || "Unknown Client"}
                                    </span>
                                    <span className="text-[10px] font-mono tracking-widest text-[var(--notion-text-muted)]">
                                        {inv.invoiceNumber}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-light font-mono text-[var(--notion-text)]">
                                        ${inv.total.toLocaleString()}
                                    </span>
                                    <Badge variant={statusColors[inv.status] || "default"} size="sm" className="bg-transparent border border-[var(--notion-border)] text-[9px]">
                                        {inv.status}
                                    </Badge>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--notion-text-muted)] opacity-50">
                        <Activity size={20} strokeWidth={1} />
                        <span className="text-[9px] uppercase tracking-[0.3em] font-semibold">No Invoices Found</span>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--notion-border)] flex justify-end">
                <Link href="/dashboard/invoices" className="group flex flex-row items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--notion-text-muted)] hover:text-[var(--brand-cyan)] transition-colors no-underline">
                    View all
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
