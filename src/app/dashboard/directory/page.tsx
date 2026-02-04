"use client";

import { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Search, Building2, User2, Filter, Clock } from "lucide-react";
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
}

export default function DirectoryPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const departments = [...new Set(users.map(u => u.department).filter(Boolean))];

  const filteredUsers = users.filter((u) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      u.firstName.toLowerCase().includes(term) ||
      u.lastName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.department?.toLowerCase().includes(term);
    const matchesDept = !selectedDepartment || u.department === selectedDepartment;
    return matchesSearch && matchesDept;
  });

  const formatLastActive = (dateString?: string | null) => {
    if (!dateString) return "Offline";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Active now";
    if (diffInSeconds < 3600) return `Active ${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `Active ${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `Active ${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  const isOnline = (dateString?: string | null) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / 1000 / 60;
    return diffInMinutes < 5; // Consider online if active in last 5 minutes
  };


  return (
    <PageContainer title="Team Directory" icon="👥">
      <Breadcrumb />

      {/* Header Stats */}
      <div
        className="responsive-stack"
        style={{
          gap: '24px',
          marginTop: '24px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--notion-divider)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User2 size={16} style={{ color: 'var(--notion-blue)' }} />
          <span style={{ fontSize: '14px', color: 'var(--notion-text-secondary)' }}>
            <strong style={{ color: 'var(--notion-text)' }}>{users.length}</strong> team members
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={16} style={{ color: 'var(--notion-purple)' }} />
          <span style={{ fontSize: '14px', color: 'var(--notion-text-secondary)' }}>
            <strong style={{ color: 'var(--notion-text)' }}>{departments.length}</strong> departments
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginTop: '20px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1, minWidth: '280px', maxWidth: '400px' }}>
          <Input
            placeholder="Search by name, email, or department..."
            icon={<Search size={14} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Department Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedDepartment(null)}
            style={{
              padding: '6px 12px',
              borderRadius: '16px',
              border: 'none',
              fontSize: '12px',
              cursor: 'pointer',
              background: !selectedDepartment ? 'var(--notion-blue)' : 'var(--notion-bg-tertiary)',
              color: !selectedDepartment ? 'white' : 'var(--notion-text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            All
          </button>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDepartment(dept === selectedDepartment ? null : dept!)}
              style={{
                padding: '6px 12px',
                borderRadius: '16px',
                border: 'none',
                fontSize: '12px',
                cursor: 'pointer',
                background: dept === selectedDepartment ? 'var(--notion-blue)' : 'var(--notion-bg-tertiary)',
                color: dept === selectedDepartment ? 'white' : 'var(--notion-text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '24px' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '180px', borderRadius: '8px' }} />)}
        </div>
      ) : filteredUsers.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
          marginTop: '24px'
        }}>
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="hover-bg"
              style={{
                background: 'var(--notion-bg-secondary)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid var(--notion-border)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {/* Profile Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <Avatar name={`${user.firstName} ${user.lastName}`} size="lg" />
                  {isOnline(user.lastActive) && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#22c55e',
                      border: '2px solid var(--notion-bg-secondary)'
                    }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'var(--notion-text)',
                      margin: 0
                    }}>
                      {user.firstName} {user.lastName}
                    </h3>
                    {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                      <Badge variant="purple" size="sm">Admin</Badge>
                    )}
                  </div>
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--notion-text-muted)',
                    margin: '4px 0 0 0'
                  }}>
                    {user.position || "Team Member"}
                  </p>
                </div>
              </div>

              {/* Department Tag */}
              {user.department && (
                <div style={{ marginTop: '12px' }}>
                  <Badge variant="default" size="sm">{user.department}</Badge>
                </div>
              )}

              {/* Contact Info */}
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--notion-text-secondary)'
                }}>
                  <Clock size={14} style={{ flexShrink: 0, color: 'var(--notion-text-muted)' }} />
                  <span style={{ color: isOnline(user.lastActive) ? '#22c55e' : 'inherit' }}>
                    {formatLastActive(user.lastActive)}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--notion-text-secondary)'
                }}>
                  <Mail size={14} style={{ flexShrink: 0, color: 'var(--notion-text-muted)' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </span>
                </div>
                {user.phone && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: 'var(--notion-text-secondary)'
                  }}>
                    <Phone size={14} style={{ flexShrink: 0, color: 'var(--notion-text-muted)' }} />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.location && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: 'var(--notion-text-secondary)'
                  }}>
                    <MapPin size={14} style={{ flexShrink: 0, color: 'var(--notion-text-muted)' }} />
                    <span>{user.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: '48px' }}>
          <EmptyState
            icon={<User2 size={48} />}
            title="No team members found"
            description="Try adjusting your search or filters."
          />
        </div>
      )}
    </PageContainer>
  );
}
