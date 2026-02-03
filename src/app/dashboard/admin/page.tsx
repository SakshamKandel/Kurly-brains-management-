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

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    totalMessages: 0,
  });

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add Staff Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [newStaff, setNewStaff] = useState<NewStaffForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "STAFF",
    department: "",
    position: "",
  });

  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm>({
    id: "",
    role: "",
    department: "",
    position: "",
    status: "",
  });
  const [showEditUserModal, setShowEditUserModal] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/login");
      return;
    }

    const role = session.user.role;
    if (role !== "ADMIN" && role !== "MANAGER" && role !== "SUPER_ADMIN") {
      router.push("/dashboard"); // Redirect staff away
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
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    if (!isAuthorized) return; // Don't fetch if not authorized

    const fetchData = async () => {
      try {
        await fetchUsers();

        const statsRes = await fetch("/api/admin/stats", { cache: "no-store" });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(prev => ({
            ...prev,
            totalTasks: statsData.totalTasks || 0,
            totalMessages: statsData.totalMessages || 0,
          }));
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthorized]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStaff),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create staff member");
      }

      setFormSuccess("Staff member created successfully!");
      setNewStaff({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "STAFF",
        department: "",
        position: "",
      });

      await fetchUsers();

      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess("");
      }, 1500);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      id: user.id,
      role: user.role,
      department: user.department || "",
      position: user.position || "",
      status: user.status,
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/users/${editForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        await fetchUsers();
        setShowEditUserModal(false);
      } else {
        alert("Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const statCards = [
    { label: "Total Staff", value: stats.totalUsers, icon: Users, color: "var(--notion-blue)" },
    { label: "Total Tasks", value: stats.totalTasks, icon: CheckSquare, color: "var(--notion-green)" },
    { label: "Messages", value: stats.totalMessages, icon: MessageSquare, color: "var(--notion-yellow)" },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge variant="purple" size="sm">{role}</Badge>;
      case "MANAGER":
        return <Badge variant="info" size="sm">{role}</Badge>;
      default:
        return <Badge variant="default" size="sm">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success" size="sm">{status}</Badge>;
      case "INACTIVE":
        return <Badge variant="warning" size="sm">{status}</Badge>;
      case "SUSPENDED":
        return <Badge variant="error" size="sm">{status}</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid var(--notion-border)",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "var(--notion-bg)",
    color: "var(--notion-text)",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--notion-text-secondary)",
    marginBottom: "6px",
  };

  // STRICT BLOCKING RENDER
  if (status === "loading" || !isAuthorized) {
    return (
      <PageContainer>
        <div style={{ padding: '100px', textAlign: 'center', color: 'var(--notion-text-muted)' }}>
          Loading admin portal...
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Admin Dashboard" icon="🛡️">
      <Breadcrumb />

      {/* Add Staff Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "480px",
              backgroundColor: "var(--notion-bg)",
              borderRadius: "12px",
              boxShadow: "0 24px 48px rgba(0, 0, 0, 0.3)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid var(--notion-divider)",
              }}
            >
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--notion-text)" }}>
                Add New Staff Member
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--notion-text-muted)", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStaff} style={{ padding: "20px" }}>
              {formError && (
                <div style={{ padding: "10px 12px", marginBottom: "16px", backgroundColor: "rgba(235, 87, 87, 0.1)", border: "1px solid var(--notion-red)", borderRadius: "var(--radius-sm)", color: "var(--notion-red)", fontSize: "13px" }}>
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div style={{ padding: "10px 12px", marginBottom: "16px", backgroundColor: "rgba(46, 160, 67, 0.1)", border: "1px solid var(--notion-green)", borderRadius: "var(--radius-sm)", color: "var(--notion-green)", fontSize: "13px" }}>
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

              <div style={{ marginTop: "16px" }}>
                <label style={labelStyle}>Email Address *</label>
                <input type="email" required value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} style={inputStyle} placeholder="john@kurlybrains.com" />
              </div>

              <div style={{ marginTop: "16px" }}>
                <label style={labelStyle}>Password *</label>
                <input type="password" required minLength={6} value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} style={inputStyle} placeholder="Min. 6 characters" />
              </div>

              <div className="responsive-grid-2" style={{ marginTop: "16px" }}>
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

              <div style={{ marginTop: "16px" }}>
                <label style={labelStyle}>Position</label>
                <input type="text" value={newStaff.position} onChange={(e) => setNewStaff({ ...newStaff, position: e.target.value })} style={inputStyle} placeholder="e.g. Software Engineer" />
              </div>

              <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: "10px 16px", fontSize: "14px", fontWeight: 500, color: "var(--notion-text-secondary)", backgroundColor: "var(--notion-bg-tertiary)", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} style={{ padding: "10px 20px", fontSize: "14px", fontWeight: 500, color: "white", backgroundColor: isSubmitting ? "var(--notion-text-muted)" : "var(--notion-blue)", border: "none", borderRadius: "var(--radius-sm)", cursor: isSubmitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                  <UserPlus size={16} />
                  {isSubmitting ? "Creating..." : "Add Staff Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--notion-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
          Overview
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {statCards.map(stat => (
            <Card key={stat.label} padding="md" hoverEffect>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'var(--notion-bg-tertiary)', color: stat.color }}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--notion-text-secondary)' }}>{stat.label}</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--notion-text)', fontFamily: 'var(--font-heading)' }}>
                    {loading ? "..." : stat.value}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Staff Section */}
      <div style={{ marginTop: '48px' }}>
        <div className="responsive-stack" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--notion-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Staff Directory
          </h3>

          <div className="responsive-actions" style={{ flex: 1, justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', width: '240px' }}>
              <input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 12px 6px 32px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--notion-border)',
                  fontSize: '13px',
                  outline: 'none',
                  backgroundColor: 'var(--notion-bg)'
                }}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--notion-text-muted)' }} />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'var(--notion-green)', color: 'white', borderRadius: 'var(--radius-sm)', fontSize: '13px', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            >
              <UserPlus size={14} />
              Add Staff
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ border: '1px solid var(--notion-border)', borderRadius: 'var(--radius-sm)', padding: '48px', textAlign: 'center', color: 'var(--notion-text-muted)' }}>
            Loading staff data...
          </div>
        ) : users.length === 0 ? (
          <div style={{ border: '1px solid var(--notion-border)', borderRadius: 'var(--radius-sm)', padding: '48px', textAlign: 'center', color: 'var(--notion-text-muted)' }}>
            No staff members found.
          </div>
        ) : (
          <div className="table-scroll" style={{ border: '1px solid var(--notion-border)', borderRadius: 'var(--radius-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--notion-bg-secondary)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '12px', color: 'var(--notion-text-muted)', textTransform: 'uppercase' }}>Staff Member</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '12px', color: 'var(--notion-text-muted)', textTransform: 'uppercase' }}>Department</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '12px', color: 'var(--notion-text-muted)', textTransform: 'uppercase' }}>Role</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '12px', color: 'var(--notion-text-muted)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, fontSize: '12px', color: 'var(--notion-text-muted)', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr style={{ backgroundColor: 'transparent' }}>
                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--notion-text-muted)' }}>
                      No staff members found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr key={user.id} style={{ borderTop: '1px solid var(--notion-divider)', backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--notion-bg-secondary)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--notion-text)' }}>{user.firstName} {user.lastName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--notion-text-secondary)' }}>{user.department || "—"}</td>
                      <td style={{ padding: '12px 16px' }}>{getRoleBadge(user.role)}</td>
                      <td style={{ padding: '12px 16px' }}>{getStatusBadge(user.status)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <Link href={`/dashboard/messages?userId=${user.id}`} style={{ padding: '6px', borderRadius: '4px', color: 'var(--notion-text-secondary)', display: 'flex', alignItems: 'center' }} className="hover-bg" title="Send Message">
                            <Mail size={16} />
                          </Link>
                          <button onClick={() => openEditUser(user)} style={{ padding: '6px', borderRadius: '4px', color: 'var(--notion-text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} className="hover-bg" title="Edit User">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )))}
              </tbody>
            </table>
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--notion-divider)', color: 'var(--notion-text-muted)', fontSize: '11px', textAlign: 'right' }}>
              Showing {filteredUsers.length} of {users.length} staff members
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {
        showEditUserModal && (
          <Modal isOpen={showEditUserModal} onClose={() => setShowEditUserModal(false)} title="Edit User">
            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowEditUserModal(false)} style={{ padding: "8px 12px", border: "none", background: "transparent", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", backgroundColor: "var(--notion-blue)", color: "white", borderRadius: "4px", border: "none", cursor: "pointer" }}>Save Changes</button>
              </div>
            </form>
          </Modal>
        )
      }

    </PageContainer >
  );
}
