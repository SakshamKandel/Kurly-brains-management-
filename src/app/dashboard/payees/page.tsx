"use client";

import { useSession } from "next-auth/react";
import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";
import { Users, Wallet, Clock, CheckCircle2, AlertCircle, Search, Building2, DollarSign, MoreHorizontal, Edit2, FileText, Plus, Banknote, CreditCard } from "lucide-react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import BankDetailsModal from "@/components/payees/BankDetailsModal";
import SalaryModal from "@/components/payees/SalaryModal";
import PaymentModal from "@/components/payees/PaymentModal";

const fetcher = async (url: string) => {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "An error occurred");
    return data;
};

interface Payee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
    phone?: string | null;
    department?: string | null;
    position?: string | null;
    role: "ADMIN" | "STAFF" | "SUPER_ADMIN";
    status: string;
    bankDetails?: { id: string; bankName: string; accountNumber: string; accountHolder: string; accountType: string; country: string; } | null;
    salaryInfo?: { id: string; baseSalary: number; currency: string; payFrequency: string; paymentMethod: string; } | null;
    paymentsReceived?: { id: string; paymentDate: string; status: string; netPay: number; }[];
}

/* ─── Section Header ─── */
function SectionHeader({ title, trailing }: { title: string; trailing?: string }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--brand-blue)" }} />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: "var(--notion-text-secondary)" }}>{title}</h3>
            <div className="flex-1 h-px" style={{ background: "var(--notion-border)" }} />
            {trailing && <span className="text-[9px] font-mono tracking-widest uppercase opacity-40" style={{ color: "var(--notion-text-secondary)" }}>{trailing}</span>}
        </div>
    );
}

export default function PayeesPage() {
    const { data: session } = useSession();
    const { data: payees, error, isLoading, mutate } = useSWR<Payee[]>("/api/payees", fetcher);
    const [searchQuery, setSearchQuery] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState<string>("all");
    const [selectedPayee, setSelectedPayee] = useState<Payee | null>(null);
    const [modalType, setModalType] = useState<"bank" | "salary" | "payment" | null>(null);

    const filteredPayees = Array.isArray(payees) ? payees.filter((payee) => {
        const matchesSearch = `${payee.firstName} ${payee.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) || payee.email.toLowerCase().includes(searchQuery.toLowerCase()) || payee.department?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDepartment = departmentFilter === "all" || payee.department === departmentFilter;
        return matchesSearch && matchesDepartment;
    }) : [];

    const departments = Array.isArray(payees) ? [...new Set(payees.map((p) => p.department).filter(Boolean))] : [];
    const totalPayees = payees?.length || 0;
    const withBankDetails = payees?.filter((p) => p.bankDetails).length || 0;
    const pendingPayments = payees?.filter((p) => p.paymentsReceived?.[0]?.status === "PENDING").length || 0;
    const totalMonthlyPayroll = payees?.reduce((acc, p) => acc + (p.salaryInfo?.baseSalary || 0), 0) || 0;

    const openModal = (payee: Payee, type: "bank" | "salary" | "payment") => { setSelectedPayee(payee); setModalType(type); };
    const closeModal = () => { setSelectedPayee(null); setModalType(null); };

    if (isLoading) {
        return (
            <div className="fade-in">
                <DashboardHeader title="Payees" hideActions={true} />
                <div className="page-section mt-6">
                    <div className="flex gap-4 mb-6">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton flex-1 h-20 rounded-sm" />)}</div>
                    <div className="skeleton h-96 w-full rounded-sm" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fade-in">
                <DashboardHeader title="Payees" hideActions={true} />
                <div className="flex flex-col items-center justify-center py-32 gap-3" style={{ color: "var(--notion-text-muted)" }}>
                    <AlertCircle size={24} strokeWidth={1} />
                    <span className="text-[11px] tracking-widest uppercase">Unable to load payees</span>
                </div>
            </div>
        );
    }

    const thStyle: React.CSSProperties = { textAlign: "left", padding: "10px 16px", fontSize: "10px", fontWeight: 700, color: "var(--notion-text-muted)", textTransform: "uppercase", letterSpacing: "0.2em" };
    const tdStyle: React.CSSProperties = { padding: "12px 16px", fontSize: "13px" };

    return (
        <div className="fade-in">
            <DashboardHeader title="Payees" hideActions={true} />
            <div className="page-section mt-4">
                {/* ═══ Metric Strip ═══ */}
                <div className="flex items-center gap-0 mb-8" style={{ borderTop: "1px solid var(--brand-blue)", borderBottom: "1px solid var(--notion-border)" }}>
                    {[
                        { label: "Payees", value: totalPayees, color: "var(--notion-text)" },
                        { label: "Bank Set", value: withBankDetails, color: "var(--notion-green)" },
                        { label: "Pending", value: pendingPayments, color: "var(--notion-text-secondary)" },
                        { label: "Payroll", value: `NPR ${totalMonthlyPayroll.toLocaleString()}`, color: "var(--brand-blue)" },
                    ].map((m, i) => (
                        <div key={m.label} className="flex flex-col items-center justify-center py-5 flex-1" style={{ borderLeft: i > 0 ? "1px solid var(--notion-border)" : "none" }}>
                            <span className="text-2xl sm:text-3xl font-extralight tabular-nums leading-none tracking-tighter" style={{ color: m.color }}>{m.value}</span>
                            <span className="text-[9px] font-bold uppercase tracking-[0.3em] mt-2" style={{ color: "var(--notion-text-secondary)" }}>{m.label}</span>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex gap-3 flex-wrap items-center mb-5">
                    <div style={{ flex: 1, minWidth: "200px", maxWidth: "360px" }}>
                        <Input placeholder="Search payees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} icon={<Search size={14} />} />
                    </div>
                    <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        style={{ padding: "6px 12px", borderRadius: "2px", border: "1px solid var(--notion-border)", backgroundColor: "var(--notion-bg-secondary)", color: "var(--notion-text)", fontSize: "12px", cursor: "pointer", outline: "none" }}
                    >
                        <option value="all">All Departments</option>
                        {departments.map((dept) => (<option key={dept} value={dept!}>{dept}</option>))}
                    </select>
                    <Link href="/dashboard/payees/payments">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] border-none cursor-pointer transition-colors hover:text-[var(--brand-blue)]" style={{ background: "var(--notion-bg-tertiary)", color: "var(--notion-text-secondary)", borderRadius: "2px" }}>
                            <FileText size={12} /> History
                        </button>
                    </Link>
                </div>

                <SectionHeader title="Payroll Directory" trailing={`${filteredPayees.length} employees`} />

                {/* Table */}
                {filteredPayees && filteredPayees.length > 0 ? (
                    <div className="overflow-hidden" style={{ border: "1px solid var(--notion-border)", borderRadius: "2px" }}>
                        <div className="h-[2px] w-full" style={{ background: "var(--notion-border)" }} />
                        <div className="table-scroll">
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ background: "var(--notion-bg-tertiary)" }}>
                                        <th style={thStyle}>Employee</th>
                                        <th style={thStyle}>Bank Details</th>
                                        <th style={thStyle}>Salary</th>
                                        <th style={thStyle}>Last Payment</th>
                                        <th style={{ ...thStyle, width: "80px" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayees.map((payee) => (
                                        <tr key={payee.id} className="group/row transition-colors hover:bg-[var(--notion-bg-tertiary)]" style={{ borderBottom: "1px solid var(--notion-divider)" }}>
                                            <td style={tdStyle}>
                                                <div className="flex items-center gap-3">
                                                    <Avatar src={payee.avatar ?? undefined} name={`${payee.firstName} ${payee.lastName}`} size="md" />
                                                    <div>
                                                        <div className="text-[13px] font-medium" style={{ color: "var(--notion-text)" }}>{payee.firstName} {payee.lastName}</div>
                                                        <div className="text-[11px]" style={{ color: "var(--notion-text-muted)" }}>{payee.position || payee.role} · {payee.department || "No Dept"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                {payee.bankDetails ? (
                                                    <div>
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <Building2 size={12} style={{ color: "var(--notion-text-muted)" }} />
                                                            <span className="text-[12px]">{payee.bankDetails.bankName}</span>
                                                        </div>
                                                        <div className="text-[11px] font-mono" style={{ color: "var(--notion-text-muted)" }}>{payee.bankDetails.accountNumber}</div>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => openModal(payee, "bank")} className="flex items-center gap-1 px-2 py-1 text-[11px] border-none bg-transparent cursor-pointer" style={{ color: "var(--brand-blue)" }}>
                                                        <Plus size={12} /> Add Bank
                                                    </button>
                                                )}
                                            </td>
                                            <td style={tdStyle}>
                                                {payee.salaryInfo ? (
                                                    <div>
                                                        <div className="text-[13px] font-semibold font-mono">{payee.salaryInfo.currency} {payee.salaryInfo.baseSalary.toLocaleString()}</div>
                                                        <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--notion-text-muted)" }}>{payee.salaryInfo.payFrequency}</div>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => openModal(payee, "salary")} className="flex items-center gap-1 px-2 py-1 text-[11px] border-none bg-transparent cursor-pointer" style={{ color: "var(--brand-blue)" }}>
                                                        <Plus size={12} /> Set Salary
                                                    </button>
                                                )}
                                            </td>
                                            <td style={tdStyle}>
                                                {payee.paymentsReceived?.[0] ? (
                                                    <div>
                                                        <PaymentStatusBadge status={payee.paymentsReceived[0].status} />
                                                        <div className="text-[10px] mt-1" style={{ color: "var(--notion-text-muted)" }}>{new Date(payee.paymentsReceived[0].paymentDate).toLocaleDateString()}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px]" style={{ color: "var(--notion-text-muted)" }}>No payments</span>
                                                )}
                                            </td>
                                            <td style={tdStyle}>
                                                <div className="flex gap-1">
                                                    <button onClick={() => openModal(payee, "bank")} title="Edit Bank" className="p-1.5 border-none bg-transparent cursor-pointer transition-colors hover:text-[var(--brand-blue)]" style={{ color: "var(--notion-text-muted)" }}><CreditCard size={14} /></button>
                                                    <button onClick={() => openModal(payee, "salary")} title="Edit Salary" className="p-1.5 border-none bg-transparent cursor-pointer transition-colors hover:text-[var(--brand-blue)]" style={{ color: "var(--notion-text-muted)" }}><DollarSign size={14} /></button>
                                                    <button onClick={() => openModal(payee, "payment")} title="Create Payment" className="p-1.5 border-none bg-transparent cursor-pointer transition-colors hover:text-[var(--brand-blue)]" style={{ color: "var(--notion-text-muted)" }} disabled={!payee.salaryInfo}><Wallet size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <EmptyState icon={<Users size={48} strokeWidth={1} />} title="No payees found" description={searchQuery ? "Try adjusting your search" : "Add bank details and salary info to employees"} />
                )}
            </div>

            {modalType === "bank" && selectedPayee && <BankDetailsModal payee={selectedPayee} onClose={closeModal} onSave={() => { mutate(); closeModal(); }} />}
            {modalType === "salary" && selectedPayee && <SalaryModal payee={selectedPayee} onClose={closeModal} onSave={() => { mutate(); closeModal(); }} />}
            {modalType === "payment" && selectedPayee && <PaymentModal payee={selectedPayee} onClose={closeModal} onSave={() => { mutate(); closeModal(); }} />}
        </div>
    );
}

function PaymentStatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string; color: string; border: string }> = {
        PENDING: { bg: "rgba(255, 180, 0, 0.15)", color: "var(--notion-yellow)", border: "var(--notion-yellow)" },
        PROCESSING: { bg: "rgba(0, 120, 255, 0.15)", color: "var(--notion-blue)", border: "var(--notion-blue)" },
        COMPLETED: { bg: "var(--notion-green-bg)", color: "var(--notion-green)", border: "var(--notion-green)" },
        FAILED: { bg: "rgba(255, 80, 80, 0.15)", color: "var(--notion-red)", border: "var(--notion-red)" },
        CANCELLED: { bg: "rgba(255, 255, 255, 0.08)", color: "var(--notion-text-muted)", border: "var(--notion-border)" },
    };
    const style = config[status] || config.PENDING;
    return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ backgroundColor: style.bg, color: style.color, borderRadius: "2px", border: `1px solid ${style.border}` }}>
            {status}
        </span>
    );
}
