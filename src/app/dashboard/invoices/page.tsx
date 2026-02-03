"use client";

import { useSession } from "next-auth/react";
import useSWR from "swr";
import Link from "next/link";
import { Plus, FileText, Download, MoreHorizontal, Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { createPortal } from "react-dom";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function InvoicesPage() {
    const { data: session } = useSession();
    const { data: invoices, error, isLoading } = useSWR("/api/invoices", fetcher);

    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

    // Close menu when clicking outside
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

        if (openMenuId === id) {
            setOpenMenuId(null);
        } else {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const menuHeight = 120; // Estimated height of the menu

            // Check if there's enough space below. If not, show above.
            const spaceBelow = viewportHeight - rect.bottom;
            const shouldFlip = spaceBelow < menuHeight && rect.top > menuHeight;

            setMenuPosition({
                top: (shouldFlip ? rect.top - menuHeight : rect.bottom) + window.scrollY,
                left: rect.right + window.scrollX - 120
            });
            setOpenMenuId(id);
        }
    };

    if (isLoading) {
        return (
            <div className="fade-in">
                <DashboardHeader title="Invoices" hideActions={true} />
                <div className="page-section">
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
                        <div className="skeleton" style={{ width: "140px", height: "38px", borderRadius: "4px" }}></div>
                    </div>
                    <div style={{
                        backgroundColor: "var(--notion-bg-secondary)",
                        border: "1px solid var(--notion-border)",
                        borderRadius: "8px",
                        overflow: "hidden"
                    }}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} style={{ padding: "16px", borderBottom: "1px solid var(--notion-divider)", display: "flex", gap: "24px" }}>
                                <div className="skeleton" style={{ width: "100px", height: "16px" }}></div>
                                <div className="skeleton" style={{ width: "150px", height: "16px" }}></div>
                                <div className="skeleton" style={{ width: "80px", height: "16px" }}></div>
                                <div className="skeleton" style={{ flex: 1, height: "16px" }}></div>
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
                <div className="page-section" style={{ paddingTop: "64px", textAlign: "center", color: "var(--notion-text-muted)" }}>
                    <AlertCircle size={48} strokeWidth={1} style={{ marginBottom: "16px", opacity: 0.5 }} />
                    <p style={{ marginBottom: "8px", color: "var(--notion-text)" }}>Unable to load invoices</p>
                    <p style={{ fontSize: "14px" }}>Please check your connection and try again.</p>
                </div>
            </div>
        );
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this invoice?")) return;

        try {
            await fetch(`/api/invoices/${id}`, { method: "DELETE" });
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert("Failed to delete invoice");
        }
    };

    return (
        <div className="fade-in">
            <DashboardHeader title="Invoices" hideActions={true} />

            <div className="page-section">
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px",
                    marginBottom: "24px"
                }}>
                    <StatCard
                        label="Total Invoices"
                        value={invoices?.length || 0}
                        icon={<FileText size={18} />}
                    />
                    <StatCard
                        label="Completed"
                        value={invoices?.filter((i: any) => i.status === "COMPLETED").length || 0}
                        icon={<CheckCircle2 size={18} />}
                        color="var(--notion-green)"
                    />
                    <StatCard
                        label="Drafts"
                        value={invoices?.filter((i: any) => i.status === "DRAFT").length || 0}
                        icon={<Clock size={18} />}
                        color="var(--notion-yellow)"
                    />
                    <StatCard
                        label="Total Revenue"
                        value={`$${(invoices?.filter((i: any) => i.status === "COMPLETED").reduce((acc: number, i: any) => acc + i.total, 0) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        icon={<span style={{ fontSize: "16px" }}>$</span>}
                    />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                    <Link href="/dashboard/invoices/new">
                        <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Plus size={16} />
                            <span>New Invoice</span>
                        </button>
                    </Link>
                </div>

                <div className="table-scroll" style={{
                    backgroundColor: "var(--notion-bg-secondary)",
                    border: "1px solid var(--notion-border)",
                    borderRadius: "8px",
                    overflowX: "auto"
                }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--notion-border)" }}>
                                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", fontWeight: 600, color: "var(--notion-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Invoice</th>
                                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", fontWeight: 600, color: "var(--notion-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Client</th>
                                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", fontWeight: 600, color: "var(--notion-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date</th>
                                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", fontWeight: 600, color: "var(--notion-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</th>
                                <th style={{ textAlign: "right", padding: "12px 16px", fontSize: "11px", fontWeight: 600, color: "var(--notion-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Amount</th>
                                <th style={{
                                    width: "40px",
                                    position: "sticky",
                                    right: 0,
                                    backgroundColor: "var(--notion-bg-secondary)",
                                    zIndex: 2,
                                    borderLeft: "1px solid var(--notion-border)"
                                }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices && invoices.length > 0 ? (
                                invoices.map((inv: any) => (
                                    <tr key={inv.id} className="invoice-row" style={{ borderBottom: "1px solid var(--notion-divider)" }}>
                                        <td style={{ padding: "14px 16px", fontSize: "14px", fontFamily: "var(--font-mono)" }}>
                                            <span style={{
                                                backgroundColor: "var(--notion-bg-tertiary)",
                                                padding: "4px 8px",
                                                borderRadius: "4px",
                                                fontSize: "13px"
                                            }}>
                                                {inv.invoiceNumber}
                                            </span>
                                        </td>
                                        <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: 500 }}>
                                            {inv.client?.name || "Unknown Client"}
                                        </td>
                                        <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--notion-text-secondary)" }}>
                                            {new Date(inv.issueDate).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td style={{ padding: "14px 16px" }}>
                                            <StatusBadge status={inv.status} />
                                        </td>
                                        <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "14px", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                                            ${inv.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{
                                            padding: "14px 16px",
                                            textAlign: "center",
                                            position: "sticky",
                                            right: 0,
                                            backgroundColor: "inherit",
                                            zIndex: 2,
                                            borderLeft: "1px solid var(--notion-border)",
                                            boxShadow: "-4px 0 8px rgba(0,0,0,0.02)"
                                        }}>
                                            <button
                                                type="button"
                                                onClick={(e) => toggleMenu(e, inv.id)}
                                                className="hover-bg"
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    color: "var(--notion-text-muted)",
                                                    padding: "8px",
                                                    margin: "-4px",
                                                    borderRadius: "4px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    transition: "all 0.1s ease"
                                                }}
                                                aria-label="More actions"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="empty-state">
                                            <FileText size={40} strokeWidth={1} />
                                            <p style={{ marginBottom: "8px", color: "var(--notion-text)", fontSize: "15px" }}>No invoices yet</p>
                                            <p style={{ fontSize: "13px" }}>Create your first invoice to get started</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
                            borderRadius: "6px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                            zIndex: 9999,
                            minWidth: "120px",
                            padding: "4px",
                            textAlign: "left",
                            animation: "slideDown 0.1s ease-out"
                        }}
                    >
                        <Link href={`/dashboard/invoices/${openMenuId}`} style={{ textDecoration: "none" }}>
                            <div
                                className="hover-bg"
                                style={{
                                    padding: "8px 12px",
                                    fontSize: "13px",
                                    color: "var(--notion-text)",
                                    cursor: "pointer",
                                    borderRadius: "4px"
                                }}
                            >
                                Edit
                            </div>
                        </Link>
                        <div
                            onClick={() => {
                                handleDelete(openMenuId);
                                setOpenMenuId(null);
                            }}
                            className="hover-bg"
                            style={{
                                padding: "8px 12px",
                                fontSize: "13px",
                                color: "var(--notion-red)",
                                cursor: "pointer",
                                borderRadius: "4px"
                            }}
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

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color?: string }) {
    return (
        <div style={{
            backgroundColor: "var(--notion-bg-secondary)",
            border: "1px solid var(--notion-border)",
            borderRadius: "8px",
            padding: "20px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px"
        }}>
            <div>
                <div style={{ fontSize: "12px", color: "var(--notion-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {label}
                </div>
                <div style={{ fontSize: "24px", fontWeight: 600, color: color || "var(--notion-text)" }}>
                    {value}
                </div>
            </div>
            <div style={{
                padding: "8px",
                backgroundColor: color ? `${color}20` : "var(--notion-bg-tertiary)",
                borderRadius: "8px",
                color: color || "var(--notion-text-secondary)"
            }}>
                {icon}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const statusConfig: { [key: string]: { bg: string; color: string } } = {
        DRAFT: { bg: "rgba(255, 255, 255, 0.08)", color: "var(--notion-text-secondary)" },
        COMPLETED: { bg: "var(--notion-green-bg)", color: "var(--notion-green)" },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;

    return (
        <span style={{
            backgroundColor: config.bg,
            color: config.color,
            padding: "4px 10px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px"
        }}>
            {status}
        </span>
    );
}
