"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { fetcher } from "@/lib/fetcher";
import { Plus, Calendar, CheckCircle, XCircle, Clock, User, TrendingUp } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/layout/Breadcrumb";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import Dropdown from "@/components/ui/Dropdown";
import { Card } from "@/components/ui/Card";
import { toast } from "sonner";

interface LeaveRequest {
    id: string;
    type: "ANNUAL" | "SICK" | "PERSONAL" | "MATERNITY" | "PATERNITY" | "UNPAID";
    startDate: string;
    endDate: string;
    reason: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: string;
    requester?: { id: string; firstName: string; lastName: string };
    approver?: { id: string; firstName: string; lastName: string } | null;
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

export default function LeavesPage() {
    const { data: session } = useSession();
    const { data: leaves = [], isLoading: loading, mutate } = useSWR<LeaveRequest[]>("/api/leaves", fetcher);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [formData, setFormData] = useState({ type: "ANNUAL", startDate: "", endDate: "", reason: "" });

    const isAdmin = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session?.user?.role || "");

    const leaveBalance = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const myLeaves = leaves.filter((l) => l.requester?.id === session?.user?.id && l.status === "APPROVED");
        const calculateDays = (start: string, end: string) => {
            const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        };
        const annual = myLeaves.filter(l => l.type === "ANNUAL" && new Date(l.startDate).getFullYear() === currentYear).reduce((sum, l) => sum + calculateDays(l.startDate, l.endDate), 0);
        const sick = myLeaves.filter(l => l.type === "SICK" && new Date(l.startDate).getFullYear() === currentYear).reduce((sum, l) => sum + calculateDays(l.startDate, l.endDate), 0);
        const personal = myLeaves.filter(l => l.type === "PERSONAL" && new Date(l.startDate).getFullYear() === currentYear).reduce((sum, l) => sum + calculateDays(l.startDate, l.endDate), 0);
        return { annual: { used: annual, total: 20 }, sick: { used: sick, total: 10 }, personal: { used: personal, total: 5 } };
    }, [leaves, session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const nameParts = (session?.user?.name || "").split(" ");
        const tempLeave: LeaveRequest = {
            id: `temp-${Date.now()}`,
            type: formData.type as LeaveRequest["type"],
            startDate: formData.startDate,
            endDate: formData.endDate,
            reason: formData.reason,
            status: "PENDING",
            createdAt: new Date().toISOString(),
            requester: { id: session?.user?.id || "", firstName: nameParts[0] || "", lastName: nameParts.slice(1).join(" ") || "" },
            approver: null,
        };
        mutate([...leaves, tempLeave], false);
        setShowModal(false);
        setFormData({ type: "ANNUAL", startDate: "", endDate: "", reason: "" });
        toast.success("Leave request submitted");

        try {
            const res = await fetch("/api/leaves", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
            if (!res.ok) throw new Error("Failed");
            mutate();
        } catch (error) {
            console.error(error);
            mutate(); // revert
            toast.error("Failed to submit leave request");
        }
    };

    const handleAction = async (leaveId: string, status: "APPROVED" | "REJECTED") => {
        setActionLoading(leaveId);
        mutate(leaves.map(l => l.id === leaveId ? { ...l, status } : l), false);
        toast.success(`Leave ${status.toLowerCase()}`);

        try {
            const res = await fetch(`/api/leaves/${leaveId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
            if (!res.ok) throw new Error("Failed");
            mutate();
        } catch (error) {
            console.error(error);
            mutate(); // revert
            toast.error(`Failed to ${status.toLowerCase()} leave`);
        } finally { setActionLoading(null); }
    };

    const getTypeColor = (type: string) => {
        switch (type) { case "SICK": return "error"; case "ANNUAL": return "info"; case "PERSONAL": return "warning"; case "MATERNITY": case "PATERNITY": return "success"; default: return "default"; }
    };
    const getStatusColor = (status: string) => {
        switch (status) { case "APPROVED": return "success"; case "REJECTED": return "error"; case "PENDING": return "warning"; default: return "default"; }
    };

    const columns = [
        { key: "type", header: "Type", render: (val: string) => <Badge variant={getTypeColor(val)}>{val}</Badge> },
        { key: "startDate", header: "From", render: (val: string) => <span className="text-[12px]">{new Date(val).toLocaleDateString()}</span> },
        { key: "endDate", header: "To", render: (val: string) => <span className="text-[12px]">{new Date(val).toLocaleDateString()}</span> },
        { key: "reason", header: "Reason", render: (val: string) => <span className="text-[12px]" style={{ color: "var(--notion-text-secondary)" }}>{val}</span> },
        { key: "status", header: "Status", render: (val: string) => <Badge variant={getStatusColor(val)}>{val}</Badge> },
        ...(isAdmin ? [{ key: "requester", header: "Requested By", render: (val: any) => <span className="flex items-center gap-1.5 text-[12px]"><User size={12} className="text-muted" />{val ? `${val.firstName} ${val.lastName}` : "-"}</span> }] : []),
        {
            key: "actions", header: "Actions", render: (_: any, row: LeaveRequest) => {
                if (!isAdmin || row.status !== "PENDING") return null;
                return (
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleAction(row.id, "APPROVED")} loading={actionLoading === row.id} icon={<CheckCircle size={14} />}>Approve</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleAction(row.id, "REJECTED")} loading={actionLoading === row.id} icon={<XCircle size={14} />}>Reject</Button>
                    </div>
                );
            }
        }
    ];

    return (
        <PageContainer title="Leave Requests" icon="📋" action={<Button icon={<Plus size={14} />} onClick={() => setShowModal(true)}>Request Leave</Button>}>
            <Breadcrumb />

            {/* ═══ Leave Balance Metric Strip ═══ */}
            {!isAdmin && (
                <div className="mt-6 mb-8">
                    <SectionHeader title="Balance" trailing={`${new Date().getFullYear()}`} />
                    <div
                        className="flex items-center gap-0"
                        style={{ borderTop: "1px solid var(--brand-blue)", borderBottom: "1px solid var(--notion-border)" }}
                    >
                        {[
                            { label: "Annual", used: leaveBalance.annual.used, total: leaveBalance.annual.total, color: "var(--notion-blue)" },
                            { label: "Sick", used: leaveBalance.sick.used, total: leaveBalance.sick.total, color: "var(--notion-red)" },
                            { label: "Personal", used: leaveBalance.personal.used, total: leaveBalance.personal.total, color: "var(--brand-blue)" },
                        ].map((b, i) => (
                            <div key={b.label} className="flex flex-col items-center justify-center py-5 flex-1" style={{ borderLeft: i > 0 ? "1px solid var(--notion-border)" : "none" }}>
                                <span className="text-4xl font-extralight tabular-nums leading-none tracking-tighter" style={{ color: b.color }}>
                                    {b.total - b.used}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-[0.3em] mt-1" style={{ color: "var(--notion-text-secondary)" }}>{b.label}</span>
                                <span className="text-[9px] font-mono mt-0.5 opacity-40" style={{ color: "var(--notion-text-muted)" }}>{b.used}/{b.total} used</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ Table ═══ */}
            <SectionHeader title="All Requests" trailing={`${leaves.length} total`} />
            {loading ? (
                <div className="flex flex-col gap-2">{[1, 2, 3].map(i => <div key={i} className="skeleton h-12 w-full rounded-sm" />)}</div>
            ) : leaves.length > 0 ? (
                <Table columns={columns} data={leaves} />
            ) : (
                <EmptyState title="No leave requests" description="Your leave requests will appear here." action={<Button onClick={() => setShowModal(true)}>Request Leave</Button>} />
            )}

            {/* ═══ Modal ═══ */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Request Leave">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: "var(--notion-text-secondary)" }}>Leave Type</label>
                        <Dropdown options={[{ value: "ANNUAL", label: "Annual" }, { value: "SICK", label: "Sick" }, { value: "PERSONAL", label: "Personal" }, { value: "MATERNITY", label: "Maternity" }, { value: "PATERNITY", label: "Paternity" }, { value: "UNPAID", label: "Unpaid" }]} value={formData.type} onChange={(val) => setFormData({ ...formData, type: val })} />
                    </div>
                    <div className="responsive-stack">
                        <div style={{ flex: 1 }}><Input type="date" label="Start Date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required /></div>
                        <div style={{ flex: 1 }}><Input type="date" label="End Date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required /></div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: "var(--notion-text-secondary)" }}>Reason</label>
                        <textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} rows={4} required style={{ width: "100%", background: "var(--notion-bg-secondary)", border: "1px solid var(--notion-border)", color: "var(--notion-text)", padding: "8px 12px", borderRadius: "2px", resize: "vertical", fontSize: "14px", fontFamily: "var(--font-body)", outline: "none" }} />
                    </div>
                    <div className="flex justify-end gap-3 mt-2">
                        <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">Submit Request</Button>
                    </div>
                </form>
            </Modal>
        </PageContainer>
    );
}
