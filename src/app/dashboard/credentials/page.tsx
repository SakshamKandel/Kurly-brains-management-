"use client";

import { useState, useEffect } from "react";
import { Key, Eye, EyeOff, Plus, Trash2, Globe, Server } from "lucide-react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import PageContainer from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { toast } from "sonner"; // Assuming sonner is installed from previous step

interface ClientCredential {
    id: string;
    clientName: string;
    serviceName: string;
    username?: string;
    password: string;
    apiKey?: string;
    url?: string;
    notes?: string;
    assignedTo: { id: string; firstName: string; lastName: string; email: string };
    createdBy: { id: string; firstName: string; lastName: string };
    visibility: "PRIVATE" | "TEAM" | "PUBLIC";
    createdAt: string;
}

interface NewCredentialForm {
    clientName: string;
    serviceName: string;
    username: string;
    password: string;
    apiKey: string;
    url: string;
    notes: string;
    assignedToId: string;
    visibility: "PRIVATE" | "TEAM" | "PUBLIC";
}

// Minimal User interface for the dropdown
interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export default function CredentialsPage() {
    const { data: session, status } = useSession();
    const fetcher = (url: string) => fetch(url).then((res) => res.json());
    const { data: credentialsData, error, mutate } = useSWR<ClientCredential[]>("/api/credentials", fetcher);
    const credentials = credentialsData || [];
    const loading = !credentialsData && !error;

    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

    // Add Credential State (Admin/Manager/SuperAdmin only)
    const [showModal, setShowModal] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const [users, setUsers] = useState<User[]>([]); // To populate assignee dropdown
    const [newCredential, setNewCredential] = useState<NewCredentialForm>({
        clientName: "",
        serviceName: "",
        username: "",
        password: "",
        apiKey: "",
        url: "",
        notes: "",
        assignedToId: "",
        visibility: "PRIVATE",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    const userRole = session?.user?.role;
    const canCreate = userRole === "ADMIN" || userRole === "MANAGER" || userRole === "SUPER_ADMIN";

    useEffect(() => {
        if (canCreate) {
            fetchUsers();
        }
    }, [canCreate]);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (e) {
            console.error("Failed users fetch", e);
        }
    };

    const togglePasswordVisibility = (id: string) => {
        setVisiblePasswords(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleDelete = (id: string) => {
        setConfirmDeleteId(id);
    };

    const executeDelete = async (id: string) => {
        // Optimistic update
        mutate(credentials.filter(c => c.id !== id), false);
        try {
            const res = await fetch(`/api/credentials?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                mutate(); // Revalidate
                toast.success("Credential deleted");
            } else {
                mutate(); // Revert
                toast.error("Failed to delete credential");
            }
        } catch (error) {
            mutate();
            console.error("Error deleting credential:", error);
            toast.error("An error occurred");
        } finally {
            setConfirmDeleteId(null);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/credentials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newCredential),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed");
            }

            mutate(); // Revalidate
            setShowModal(false);
            setNewCredential({
                clientName: "", serviceName: "", username: "", password: "", apiKey: "", url: "", notes: "", assignedToId: "", visibility: "PRIVATE"
            });
            toast.success("Credential created");
        } catch (err: any) {
            setFormError(err.message);
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <PageContainer><div style={{ padding: 48, textAlign: 'center', color: 'var(--notion-text-muted)' }}>Loading credentials...</div></PageContainer>;
    }

    const inputStyle = {
        width: "100%",
        padding: "8px 12px",
        borderRadius: "4px",
        border: "1px solid var(--notion-border)",
        backgroundColor: "var(--notion-bg)",
        fontSize: "14px",
        color: "var(--notion-text)",
    };

    const labelStyle = {
        display: "block",
        marginBottom: "6px",
        fontSize: "13px",
        fontWeight: 500,
        color: "var(--notion-text-secondary)",
    };

    return (
        <PageContainer
            title="Client Credentials"
            icon={<Key size={32} />}
            action={
                canCreate && (
                    <button
                        onClick={() => setShowModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 12px',
                            backgroundColor: 'var(--notion-blue)', color: 'white',
                            borderRadius: 'var(--radius-sm)', fontSize: '13px',
                            border: 'none', cursor: 'pointer', fontWeight: 500
                        }}
                    >
                        <Plus size={14} />
                        Add New
                    </button>
                )
            }
        >
            {credentials.length === 0 ? (
                <div style={{
                    border: '1px solid var(--notion-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '48px',
                    textAlign: 'center',
                    color: 'var(--notion-text-muted)'
                }}>
                    No credentials found. {canCreate ? "Add one to get started." : "Ask your admin to assign one to you."}
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {credentials.map(cred => (
                        <Card key={cred.id} padding="md">
                            <div className="responsive-stack" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <span style={{ fontWeight: 600, fontSize: '16px', color: 'var(--notion-text)' }}>{cred.clientName}</span>
                                        <Badge variant="info" size="sm">{cred.serviceName}</Badge>
                                        {cred.visibility !== 'PRIVATE' && <Badge variant="warning" size="sm">{cred.visibility}</Badge>}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', fontSize: '13px' }}>
                                        {cred.username && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ color: 'var(--notion-text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Username</span>
                                                <span style={{ fontFamily: 'monospace', background: 'var(--notion-bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>{cred.username}</span>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ color: 'var(--notion-text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Password</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontFamily: 'monospace', background: 'var(--notion-bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                                                    {visiblePasswords.has(cred.id) ? cred.password : '••••••••••••'}
                                                </span>
                                                <button onClick={() => togglePasswordVisibility(cred.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--notion-text-secondary)' }}>
                                                    {visiblePasswords.has(cred.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                        </div>

                                        {cred.url && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ color: 'var(--notion-text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>URL</span>
                                                <a href={cred.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--notion-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    {cred.url}
                                                    <Globe size={12} />
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {cred.notes && (
                                        <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--notion-text-secondary)', fontStyle: 'italic' }}>
                                            {cred.notes}
                                        </div>
                                    )}
                                </div>

                                {canCreate && (
                                    <button
                                        onClick={() => handleDelete(cred.id)}
                                        style={{ padding: '6px', color: 'var(--notion-red)', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.6 }}
                                        className="hover-opacity"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Client Credential">
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {formError && (
                        <div style={{ padding: '8px 12px', backgroundColor: 'var(--notion-red-bg)', color: 'var(--notion-red)', borderRadius: '4px', fontSize: '13px' }}>
                            {formError}
                        </div>
                    )}

                    <div className="responsive-grid-2">
                        <div>
                            <label style={labelStyle}>Client Name *</label>
                            <input required type="text" value={newCredential.clientName} onChange={e => setNewCredential({ ...newCredential, clientName: e.target.value })} style={inputStyle} placeholder="e.g. Acme Corp" />
                        </div>
                        <div>
                            <label style={labelStyle}>Service *</label>
                            <input required type="text" value={newCredential.serviceName} onChange={e => setNewCredential({ ...newCredential, serviceName: e.target.value })} style={inputStyle} placeholder="e.g. AWS, WordPress" />
                        </div>
                    </div>

                    <div className="responsive-grid-2">
                        <div>
                            <label style={labelStyle}>Username</label>
                            <input type="text" value={newCredential.username} onChange={e => setNewCredential({ ...newCredential, username: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Password *</label>
                            <input required type="text" value={newCredential.password} onChange={e => setNewCredential({ ...newCredential, password: e.target.value })} style={inputStyle} />
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Login URL</label>
                        <input type="url" value={newCredential.url} onChange={e => setNewCredential({ ...newCredential, url: e.target.value })} style={inputStyle} placeholder="https://..." />
                    </div>

                    <div>
                        <label style={labelStyle}>Assigned To</label>
                        <select
                            value={newCredential.assignedToId}
                            onChange={e => setNewCredential({ ...newCredential, assignedToId: e.target.value })}
                            style={inputStyle}
                        // Not required if Public/Team (handled by backend fallback)
                        >
                            <option value="">{newCredential.visibility === 'PRIVATE' ? "Select staff..." : "Everyone (Auto-assign to me)"}</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={labelStyle}>Visibility</label>
                        <select value={newCredential.visibility} onChange={e => setNewCredential({ ...newCredential, visibility: e.target.value as any })} style={inputStyle}>
                            <option value="PRIVATE">Private (Selected User Only)</option>
                            <option value="PUBLIC">Public (Everyone)</option>
                            <option value="TEAM">Team</option>
                        </select>
                    </div>

                    <div>
                        <label style={labelStyle}>Notes</label>
                        <textarea value={newCredential.notes} onChange={e => setNewCredential({ ...newCredential, notes: e.target.value })} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                        <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={isSubmitting} style={{ padding: '8px 16px', backgroundColor: 'var(--notion-blue)', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                            {isSubmitting ? "Creating..." : "Create Credential"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Custom AI Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!confirmDeleteId}
                title="Delete Credential?"
                message="Are you sure you want to delete this credential? This action cannot be undone."
                confirmText="Yes, delete it"
                isDangerous={true}
                onConfirm={() => {
                    if (confirmDeleteId) {
                        executeDelete(confirmDeleteId);
                    }
                }}
                onCancel={() => setConfirmDeleteId(null)}
            />
        </PageContainer>
    );
}
