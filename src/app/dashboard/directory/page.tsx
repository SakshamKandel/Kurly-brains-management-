"use client";

import { useState } from "react";
import useSWR from "swr";
import { Mail, Phone, MapPin, Search, Building2, User2, Filter, Clock, Trash2 } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { useSession } from "next-auth/react";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/layout/Breadcrumb";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "STAFF" | "SUPER_ADMIN";
  department?: string;
  position?: string;
  phone?: string;
  location?: string;
  lastActive?: string | null;
  avatar?: string | null;
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

export default function DirectoryPage() {
  const { data: session } = useSession();
  const { data: users = [], isLoading: loading, mutate } = useSWR<User[]>("/api/users", fetcher);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const departments = [...new Set(users.map(u => u.department).filter(Boolean))];

  const filteredUsers = users.filter((u) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = u.firstName.toLowerCase().includes(term) || u.lastName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.department?.toLowerCase().includes(term);
    const matchesDept = !selectedDepartment || u.department === selectedDepartment;
    return matchesSearch && matchesDept;
  });

  const formatLastActive = (dateString?: string | null) => {
    if (!dateString) return "Offline";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "Online";
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `Active ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Active ${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `Active ${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `Active ${months}mo ago`;
    return `Active ${Math.floor(days / 365)}y ago`;
  };

  const isOnline = (dateString?: string | null) => {
    if (!dateString) return false;
    return (new Date().getTime() - new Date(dateString).getTime()) / 1000 < 60;
  };

  const canDeleteUser = (targetUser: User) => {
    if (!session?.user || session.user.id === targetUser.id) return false;
    const currentUserRole = session.user.role;
    if (currentUserRole === "SUPER_ADMIN") return true;
    if (currentUserRole === "ADMIN" && targetUser.role === "STAFF") return true;
    return false;
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`)) return;
    setIsDeleting(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (res.ok) { mutate(users.filter(u => u.id !== user.id), false); }
      else { const data = await res.json(); alert(data.error || "Failed to delete user"); }
    } catch (error) { console.error(error); alert("An error occurred while deleting the user"); }
    finally { setIsDeleting(null); }
  };

  return (
    <PageContainer title="Team Directory" icon="👥">
      <Breadcrumb />

      {/* ═══ Metric Strip ═══ */}
      <div
        className="flex items-center gap-0 mt-6 mb-6"
        style={{ borderTop: "1px solid var(--brand-blue)", borderBottom: "1px solid var(--notion-border)" }}
      >
        <div className="flex flex-col items-center justify-center py-4 flex-1">
          <span className="text-4xl font-extralight tabular-nums leading-none tracking-tighter" style={{ color: "var(--notion-text)" }}>{users.length}</span>
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] mt-2" style={{ color: "var(--notion-text-secondary)" }}>Members</span>
        </div>
        <div className="flex flex-col items-center justify-center py-4 flex-1" style={{ borderLeft: "1px solid var(--notion-border)" }}>
          <span className="text-4xl font-extralight tabular-nums leading-none tracking-tighter" style={{ color: "var(--brand-blue)" }}>{departments.length}</span>
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] mt-2" style={{ color: "var(--notion-text-secondary)" }}>Departments</span>
        </div>
        <div className="flex flex-col items-center justify-center py-4 flex-1" style={{ borderLeft: "1px solid var(--notion-border)" }}>
          <span className="text-4xl font-extralight tabular-nums leading-none tracking-tighter" style={{ color: "var(--notion-green)" }}>{users.filter(u => isOnline(u.lastActive)).length}</span>
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] mt-2" style={{ color: "var(--notion-text-secondary)" }}>Online</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3 flex-wrap items-center mb-2">
        <div style={{ flex: 1, minWidth: '260px', maxWidth: '360px' }}>
          <Input placeholder="Search by name, email, or department..." icon={<Search size={14} />} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedDepartment(null)}
            className="transition-all"
            style={{
              padding: '4px 10px', borderRadius: '2px', border: 'none', fontSize: '10px', fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase' as const, cursor: 'pointer',
              background: !selectedDepartment ? 'var(--brand-blue)' : 'var(--notion-bg-tertiary)',
              color: !selectedDepartment ? 'white' : 'var(--notion-text-secondary)',
            }}
          >All</button>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDepartment(dept === selectedDepartment ? null : dept!)}
              className="transition-all"
              style={{
                padding: '4px 10px', borderRadius: '2px', border: 'none', fontSize: '10px', fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase' as const, cursor: 'pointer',
                background: dept === selectedDepartment ? 'var(--brand-blue)' : 'var(--notion-bg-tertiary)',
                color: dept === selectedDepartment ? 'white' : 'var(--notion-text-secondary)',
              }}
            >{dept}</button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <SectionHeader title="Team" trailing={`${filteredUsers.length} members`} />
      </div>

      {/* Employee Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-48 rounded-sm" />)}
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="group/card relative overflow-hidden transition-all duration-300 hover:bg-[var(--notion-bg-tertiary)]"
              style={{ background: "var(--notion-bg-secondary)", border: "1px solid var(--notion-border)", borderRadius: "2px" }}
            >
              {/* Online accent */}
              <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: isOnline(user.lastActive) ? "var(--notion-green)" : "var(--notion-border)" }} />

              <div className="p-5 pl-5">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar src={user.avatar || undefined} name={`${user.firstName} ${user.lastName}`} size="lg" />
                    {isOnline(user.lastActive) && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22c55e', border: '2px solid var(--notion-bg-secondary)' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[14px] font-semibold m-0" style={{ color: "var(--notion-text)" }}>{user.firstName} {user.lastName}</h3>
                      {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && <Badge variant="purple" size="sm">Admin</Badge>}
                    </div>
                    <p className="text-[12px] m-0 mt-0.5" style={{ color: "var(--notion-text-muted)" }}>{user.position || "Team Member"}</p>
                  </div>
                  {canDeleteUser(user) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteUser(user); }}
                      disabled={isDeleting === user.id}
                      className="p-1 bg-transparent border-none cursor-pointer opacity-0 group-hover/card:opacity-100 transition-opacity"
                      style={{ color: "var(--notion-red)", cursor: isDeleting === user.id ? 'not-allowed' : 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {user.department && (
                  <div className="mt-2"><Badge variant="default" size="sm">{user.department}</Badge></div>
                )}

                <div className="mt-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--notion-text-secondary)" }}>
                    <Clock size={12} style={{ color: "var(--notion-text-muted)" }} />
                    <span style={{ color: isOnline(user.lastActive) ? '#22c55e' : 'var(--notion-text-muted)' }}>{formatLastActive(user.lastActive)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--notion-text-secondary)" }}>
                    <Mail size={12} style={{ color: "var(--notion-text-muted)" }} />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--notion-text-secondary)" }}>
                      <Phone size={12} style={{ color: "var(--notion-text-muted)" }} /><span>{user.phone}</span>
                    </div>
                  )}
                  {user.location && (
                    <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--notion-text-secondary)" }}>
                      <MapPin size={12} style={{ color: "var(--notion-text-muted)" }} /><span>{user.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<User2 size={48} />} title="No team members found" description="Try adjusting your search or filters." />
      )}
    </PageContainer>
  );
}
