"use client";

import { useState, useEffect } from "react";
import { X, Search, Users } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface User {
    id: string;
    firstName: string;
    lastName: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onGroupCreated: () => void;
}

export default function GroupCreateModal({ isOpen, onClose, onGroupCreated }: Props) {
    const [groupName, setGroupName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/users");
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

    const filteredUsers = users.filter((user) => {
        const name = `${user.firstName} ${user.lastName}`.toLowerCase();
        return name.includes(searchQuery.toLowerCase()) &&
            !selectedUsers.some(s => s.id === user.id);
    });

    const toggleUserSelection = (user: User) => {
        if (selectedUsers.some(s => s.id === user.id)) {
            setSelectedUsers(prev => prev.filter(s => s.id !== user.id));
        } else {
            setSelectedUsers(prev => [...prev, user]);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) return;

        setCreating(true);
        try {
            const res = await fetch("/api/conversations/group", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: groupName.trim(),
                    memberIds: selectedUsers.map(u => u.id),
                }),
            });

            if (res.ok) {
                setGroupName("");
                setSelectedUsers([]);
                setSearchQuery("");
                onGroupCreated();
                onClose();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to create group");
            }
        } catch (error) {
            alert("Failed to create group");
        } finally {
            setCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: "420px" }}>
                {/* Header */}
                <div className="modal-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <Users size={18} style={{ color: "var(--notion-text-secondary)" }} />
                        <h3 className="modal-title">Create Group</h3>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    {/* Group Name */}
                    <div style={{ marginBottom: "var(--space-4)" }}>
                        <label style={{
                            display: "block",
                            marginBottom: "var(--space-2)",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "var(--notion-text-secondary)",
                        }}>
                            Group Name
                        </label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Enter group name..."
                            style={{
                                width: "100%",
                                padding: "var(--space-2) var(--space-3)",
                                border: "1px solid var(--notion-border)",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "14px",
                                backgroundColor: "var(--notion-bg)",
                                color: "var(--notion-text)",
                                outline: "none",
                            }}
                        />
                    </div>

                    {/* Selected Members */}
                    {selectedUsers.length > 0 && (
                        <div style={{ marginBottom: "var(--space-4)" }}>
                            <label style={{
                                display: "block",
                                marginBottom: "var(--space-2)",
                                fontSize: "13px",
                                fontWeight: 500,
                                color: "var(--notion-text-secondary)",
                            }}>
                                Selected ({selectedUsers.length})
                            </label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                                {selectedUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "var(--space-1)",
                                            padding: "var(--space-1) var(--space-2)",
                                            backgroundColor: "var(--notion-blue-bg)",
                                            color: "var(--notion-blue)",
                                            borderRadius: "var(--radius-full)",
                                            fontSize: "12px",
                                            fontWeight: 500,
                                        }}
                                    >
                                        <span>{user.firstName}</span>
                                        <button
                                            onClick={() => toggleUserSelection(user)}
                                            style={{
                                                background: "transparent",
                                                border: "none",
                                                cursor: "pointer",
                                                padding: "2px",
                                                color: "var(--notion-blue)",
                                                display: "flex",
                                            }}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search */}
                    <div style={{ marginBottom: "var(--space-3)" }}>
                        <Input
                            placeholder="Search members..."
                            icon={<Search size={14} />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* User List */}
                    <div style={{
                        maxHeight: "200px",
                        overflowY: "auto",
                        border: "1px solid var(--notion-border)",
                        borderRadius: "var(--radius-sm)",
                    }}>
                        {loading ? (
                            <div style={{ padding: "var(--space-5)", textAlign: "center", color: "var(--notion-text-muted)" }}>
                                Loading...
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div style={{ padding: "var(--space-5)", textAlign: "center", color: "var(--notion-text-muted)" }}>
                                No users found
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => toggleUserSelection(user)}
                                    className="hover-bg"
                                    style={{
                                        padding: "var(--space-2) var(--space-3)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "var(--space-2)",
                                        cursor: "pointer",
                                        borderBottom: "1px solid var(--notion-divider)",
                                    }}
                                >
                                    <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
                                    <span style={{ fontSize: "14px", color: "var(--notion-text)" }}>
                                        {user.firstName} {user.lastName}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateGroup}
                        disabled={!groupName.trim() || selectedUsers.length === 0 || creating}
                    >
                        {creating ? "Creating..." : "Create Group"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
