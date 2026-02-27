"use client";

import { useSession } from "next-auth/react";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import { Plus, FileText, Download, MoreHorizontal, Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { createPortal } from "react-dom";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/* ─── Section Header ─── */
function SectionHeader({ title, trailing }: { title: string; trailing?: string }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--brand-blue)" }} />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: "var(--notion-text-secondary)" }}>
                {title}
            </h3>
            <div className="flex-1 h-px" style={{ background: "var(--notion-border)" }} />
            {trailing && (
                <span className="text-[9px] font-mono tracking-widest uppercase opacity-40" style={{ color: "var(--notion-text-secondary)" }}>
                    {trailing}
                </span>
            )}
        </div>
    );
}

export default function InvoicesPage() {
    const { data: session } = useSession();
    const { data: invoices, error, isLoading, mutate } = useSWR("/api/invoices", fetcher);

    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        window.addEventListener("click", handleClickOutside);
        window.addEventListener("scroll", handleClickOutside, true);
        return () => {
            window.removeEventListener("click", handleClickOutside);
            window.removeEventListener("scroll", handleClickOutside, true);
        };
    }, []);

    const toggleMenu = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (openMenuId === id) { setOpenMenuId(null); return; }
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const menuHeight = 120;
        const spaceBelow = viewportHeight - rect.bottom;
        const shouldFlip = spaceBelow < menuHeight && rect.top > menuHeight;
        setMenuPosition({
            top: (shouldFlip ? rect.top - menuHeight : rect.bottom) + window.scrollY,
            left: rect.right + window.scrollX - 120
        });
        setOpenMenuId(id);
    };

    if (isLoading) {
        return (
            <div className="fade-in">
                <DashboardHeader title="Invoices" hideActions={true} />
                <div className="page-section mt-6">
                    <div className="flex gap-4 mb-6">
                        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton flex-1 h-20 rounded-sm" />)}
                    </div>
                    <div style={{ border: "1px solid var(--notion-border)", borderRadius: "2px", overflow: "hidden" }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ padding: "16px", borderBottom: "1px solid var(--notion-divider)", display: "flex", gap: "24px" }}>
                                <div className="skeleton" style={{ width: "100px", height: "16px" }} />
                                <div className="skeleton" style={{ width: "150px", height: "16px" }} />
                                <div className="skeleton" style={{ width: "80px", height: "16px" }} />
                                <div className="skeleton" style={{ flex: 1, height: "16px" }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fade-in">
                <DashboardHeader title="Invoices" hideActions={true} />
                <div className="flex flex-col items-center justify-center py-32 gap-3" style={{ color: "var(--notion-text-muted)" }}>
                    <AlertCircle size={24} strokeWidth={1} />
                    <span className="text-[11px] tracking-widest uppercase">Unable to load invoices</span>
                    <span className="text-[12px]" style={{ color: "var(--notion-text-secondary)" }}>Please check your connection and try again.</span>
                </div>
            </div>
        );
    }

    const { mutate: globalMutate } = useSWRConfig();
    const refreshDashboard = () => { globalMutate("/api/admin/stats"); };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this invoice?")) return;
        mutate(invoices?.filter((i: any) => i.id !== id), false);
        try {
            await fetch(`/api/invoices/${id}`, { method: "DELETE" });
            mutate();
            refreshDashboard();
        } catch (e) { console.error(e); alert("Failed to delete invoice"); mutate(); }
    };

    const totalRevenue = invoices?.filter((i: any) => i.status === "COMPLETED").reduce((acc: number, i: any) => acc + i.total, 0) || 0;

    return (
        <div className="fade-in">
            <DashboardHeader title="Invoices" hideActions={true} />

            <div className="page-section mt-4">
                {/* ═══ Metric Strip ═══ */}
                <div
                    className="flex items-center gap-0 mb-8"
                    style={{ borderTop: "1px solid var(--brand-blue)", borderBottom: "1px solid var(--notion-border)" }}
                >
                    {[
                        { label: "Total", value: invoices?.length || 0, color: "var(--notion-text)" },
                        { label: "Completed", value: invoices?.filter((i: any) => i.status === "COMPLETED").length || 0, color: "var(--notion-green)" },
                        { label: "Drafts", value: invoices?.filter((i: any) => i.status === "DRAFT").length || 0, color: "var(--notion-text-secondary)" },
                        { label: "Revenue", value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: "var(--brand-blue)" },
                    ].map((m, i) => (
                        <div
                            key={m.label}
                            className="flex flex-col items-center justify-center py-5 flex-1"
                            style={{ borderLeft: i > 0 ? "1px solid var(--notion-border)" : "none" }}
                        >
                            <span className="text-3xl sm:text-4xl font-extralight tabular-nums leading-none tracking-tighter" style={{ color: m.color }}>
                                {m.value}
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-[0.3em] mt-2" style={{ color: "var(--notion-text-secondary)" }}>
                                {m.label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ═══ Action bar ═══ */}
                <div className="flex items-center justify-between mb-5">
                    <SectionHeader title="All Invoices" trailing={`${invoices?.length || 0} records`} />
                    <Link href="/dashboard/invoices/new">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] border-none cursor-pointer" style={{ background: "var(--brand-blue)", color: "white", borderRadius: "2px" }}>
                            <Plus size={12} />
                            New Invoice
                        </button>
                    </Link>
                </div>

                {/* ═══ Table ═══ */}
                <div
                    className="overflow-hidden"
                    style={{ border: "1px solid var(--notion-border)", borderRadius: "2px" }}
                >
                    <div className="h-[2px] w-full" style={{ background: "var(--notion-border)" }} />

                    <div className="table-scroll">
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ background: "var(--notion-bg-tertiary)" }}>
                                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--notion-text-muted)" }}>Invoice</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--notion-text-muted)" }}>Client</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--notion-text-muted)" }}>Date</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--notion-text-muted)" }}>Status</th>
                                    <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--notion-text-muted)" }}>Amount</th>
                                    <th style={{ width: "40px", position: "sticky", right: 0, background: "var(--notion-bg-tertiary)", zIndex: 2, borderLeft: "1px solid var(--notion-border)" }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices && invoices.length > 0 ? (
                                    invoices.map((inv: any) => (
                                        <tr
                                            key={inv.id}
                                            className="group/row transition-colors hover:bg-[var(--notion-bg-tertiary)]"
                                            style={{ borderBottom: "1px solid var(--notion-divider)" }}
                                        >
                                            <td className="px-4 py-3.5 text-[13px] font-mono">
                                                <span className="px-2 py-1 text-[12px]" style={{ background: "var(--notion-bg-tertiary)", borderRadius: "2px" }}>
                                                    {inv.invoiceNumber}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-[13px] font-medium" style={{ color: "var(--notion-text)" }}>
                                                {inv.client?.name || "Unknown Client"}
                                            </td>
                                            <td className="px-4 py-3.5 text-[12px]" style={{ color: "var(--notion-text-secondary)" }}>
                                                {new Date(inv.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <StatusBadge status={inv.status} />
                                            </td>
                                            <td className="px-4 py-3.5 text-right text-[13px] font-semibold font-mono" style={{ color: "var(--notion-text)" }}>
                                                ${inv.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ padding: "14px 12px", textAlign: "center", position: "sticky", right: 0, backgroundColor: "inherit", zIndex: 2, borderLeft: "1px solid var(--notion-border)" }}>
                                                <button
                                                    type="button"
                                                    onClick={(e) => toggleMenu(e, inv.id)}
                                                    className="p-1.5 border-none bg-transparent cursor-pointer transition-colors hover:text-[var(--brand-blue)]"
                                                    style={{ color: "var(--notion-text-muted)", display: "flex", alignItems: "center" }}
                                                    aria-label="More actions"
                                                >
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="flex flex-col items-center justify-center py-16 gap-2" style={{ color: "var(--notion-text-muted)" }}>
                                                <FileText size={20} strokeWidth={1} />
                                                <span className="text-[11px] tracking-widest uppercase">No invoices yet</span>
                                                <span className="text-[12px]" style={{ color: "var(--notion-text-secondary)" }}>Create your first invoice to get started</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Global Portal for Action Menu */}
                {openMenuId && typeof document !== 'undefined' && createPortal(
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: "absolute",
                            left: `${menuPosition.left}px`,
                            top: `${menuPosition.top + 4}px`,
                            backgroundColor: "var(--notion-bg)",
                            border: "1px solid var(--notion-border)",
                            borderRadius: "2px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                            zIndex: 9999,
                            minWidth: "120px",
                            padding: "4px",
                            textAlign: "left",
                        }}
                    >
                        <Link href={`/dashboard/invoices/${openMenuId}`} style={{ textDecoration: "none" }}>
                            <div className="hover-bg px-3 py-2 text-[13px] cursor-pointer" style={{ color: "var(--notion-text)", borderRadius: "2px" }}>
                                Edit
                            </div>
                        </Link>
                        <div
                            onClick={() => { handleDelete(openMenuId); setOpenMenuId(null); }}
                            className="hover-bg px-3 py-2 text-[13px] cursor-pointer"
                            style={{ color: "var(--notion-red)", borderRadius: "2px" }}
                        >
                            Delete
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const isCompleted = status === "COMPLETED";
    return (
        <span
            className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em]"
            style={{
                background: isCompleted ? "var(--notion-green-bg)" : "var(--notion-bg-tertiary)",
                color: isCompleted ? "var(--notion-green)" : "var(--notion-text-secondary)",
                borderRadius: "2px",
                border: isCompleted ? "1px solid var(--notion-green)" : "1px solid var(--notion-border)",
            }}
        >
            {status}
        </span>
    );
}
