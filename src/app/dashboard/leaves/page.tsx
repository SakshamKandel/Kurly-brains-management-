"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Calendar, CheckCircle, XCircle, Clock, User } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/layout/Breadcrumb";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import Dropdown from "@/components/ui/Dropdown";

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

export default function LeavesPage() {
    const { data: session } = useSession();
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        type: "ANNUAL",
        startDate: "",
        endDate: "",
        reason: ""
    });

    const isAdmin = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session?.user?.role || "");

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const res = await fetch("/api/leaves");
            if (res.ok) {
                const data = await res.json();
                setLeaves(data);
            }
        } catch (error) {
            console.error("Failed to fetch leaves:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/leaves", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                fetchLeaves();
                setShowModal(false);
                setFormData({ type: "ANNUAL", startDate: "", endDate: "", reason: "" });
            }
        } catch (error) {
            console.error("Failed to submit leave:", error);
        }
    };

    const handleAction = async (leaveId: string, status: "APPROVED" | "REJECTED") => {
        setActionLoading(leaveId);
        try {
            const res = await fetch(`/api/leaves/${leaveId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchLeaves();
            }
        } catch (error) {
            console.error("Failed to update leave:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "SICK": return "error";
            case "ANNUAL": return "info";
            case "PERSONAL": return "warning";
            default: return "default";
        }
    };

    const columns = [
        // Show requester for admins
        ...(isAdmin ? [{
            key: "requester",
            header: "Employee",
            render: (_: any, row: LeaveRequest) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'var(--notion-bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 500
                    }}>
                        {row.requester?.firstName?.[0]}{row.requester?.lastName?.[0]}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>
                        {row.requester?.firstName} {row.requester?.lastName}
                    </span>
                </div>
            )
        }] : []),
        {
            key: "type",
            header: "Type",
            render: (val: string) => (
                <Badge variant={getTypeColor(val) as any} size="sm">
                    {val}
                </Badge>
            )
        },
        {
            key: "startDate",
            header: "Duration",
            render: (_: any, row: LeaveRequest) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <Calendar size={14} className="text-muted" />
                    <span>
                        {new Date(row.startDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}
                        {" → "}
                        {new Date(row.endDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}
                    </span>
                </div>
            )
        },
        {
            key: "reason",
            header: "Reason",
            render: (val: string) => (
                <span style={{ fontSize: '13px', color: 'var(--notion-text-secondary)', maxWidth: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {val || "-"}
                </span>
            )
        },
        {
            key: "status",
            header: "Status",
            render: (val: string, row: LeaveRequest) => {
                const config = {
                    PENDING: { color: "warning", icon: Clock },
                    APPROVED: { color: "success", icon: CheckCircle },
                    REJECTED: { color: "error", icon: XCircle }
                };
                const { color, icon: Icon } = config[val as keyof typeof config];
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge variant={color as any} style={{ gap: '4px' }}>
                            <Icon size={12} /> {val}
                        </Badge>
                        {row.approver && (
                            <span style={{ fontSize: '11px', color: 'var(--notion-text-muted)' }}>
                                by {row.approver.firstName}
                            </span>
                        )}
                    </div>
                );
            }
        },
        // Show actions for admins on pending leaves
        ...(isAdmin ? [{
            key: "actions",
            header: "",
            align: "right" as const,
            render: (_: any, row: LeaveRequest) => {
                if (row.status !== "PENDING") return null;

                const isLoading = actionLoading === row.id;

                return (
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => handleAction(row.id, "APPROVED")}
                            disabled={isLoading}
                            style={{
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: 500,
                                background: 'var(--notion-green)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isLoading ? 'wait' : 'pointer',
                                opacity: isLoading ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            <CheckCircle size={12} />
                            Approve
                        </button>
                        <button
                            onClick={() => handleAction(row.id, "REJECTED")}
                            disabled={isLoading}
                            style={{
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: 500,
                                background: 'var(--notion-red)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isLoading ? 'wait' : 'pointer',
                                opacity: isLoading ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            <XCircle size={12} />
                            Reject
                        </button>
                    </div>
                );
            }
        }] : [])
    ];

    // Separate pending for admins
    const pendingLeaves = leaves.filter(l => l.status === "PENDING");
    const processedLeaves = leaves.filter(l => l.status !== "PENDING");

    return (
        <PageContainer
            title="Leaves"
            icon="📅"
            action={<Button icon={<Plus size={14} />} onClick={() => setShowModal(true)}>Request Leave</Button>}
        >
            <Breadcrumb />

            <div style={{ marginTop: '24px' }}>
                {loading ? (
                    <div className="skeleton" style={{ width: '100%', height: '200px' }} />
                ) : leaves.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {/* Pending Requests Section for Admins */}
                        {isAdmin && pendingLeaves.length > 0 && (
                            <div>
                                <h3 style={{
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: 'var(--notion-orange)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <Clock size={14} />
                                    Pending Approval ({pendingLeaves.length})
                                </h3>
                                <Table columns={columns} data={pendingLeaves} />
                            </div>
                        )}

                        {/* All/Processed Requests */}
                        <div>
                            {isAdmin && pendingLeaves.length > 0 && (
                                <h3 style={{
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: 'var(--notion-text-secondary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    marginBottom: '12px'
                                }}>
                                    Processed Requests
                                </h3>
                            )}
                            <Table columns={columns} data={isAdmin ? processedLeaves : leaves} />
                        </div>
                    </div>
                ) : (
                    <EmptyState
                        title="No leave requests"
                        description="You haven't requested any leaves yet."
                        action={<Button onClick={() => setShowModal(true)}>Request Leave</Button>}
                    />
                )}
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Leave Request">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '4px' }}>Leave Type</label>
                        <Dropdown
                            options={[
                                { value: "ANNUAL", label: "Annual Leave" },
                                { value: "SICK", label: "Sick Leave" },
                                { value: "PERSONAL", label: "Personal Leave" },
                                { value: "MATERNITY", label: "Maternity Leave" },
                                { value: "PATERNITY", label: "Paternity Leave" },
                                { value: "UNPAID", label: "Unpaid Leave" }
                            ]}
                            value={formData.type}
                            onChange={(val) => setFormData({ ...formData, type: val })}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                            <Input
                                type="date"
                                label="From"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <Input
                                type="date"
                                label="To"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label className="text-xs text-muted">Reason</label>
                        <textarea
                            style={{
                                backgroundColor: 'var(--notion-bg-secondary)',
                                border: '1px solid var(--notion-border)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '8px 12px',
                                color: 'var(--notion-text)',
                                fontSize: '14px',
                                fontFamily: 'var(--font-body)',
                                outline: 'none',
                                resize: 'vertical'
                            }}
                            rows={3}
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="Reason for leave..."
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                        <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">Submit Request</Button>
                    </div>
                </form>
            </Modal>
        </PageContainer>
    );
}
