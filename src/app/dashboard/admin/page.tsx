"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, CheckSquare, MessageSquare, DollarSign, UserPlus, Mail, MoreHorizontal, X, Key, Eye, EyeOff, Trash2, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  department?: string;
  position?: string;
  createdAt: string;
  avatar?: string | null;
}

interface NewStaffForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  department: string;
  position: string;
}

interface EditUserForm {
  id: string;
  role: string;
  department: string;
  position: string;
  status: string;
}

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

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalTasks: 0, totalMessages: 0 });
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [newStaff, setNewStaff] = useState<NewStaffForm>({
    firstName: "", lastName: "", email: "", password: "", role: "STAFF", department: "", position: "",
  });

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm>({ id: "", role: "", department: "", position: "", status: "" });
  const [showEditUserModal, setShowEditUserModal] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) { router.push("/login"); return; }
    const role = session.user.role;
    if (role !== "ADMIN" && role !== "MANAGER" && role !== "SUPER_ADMIN") {
      router.push("/dashboard");
    } else {
      setIsAuthorized(true);
    }
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      const usersRes = await fetch("/api/users", { cache: "no-store" });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
        setStats(prev => ({ ...prev, totalUsers: usersData.length }));
      }
    } catch (error) { console.error("Error fetching users:", error); }
  };

  useEffect(() => {
    if (!isAuthorized) return;
    const fetchData = async () => {
      try {
        await fetchUsers();
        const statsRes = await fetch("/api/admin/stats", { cache: "no-store" });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(prev => ({ ...prev, totalTasks: statsData.totalTasks || 0, totalMessages: statsData.totalMessages || 0 }));
        }
      } catch (error) { console.error("Error fetching admin data:", error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [isAuthorized]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(""); setFormSuccess(""); setIsSubmitting(true);
    try {
      const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newStaff) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Failed to create staff member"); }
      setFormSuccess("Staff member created successfully!");
      setNewStaff({ firstName: "", lastName: "", email: "", password: "", role: "STAFF", department: "", position: "" });
      await fetchUsers();
      setTimeout(() => { setShowAddModal(false); setFormSuccess(""); }, 1500);
    } catch (error) { setFormError(error instanceof Error ? error.message : "An error occurred"); }
    finally { setIsSubmitting(false); }
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({ id: user.id, role: user.role, department: user.department || "", position: user.position || "", status: user.status });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/users/${editForm.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
      if (res.ok) { await fetchUsers(); setShowEditUserModal(false); }
      else { alert("Failed to update user"); }
    } catch (error) { console.error("Error updating user:", error); }
  };

  const statCards = [
    { label: "Staff", value: stats.totalUsers, icon: Users, color: "var(--notion-blue)" },
    { label: "Tasks", value: stats.totalTasks, icon: CheckSquare, color: "var(--notion-green)" },
    { label: "Messages", value: stats.totalMessages, icon: MessageSquare, color: "var(--brand-blue)" },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN": return <Badge variant="purple" size="sm">{role}</Badge>;
      case "MANAGER": return <Badge variant="info" size="sm">{role}</Badge>;
      default: return <Badge variant="default" size="sm">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return <Badge variant="success" size="sm">{status}</Badge>;
      case "INACTIVE": return <Badge variant="warning" size="sm">{status}</Badge>;
      case "SUSPENDED": return <Badge variant="error" size="sm">{status}</Badge>;
      default: return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", fontSize: "14px",
    border: "1px solid var(--notion-border)", borderRadius: "2px",
    backgroundColor: "var(--notion-bg)", color: "var(--notion-text)", outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
    color: "var(--notion-text-secondary)", marginBottom: "6px",
  };

  if (status === "loading" || !isAuthorized) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-32 gap-2" style={{ color: "var(--notion-text-muted)" }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--brand-blue)" }} />
          <span className="text-[11px] tracking-widest uppercase">Loading admin portal</span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Admin Dashboard" icon="🛡️">
      <Breadcrumb />

      {/* ═══ Add Staff Modal ═══ */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-5"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] overflow-hidden"
            style={{ backgroundColor: "var(--notion-bg)", border: "1px solid var(--notion-border)", borderRadius: "2px" }}
          >
            {/* Orange top accent */}
            <div className="h-[2px] w-full" style={{ background: "var(--brand-blue)" }} />

            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--notion-divider)" }}>
              <h2 className="text-[13px] font-semibold" style={{ color: "var(--notion-text)" }}>Add New Staff Member</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 bg-transparent border-none cursor-pointer" style={{ color: "var(--notion-text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-5">
              {formError && (
                <div className="px-3 py-2.5 mb-4 text-[12px]" style={{ background: "rgba(235, 87, 87, 0.1)", border: "1px solid var(--notion-red)", borderRadius: "2px", color: "var(--notion-red)" }}>
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="px-3 py-2.5 mb-4 text-[12px]" style={{ background: "rgba(46, 160, 67, 0.1)", border: "1px solid var(--notion-green)", borderRadius: "2px", color: "var(--notion-green)" }}>
                  {formSuccess}
                </div>
              )}
              <div className="responsive-grid-2">
                <div>
                  <label style={labelStyle}>First Name *</label>
                  <input type="text" required value={newStaff.firstName} onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })} style={inputStyle} placeholder="John" />
                </div>
                <div>
                  <label style={labelStyle}>Last Name *</label>
                  <input type="text" required value={newStaff.lastName} onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })} style={inputStyle} placeholder="Doe" />
                </div>
              </div>
              <div className="mt-4">
                <label style={labelStyle}>Email Address *</label>
                <input type="email" required value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} style={inputStyle} placeholder="john@kurlybrains.com" />
              </div>
              <div className="mt-4">
                <label style={labelStyle}>Password *</label>
                <input type="password" required minLength={6} value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} style={inputStyle} placeholder="Min. 6 characters" />
              </div>
              <div className="responsive-grid-2 mt-4">
                <div>
                  <label style={labelStyle}>Role *</label>
                  <select required value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })} style={inputStyle}>
                    <option value="STAFF">Staff</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Department</label>
                  <input type="text" value={newStaff.department} onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })} style={inputStyle} placeholder="e.g. Engineering" />
                </div>
              </div>
              <div className="mt-4">
                <label style={labelStyle}>Position</label>
                <input type="text" value={newStaff.position} onChange={(e) => setNewStaff({ ...newStaff, position: e.target.value })} style={inputStyle} placeholder="e.g. Software Engineer" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2.5 text-[13px] font-medium border-none cursor-pointer" style={{ color: "var(--notion-text-secondary)", background: "var(--notion-bg-tertiary)", borderRadius: "2px" }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium border-none cursor-pointer" style={{ color: "white", background: isSubmitting ? "var(--notion-text-muted)" : "var(--brand-blue)", borderRadius: "2px", cursor: isSubmitting ? "not-allowed" : "pointer" }}>
                  <UserPlus size={14} />
                  {isSubmitting ? "Creating..." : "Add Staff Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Metric Strip ═══ */}
      <div className="mt-6">
        <SectionHeader title="Overview" />
        <div
          className="flex items-center gap-0"
          style={{ borderTop: "1px solid var(--brand-blue)", borderBottom: "1px solid var(--notion-border)" }}
        >
          {statCards.map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center py-5 flex-1"
              style={{ borderLeft: i > 0 ? "1px solid var(--notion-border)" : "none" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={14} style={{ color: stat.color }} />
              </div>
              <span className="text-4xl sm:text-5xl font-extralight tabular-nums leading-none tracking-tighter" style={{ color: "var(--notion-text)" }}>
                {loading ? "—" : stat.value}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] mt-2" style={{ color: "var(--notion-text-secondary)" }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Staff Directory ═══ */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <SectionHeader title="Staff Directory" trailing={`${filteredUsers.length} of ${users.length}`} />
        </div>

        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative" style={{ width: "240px" }}>
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              style={{
                padding: "7px 12px 7px 32px",
                borderRadius: "2px",
                border: "1px solid var(--notion-border)",
                fontSize: "12px",
                outline: "none",
                backgroundColor: "var(--notion-bg-secondary)",
                color: "var(--notion-text)",
              }}
            />
            <Search size={12} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--notion-text-muted)" }} />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] border-none cursor-pointer transition-colors"
            style={{ background: "var(--brand-blue)", color: "white", borderRadius: "2px" }}
          >
            <UserPlus size={12} />
            Add Staff
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-14 w-full rounded-sm" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2" style={{ color: "var(--notion-text-muted)" }}>
            <Users size={20} strokeWidth={1} />
            <span className="text-[11px] tracking-widest uppercase">No staff members found</span>
          </div>
        ) : (
          <div
            className="overflow-hidden"
            style={{ border: "1px solid var(--notion-border)", borderRadius: "2px" }}
          >
            {/* Orange top accent */}
            <div className="h-[2px] w-full" style={{ background: "var(--notion-border)" }} />

            <div className="table-scroll">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "var(--notion-bg-tertiary)" }}>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--notion-text-muted)" }}>Staff Member</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--notion-text-muted)" }}>Department</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--notion-text-muted)" }}>Role</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--notion-text-muted)" }}>Status</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--notion-text-muted)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-[11px] tracking-widest uppercase" style={{ color: "var(--notion-text-muted)" }}>
                        No results for &quot;{searchQuery}&quot;
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="group/row transition-colors hover:bg-[var(--notion-bg-tertiary)]"
                        style={{ borderTop: "1px solid var(--notion-divider)" }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar src={user.avatar || undefined} name={`${user.firstName} ${user.lastName}`} size="sm" />
                            <div>
                              <div className="text-[13px] font-medium" style={{ color: "var(--notion-text)" }}>{user.firstName} {user.lastName}</div>
                              <div className="text-[11px]" style={{ color: "var(--notion-text-muted)" }}>{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[13px]" style={{ color: "var(--notion-text-secondary)" }}>{user.department || "—"}</td>
                        <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                        <td className="px-4 py-3">{getStatusBadge(user.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/dashboard/messages?userId=${user.id}`} className="p-1.5 transition-colors hover:text-[var(--brand-blue)]" style={{ color: "var(--notion-text-secondary)", display: "flex", alignItems: "center" }} title="Send Message">
                              <Mail size={14} />
                            </Link>
                            <button onClick={() => openEditUser(user)} className="p-1.5 bg-transparent border-none cursor-pointer transition-colors hover:text-[var(--brand-blue)]" style={{ color: "var(--notion-text-secondary)", display: "flex", alignItems: "center" }} title="Edit User">
                              <MoreHorizontal size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="px-4 py-2 text-[9px] font-mono tracking-widest uppercase opacity-40" style={{ borderTop: "1px solid var(--notion-divider)", color: "var(--notion-text-muted)" }}>
                {filteredUsers.length} of {users.length} staff members
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Edit User Modal ═══ */}
      {showEditUserModal && (
        <Modal isOpen={showEditUserModal} onClose={() => setShowEditUserModal(false)} title="Edit User">
          <form onSubmit={handleUpdateUser} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Role</label>
              <select
                value={editForm.role}
                onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                style={{ ...inputStyle, opacity: editForm.role === "SUPER_ADMIN" ? 0.7 : 1 }}
                disabled={editForm.role === "SUPER_ADMIN"}
              >
                <option value="STAFF">Staff</option>
                <option value="MANAGER">Manager</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} style={inputStyle}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Department</label>
              <input type="text" value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Position</label>
              <input type="text" value={editForm.position} onChange={e => setEditForm({ ...editForm, position: e.target.value })} style={inputStyle} />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setShowEditUserModal(false)} className="px-3 py-2 text-[13px] border-none bg-transparent cursor-pointer" style={{ color: "var(--notion-text-secondary)" }}>Cancel</button>
              <button type="submit" className="px-4 py-2 text-[13px] border-none cursor-pointer" style={{ background: "var(--brand-blue)", color: "white", borderRadius: "2px" }}>Save Changes</button>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}
