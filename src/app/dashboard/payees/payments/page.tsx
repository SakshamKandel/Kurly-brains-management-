"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
    ArrowLeft,
    Calendar,
    DollarSign,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Search,
    FileText,
    Printer,
} from "lucide-react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Payment {
    id: string;
    payerId: string;
    payeeId: string;
    amount: number;
    currency: string;
    paymentDate: string;
    payPeriodStart: string;
    payPeriodEnd: string;
    baseSalary: number;
    deductions: number;
    bonuses: number;
    netPay: number;
    status: string;
    notes?: string;
    createdAt: string;
    payer: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
    };
    payee: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
        department?: string;
        position?: string;
    };
}

export default function PaymentsPage() {
    const { data: payments, error, isLoading } = useSWR<Payment[]>("/api/payments", fetcher);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

    // Filter payments
    const filteredPayments = payments?.filter((payment) => {
        const matchesSearch =
            `${payment.payee.firstName} ${payment.payee.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payment.payee.department?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === "all" || payment.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Stats
    const totalPaid = payments?.filter(p => p.status === "COMPLETED")
        .reduce((acc, p) => acc + p.netPay, 0) || 0;
    const pendingCount = payments?.filter(p => p.status === "PENDING").length || 0;
    const completedCount = payments?.filter(p => p.status === "COMPLETED").length || 0;

    if (isLoading) {
        return (
            <div className="fade-in">
                <DashboardHeader title="Payment History" hideActions={true} />
                <div className="page-section">
                    <div className="skeleton" style={{ height: "400px", borderRadius: "8px" }}></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fade-in">
                <DashboardHeader title="Payment History" hideActions={true} />
                <div className="page-section" style={{ paddingTop: "64px", textAlign: "center" }}>
                    <AlertCircle size={48} strokeWidth={1} style={{ marginBottom: "16px", opacity: 0.5, color: "var(--notion-red)" }} />
                    <p style={{ marginBottom: "8px", color: "var(--notion-text)" }}>Unable to load payments</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <DashboardHeader title="Payment History" hideActions={true} />

            <div className="page-section">
                {/* Back Link */}
                <Link href="/dashboard/payees" style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--notion-text-muted)",
                    textDecoration: "none",
                    marginBottom: "20px",
                    fontSize: "13px",
                }}>
                    <ArrowLeft size={14} />
                    Back to Payees
                </Link>

                {/* Stats Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                    <StatCard label="Total Payments" value={payments?.length || 0} icon={<FileText size={18} />} />
                    <StatCard label="Completed" value={completedCount} icon={<CheckCircle2 size={18} />} color="var(--notion-green)" />
                    <StatCard label="Pending" value={pendingCount} icon={<Clock size={18} />} color="var(--notion-yellow)" />
                    <StatCard label="Total Paid" value={`NPR ${totalPaid.toLocaleString()}`} icon={<DollarSign size={18} />} color="var(--notion-blue)" />
                </div>

                {/* Filters */}
                <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "200px", maxWidth: "400px", position: "relative" }}>
                        <Search size={16} style={{
                            position: "absolute",
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "var(--notion-text-muted)",
                        }} />
                        <input
                            type="text"
                            placeholder="Search by payee name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 12px 10px 38px",
                                fontSize: "14px",
                                border: "1px solid var(--notion-border)",
                                borderRadius: "6px",
                                backgroundColor: "var(--notion-bg-secondary)",
                                color: "var(--notion-text)",
                            }}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1px solid var(--notion-border)",
                            backgroundColor: "var(--notion-bg-secondary)",
                            color: "var(--notion-text)",
                            fontSize: "14px",
                        }}
                    >
                        <option value="all">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="FAILED">Failed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

                {/* Payments List */}
                {filteredPayments && filteredPayments.length > 0 ? (
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                    }}>
                        {filteredPayments.map((payment) => (
                            <div
                                key={payment.id}
                                onClick={() => setSelectedPayment(payment)}
                                className="hover-bg"
                                style={{
                                    backgroundColor: "var(--notion-bg-secondary)",
                                    border: "1px solid var(--notion-border)",
                                    borderRadius: "8px",
                                    padding: "16px 20px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px",
                                }}
                            >
                                <Avatar
                                    src={payment.payee.avatar}
                                    name={`${payment.payee.firstName} ${payment.payee.lastName}`}
                                    size="md"
                                    style={{ width: "44px", height: "44px" }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500, marginBottom: "4px" }}>
                                        {payment.payee.firstName} {payment.payee.lastName}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "var(--notion-text-muted)", display: "flex", gap: "12px" }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            <Calendar size={12} />
                                            {new Date(payment.paymentDate).toLocaleDateString()}
                                        </span>
                                        <span>•</span>
                                        <span>{payment.payee.department || "No Dept"}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{
                                        fontSize: "16px",
                                        fontWeight: 600,
                                        fontFamily: "var(--font-mono)",
                                        color: payment.status === "COMPLETED" ? "var(--notion-green)" : "var(--notion-text)",
                                    }}>
                                        {payment.currency} {payment.netPay.toLocaleString()}
                                    </div>
                                    <PaymentStatusBadge status={payment.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={<FileText size={48} strokeWidth={1} />}
                        title="No payments found"
                        description={searchQuery ? "Try adjusting your search" : "Create payments from the Payees page"}
                    />
                )}
            </div>

            {/* Payment Detail Modal */}
            {selectedPayment && (
                <PaymentDetailModal
                    payment={selectedPayment}
                    onClose={() => setSelectedPayment(null)}
                />
            )}
        </div>
    );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color?: string }) {
    return (
        <div style={{
            backgroundColor: "var(--notion-bg-secondary)",
            border: "1px solid var(--notion-border)",
            borderRadius: "8px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
        }}>
            <div style={{
                padding: "8px",
                backgroundColor: color ? `${color}20` : "var(--notion-bg-tertiary)",
                borderRadius: "8px",
                color: color || "var(--notion-text-secondary)",
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: "11px", color: "var(--notion-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {label}
                </div>
                <div style={{ fontSize: "18px", fontWeight: 600, color: color || "var(--notion-text)" }}>
                    {value}
                </div>
            </div>
        </div>
    );
}

function PaymentStatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
        PENDING: { bg: "rgba(255, 180, 0, 0.15)", color: "var(--notion-yellow)", icon: <Clock size={12} /> },
        PROCESSING: { bg: "rgba(0, 120, 255, 0.15)", color: "var(--notion-blue)", icon: <Clock size={12} /> },
        COMPLETED: { bg: "var(--notion-green-bg)", color: "var(--notion-green)", icon: <CheckCircle2 size={12} /> },
        FAILED: { bg: "rgba(255, 80, 80, 0.15)", color: "var(--notion-red)", icon: <XCircle size={12} /> },
        CANCELLED: { bg: "rgba(255, 255, 255, 0.08)", color: "var(--notion-text-muted)", icon: <XCircle size={12} /> },
    };

    const style = config[status] || config.PENDING;

    return (
        <span style={{
            backgroundColor: style.bg,
            color: style.color,
            padding: "4px 8px",
            borderRadius: "999px",
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
        }}>
            {style.icon}
            {status}
        </span>
    );
}

function PaymentDetailModal({ payment, onClose }: { payment: Payment; onClose: () => void }) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal payslip-print"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: "500px",
                    width: "90%",
                    maxHeight: "90vh",
                    overflow: "auto",
                    margin: "0 20px",
                }}
            >
                {/* Header */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "20px 24px",
                    borderBottom: "1px solid var(--notion-border)",
                }}>
                    <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
                        Payment Details
                    </h2>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={handlePrint} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }}>
                            <Printer size={14} style={{ marginRight: "4px" }} />
                            Print
                        </button>
                    </div>
                </div>

                {/* Payslip Content */}
                <div style={{ padding: "24px" }}>
                    {/* Employee Info */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                        <Avatar
                            src={payment.payee.avatar}
                            name={`${payment.payee.firstName} ${payment.payee.lastName}`}
                            size="lg"
                            style={{ width: "48px", height: "48px" }}
                        />
                        <div>
                            <div style={{ fontWeight: 600, fontSize: "16px" }}>
                                {payment.payee.firstName} {payment.payee.lastName}
                            </div>
                            <div style={{ fontSize: "13px", color: "var(--notion-text-muted)" }}>
                                {payment.payee.position || "Employee"} • {payment.payee.department || "No Department"}
                            </div>
                        </div>
                    </div>

                    {/* Pay Period */}
                    <div style={{
                        backgroundColor: "var(--notion-bg-secondary)",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}>
                        <div>
                            <div style={{ fontSize: "11px", color: "var(--notion-text-muted)", textTransform: "uppercase" }}>
                                Pay Period
                            </div>
                            <div style={{ fontSize: "14px", fontWeight: 500 }}>
                                {new Date(payment.payPeriodStart).toLocaleDateString()} - {new Date(payment.payPeriodEnd).toLocaleDateString()}
                            </div>
                        </div>
                        <PaymentStatusBadge status={payment.status} />
                    </div>

                    {/* Breakdown */}
                    <div style={{ marginBottom: "20px" }}>
                        <div style={rowStyle}>
                            <span>Base Salary</span>
                            <span style={{ fontFamily: "var(--font-mono)" }}>{payment.currency} {payment.baseSalary.toLocaleString()}</span>
                        </div>
                        {payment.bonuses > 0 && (
                            <div style={{ ...rowStyle, color: "var(--notion-green)" }}>
                                <span>+ Bonuses</span>
                                <span style={{ fontFamily: "var(--font-mono)" }}>{payment.currency} {payment.bonuses.toLocaleString()}</span>
                            </div>
                        )}
                        {payment.deductions > 0 && (
                            <div style={{ ...rowStyle, color: "var(--notion-red)" }}>
                                <span>- Deductions</span>
                                <span style={{ fontFamily: "var(--font-mono)" }}>{payment.currency} {payment.deductions.toLocaleString()}</span>
                            </div>
                        )}
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "12px 0",
                            borderTop: "2px solid var(--notion-border)",
                            marginTop: "8px",
                            fontSize: "16px",
                            fontWeight: 600,
                        }}>
                            <span>Net Pay</span>
                            <span style={{
                                fontFamily: "var(--font-mono)",
                                color: "var(--notion-green)",
                            }}>
                                {payment.currency} {payment.netPay.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div style={{ fontSize: "12px", color: "var(--notion-text-muted)" }}>
                        <div style={{ marginBottom: "4px" }}>
                            <strong>Payment Date:</strong> {new Date(payment.paymentDate).toLocaleDateString()}
                        </div>
                        <div style={{ marginBottom: "4px" }}>
                            <strong>Processed By:</strong> {payment.payer.firstName} {payment.payer.lastName}
                        </div>
                        {payment.notes && (
                            <div>
                                <strong>Notes:</strong> {payment.notes}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: "16px 24px",
                    borderTop: "1px solid var(--notion-border)",
                    backgroundColor: "var(--notion-bg-secondary)",
                    display: "flex",
                    justifyContent: "flex-end",
                }}>
                    <button onClick={onClose} className="btn-primary">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    fontSize: "14px",
    borderBottom: "1px solid var(--notion-divider)",
};
