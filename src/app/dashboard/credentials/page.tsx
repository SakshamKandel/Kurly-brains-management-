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
import { toast } from "sonner";

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

interface User { id: string; firstName: string; lastName: string; email: string; }

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

export default function CredentialsPage() {
    const { data: session, status } = useSession();
    const fetcher = (url: string) => fetch(url).then((res) => res.json());
    const { data: credentialsData, error, mutate } = useSWR<ClientCredential[]>("/api/credentials", fetcher);
    const credentials = credentialsData || [];
    const loading = !credentialsData && !error;

    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
    const [showModal, setShowModal] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [newCredential, setNewCredential] = useState<NewCredentialForm>({
        clientName: "", serviceName: "", username: "", password: "", apiKey: "", url: "", notes: "", assignedToId: "", visibility: "PRIVATE",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    const userRole = session?.user?.role;
    const canCreate = userRole === "ADMIN" || userRole === "MANAGER" || userRole === "SUPER_ADMIN";

    useEffect(() => { if (canCreate) fetchUsers(); }, [canCreate]);

    const fetchUsers = async () => {
        try { const res = await fetch("/api/users"); if (res.ok) setUsers(await res.json()); }
        catch (e) { console.error("Failed users fetch", e); }
    };

    const togglePasswordVisibility = (id: string) => {
        setVisiblePasswords(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
    };

    const handleDelete = (id: string) => setConfirmDeleteId(id);

    const executeDelete = async (id: string) => {
        mutate(credentials.filter(c => c.id !== id), false);
        try {
            const res = await fetch(`/api/credentials?id=${id}`, { method: "DELETE" });
            if (res.ok) { mutate(); toast.success("Credential deleted"); }
            else { mutate(); toast.error("Failed to delete credential"); }
        } catch (error) { mutate(); console.error(error); toast.error("An error occurred"); }
        finally { setConfirmDeleteId(null); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        const assignee = users.find(u => u.id === newCredential.assignedToId);
        const nameParts = (session?.user?.name || "").split(" ");
        const tempCred: ClientCredential = {
            id: `temp-${Date.now()}`,
            ...newCredential,
            assignedTo: assignee || { id: "", firstName: "Unknown", lastName: "", email: "" },
            createdBy: { id: session?.user?.id || "", firstName: nameParts[0] || "", lastName: nameParts.slice(1).join(" ") || "" },
            createdAt: new Date().toISOString(),
        };
        mutate([...credentials, tempCred], false);
        setShowModal(false);
        setNewCredential({ clientName: "", serviceName: "", username: "", password: "", apiKey: "", url: "", notes: "", assignedToId: "", visibility: "PRIVATE" });
        toast.success("Credential created");

        try {
            const res = await fetch("/api/credentials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newCredential) });
            if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Failed"); }
            mutate();
        } catch (err: any) {
            mutate(); // revert
            setFormError(err.message);
            toast.error(err.message);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "8px 12px", borderRadius: "2px",
        border: "1px solid var(--notion-border)", backgroundColor: "var(--notion-bg)", fontSize: "14px", color: "var(--notion-text)", outline: "none",
    };

    const labelStyle: React.CSSProperties = {
        display: "block", marginBottom: "6px", fontSize: "11px", fontWeight: 600,
        color: "var(--notion-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em",
    };

    if (loading) {
        return (
            <PageContainer>
                <div className="flex flex-col items-center justify-center py-32 gap-2" style={{ color: "var(--notion-text-muted)" }}>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--brand-blue)" }} />
                    <span className="text-[11px] tracking-widest uppercase">Loading credentials</span>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer
            title="Client Credentials"
            icon={<Key size={32} />}
            action={
                canCreate && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] border-none cursor-pointer"
                        style={{ background: "var(--brand-blue)", color: "white", borderRadius: "2px" }}
                    >
                        <Plus size={12} />
                        Add New
                    </button>
                )
            }
        >
            <div className="mt-4">
                <SectionHeader title="Vault" trailing={`${credentials.length} credentials`} />
            </div>

            {credentials.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2" style={{ color: "var(--notion-text-muted)" }}>
                    <Key size={20} strokeWidth={1} />
                    <span className="text-[11px] tracking-widest uppercase">No credentials found</span>
                    <span className="text-[12px]" style={{ color: "var(--notion-text-secondary)" }}>
                        {canCreate ? "Add one to get started." : "Ask your admin to assign one to you."}
                    </span>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {credentials.map(cred => (
                        <div
                            key={cred.id}
                            className="group/cred relative overflow-hidden transition-all duration-300 hover:bg-[var(--notion-bg-tertiary)]"
                            style={{ background: "var(--notion-bg-secondary)", border: "1px solid var(--notion-border)", borderRadius: "2px" }}
                        >
                            {/* Lock accent */}
                            <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: "var(--brand-blue)" }} />

                            <div className="px-5 py-4 pl-6">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[14px] font-semibold" style={{ color: "var(--notion-text)" }}>{cred.clientName}</span>
                                        <Badge variant="info" size="sm">{cred.serviceName}</Badge>
                                        {cred.visibility !== 'PRIVATE' && <Badge variant="warning" size="sm">{cred.visibility}</Badge>}
                                    </div>
                                    {canCreate && (
                                        <button
                                            onClick={() => handleDelete(cred.id)}
                                            className="p-1 bg-transparent border-none cursor-pointer opacity-0 group-hover/cred:opacity-100 transition-opacity"
                                            style={{ color: "var(--notion-red)" }}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {cred.username && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--notion-text-muted)" }}>Username</span>
                                            <span className="font-mono text-[12px] px-2 py-1" style={{ background: "var(--notion-bg-tertiary)", borderRadius: "2px", color: "var(--notion-text)" }}>{cred.username}</span>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--notion-text-muted)" }}>Password</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-[12px] px-2 py-1" style={{ background: "var(--notion-bg-tertiary)", borderRadius: "2px", color: "var(--notion-text)" }}>
                                                {visiblePasswords.has(cred.id) ? cred.password : '••••••••••••'}
                                            </span>
                                            <button onClick={() => togglePasswordVisibility(cred.id)} className="p-0.5 border-none bg-transparent cursor-pointer transition-colors hover:text-[var(--brand-blue)]" style={{ color: "var(--notion-text-secondary)" }}>
                                                {visiblePasswords.has(cred.id) ? <EyeOff size={13} /> : <Eye size={13} />}
                                            </button>
                                        </div>
                                    </div>
                                    {cred.url && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--notion-text-muted)" }}>URL</span>
                                            <a href={cred.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[12px] hover:text-[var(--brand-blue)] transition-colors" style={{ color: "var(--notion-blue)" }}>
                                                {cred.url} <Globe size={10} />
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {cred.notes && (
                                    <div className="mt-3 text-[12px] italic" style={{ color: "var(--notion-text-secondary)" }}>{cred.notes}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ═══ Create Modal ═══ */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Client Credential">
                <form onSubmit={handleCreate} className="flex flex-col gap-4">
                    {formError && (
                        <div className="px-3 py-2 text-[12px]" style={{ background: "rgba(235, 87, 87, 0.1)", color: "var(--notion-red)", borderRadius: "2px" }}>{formError}</div>
                    )}
                    <div className="responsive-grid-2">
                        <div><label style={labelStyle}>Client Name *</label><input required type="text" value={newCredential.clientName} onChange={e => setNewCredential({ ...newCredential, clientName: e.target.value })} style={inputStyle} placeholder="e.g. Acme Corp" /></div>
                        <div><label style={labelStyle}>Service *</label><input required type="text" value={newCredential.serviceName} onChange={e => setNewCredential({ ...newCredential, serviceName: e.target.value })} style={inputStyle} placeholder="e.g. AWS, WordPress" /></div>
                    </div>
                    <div className="responsive-grid-2">
                        <div><label style={labelStyle}>Username</label><input type="text" value={newCredential.username} onChange={e => setNewCredential({ ...newCredential, username: e.target.value })} style={inputStyle} /></div>
                        <div><label style={labelStyle}>Password *</label><input required type="text" value={newCredential.password} onChange={e => setNewCredential({ ...newCredential, password: e.target.value })} style={inputStyle} /></div>
                    </div>
                    <div><label style={labelStyle}>Login URL</label><input type="url" value={newCredential.url} onChange={e => setNewCredential({ ...newCredential, url: e.target.value })} style={inputStyle} placeholder="https://..." /></div>
                    <div><label style={labelStyle}>Assigned To</label><select value={newCredential.assignedToId} onChange={e => setNewCredential({ ...newCredential, assignedToId: e.target.value })} style={inputStyle}><option value="">{newCredential.visibility === 'PRIVATE' ? "Select staff..." : "Everyone (Auto-assign to me)"}</option>{users.map(u => (<option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>))}</select></div>
                    <div><label style={labelStyle}>Visibility</label><select value={newCredential.visibility} onChange={e => setNewCredential({ ...newCredential, visibility: e.target.value as any })} style={inputStyle}><option value="PRIVATE">Private (Selected User Only)</option><option value="PUBLIC">Public (Everyone)</option><option value="TEAM">Team</option></select></div>
                    <div><label style={labelStyle}>Notes</label><textarea value={newCredential.notes} onChange={e => setNewCredential({ ...newCredential, notes: e.target.value })} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} /></div>
                    <div className="flex justify-end gap-3 mt-2">
                        <button type="button" onClick={() => setShowModal(false)} className="px-3 py-2 text-[13px] border-none bg-transparent cursor-pointer" style={{ color: "var(--notion-text-secondary)" }}>Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-[13px] border-none cursor-pointer" style={{ background: "var(--brand-blue)", color: "white", borderRadius: "2px", opacity: isSubmitting ? 0.7 : 1 }}>
                            {isSubmitting ? "Creating..." : "Create Credential"}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={!!confirmDeleteId}
                title="Delete Credential?"
                message="Are you sure you want to delete this credential? This action cannot be undone."
                confirmText="Yes, delete it"
                isDangerous={true}
                onConfirm={() => { if (confirmDeleteId) executeDelete(confirmDeleteId); }}
                onCancel={() => setConfirmDeleteId(null)}
            />
        </PageContainer>
    );
}
