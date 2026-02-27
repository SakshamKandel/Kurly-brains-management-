"use client";

import { useState } from "react";
import useSWR from "swr";
import {
    Plus,
    Search,
    FolderKanban,
    Users,
    MoreVertical,
    Edit,
    Trash2,
    Archive,
} from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/layout/Breadcrumb";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Dropdown from "@/components/ui/Dropdown";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

interface Project {
    id: string;
    name: string;
    description: string | null;
    color: string;
    status: "ACTIVE" | "COMPLETED" | "ON_HOLD" | "ARCHIVED";
    client: { id: string; name: string } | null;
    createdBy: { id: string; firstName: string; lastName: string; avatar: string | null };
    members: {
        id: string;
        role: string;
        user: { id: string; firstName: string; lastName: string; avatar: string | null };
    }[];
    _count: { tasks: number };
    createdAt: string;
}

interface Client {
    id: string;
    name: string;
}

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
}

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to fetch' }));
        throw new Error(error.error || 'Failed to fetch');
    }
    return res.json();
};

const colorOptions = [
    { value: "#3b82f6", label: "Blue" },
    { value: "#22c55e", label: "Green" },
    { value: "#eab308", label: "Yellow" },
    { value: "#f97316", label: "Orange" },
    { value: "#ef4444", label: "Red" },
    { value: "#8b5cf6", label: "Violet" },
    { value: "#ec4899", label: "Pink" },
    { value: "#06b6d4", label: "Cyan" },
];

const statusBadgeVariant: Record<string, "success" | "warning" | "default" | "info"> = {
    ACTIVE: "success",
    COMPLETED: "info",
    ON_HOLD: "warning",
    ARCHIVED: "default",
};

export default function ProjectsPage() {
    const { data: projects, mutate } = useSWR<Project[]>("/api/projects", fetcher);
    const { data: clients } = useSWR<Client[]>("/api/clients", fetcher);
    const { data: users } = useSWR<User[]>("/api/users", fetcher);

    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const { success, error: showError } = useToast();

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        color: "#3b82f6",
        clientId: "",
        memberIds: [] as string[],
    });

    // Delete confirmation state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingProject, setDeletingProject] = useState<Project | null>(null);

    const loading = !projects;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const method = editingProject ? "PUT" : "POST";
            const url = editingProject ? `/api/projects/${editingProject.id}` : "/api/projects";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                mutate();
                closeModal();
                success(editingProject ? "Project updated" : "Project created");
            } else {
                const data = await res.json();
                showError(data.error || "Failed to save project");
            }
        } catch (err) {
            showError("Something went wrong");
        }
    };

    const handleDelete = (project: Project) => {
        setDeletingProject(project);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deletingProject) return;

        try {
            const res = await fetch(`/api/projects/${deletingProject.id}`, { method: "DELETE" });
            if (res.ok) {
                mutate();
                success(`Project "${deletingProject.name}" deleted`);
            } else {
                const data = await res.json();
                showError(data.error || "Failed to delete");
            }
        } catch (err) {
            showError("Something went wrong");
        } finally {
            setShowDeleteModal(false);
            setDeletingProject(null);
        }
    };

    const openModal = (project?: Project) => {
        if (project) {
            setEditingProject(project);
            setFormData({
                name: project.name,
                description: project.description || "",
                color: project.color,
                clientId: project.client?.id || "",
                memberIds: project.members.map((m) => m.user.id),
            });
        } else {
            setEditingProject(null);
            setFormData({
                name: "",
                description: "",
                color: "#3b82f6",
                clientId: "",
                memberIds: [],
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProject(null);
    };

    const filteredProjects = (projects || []).filter((project) => {
        const matchesSearch =
            project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || project.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <PageContainer
            title="Projects"
            icon="📂"
            action={
                <Button icon={<Plus size={14} />} onClick={() => openModal()}>
                    New Project
                </Button>
            }
        >
            <Breadcrumb />

            {/* Filter Bar */}
            <div
                className="responsive-stack"
                style={{
                    margin: "24px 0",
                    borderBottom: "1px solid var(--notion-divider)",
                    paddingBottom: "16px",
                }}
            >
                <Input
                    placeholder="Search projects..."
                    icon={<Search size={14} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    fullWidth={false}
                />
                <Dropdown
                    options={[
                        { value: "", label: "All Status" },
                        { value: "ACTIVE", label: "Active" },
                        { value: "COMPLETED", label: "Completed" },
                        { value: "ON_HOLD", label: "On Hold" },
                        { value: "ARCHIVED", label: "Archived" },
                    ]}
                    value={statusFilter}
                    onChange={setStatusFilter}
                />
            </div>

            {/* Projects Grid */}
            {loading ? (
                <div className="skeleton" style={{ width: "100%", height: "300px" }} />
            ) : filteredProjects.length === 0 ? (
                <EmptyState
                    icon={<FolderKanban size={48} />}
                    title="No projects yet"
                    description="Create your first project to organize tasks and collaborate with your team."
                    action={
                        <Button icon={<Plus size={14} />} onClick={() => openModal()}>
                            Create Project
                        </Button>
                    }
                />
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                        gap: "16px",
                    }}
                >
                    {filteredProjects.map((project) => (
                        <Link
                            key={project.id}
                            href={`/dashboard/projects/${project.id}`}
                            style={{ textDecoration: "none" }}
                        >
                            <div
                                className="notion-card"
                                style={{
                                    backgroundColor: "var(--notion-bg-secondary)",
                                    borderRadius: "var(--radius-md)",
                                    border: "1px solid var(--notion-border)",
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                            >
                                {/* Color Bar */}
                                <div style={{ height: "4px", backgroundColor: project.color }} />

                                <div style={{ padding: "16px" }}>
                                    {/* Header */}
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            justifyContent: "space-between",
                                            marginBottom: "12px",
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <h3
                                                style={{
                                                    margin: 0,
                                                    fontSize: "16px",
                                                    fontWeight: 600,
                                                    color: "var(--notion-text)",
                                                }}
                                            >
                                                {project.name}
                                            </h3>
                                            {project.client && (
                                                <span
                                                    style={{
                                                        fontSize: "12px",
                                                        color: "var(--notion-text-muted)",
                                                    }}
                                                >
                                                    {project.client.name}
                                                </span>
                                            )}
                                        </div>
                                        <Badge variant={statusBadgeVariant[project.status]} size="sm">
                                            {project.status.replace("_", " ")}
                                        </Badge>
                                    </div>

                                    {/* Description */}
                                    {project.description && (
                                        <p
                                            style={{
                                                fontSize: "13px",
                                                color: "var(--notion-text-secondary)",
                                                margin: "0 0 12px 0",
                                                lineHeight: 1.5,
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {project.description}
                                        </p>
                                    )}

                                    {/* Footer */}
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            paddingTop: "12px",
                                            borderTop: "1px solid var(--notion-divider)",
                                        }}
                                    >
                                        {/* Members */}
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            <div style={{ display: "flex" }}>
                                                {project.members.slice(0, 3).map((member, idx) => (
                                                    <div
                                                        key={member.id}
                                                        style={{
                                                            width: "24px",
                                                            height: "24px",
                                                            borderRadius: "50%",
                                                            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontSize: "10px",
                                                            color: "white",
                                                            fontWeight: 500,
                                                            marginLeft: idx > 0 ? "-8px" : 0,
                                                            border: "2px solid var(--notion-bg-secondary)",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        {member.user.avatar ? (
                                                            <img
                                                                src={member.user.avatar}
                                                                alt=""
                                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                            />
                                                        ) : (
                                                            `${member.user.firstName[0]}${member.user.lastName[0]}`
                                                        )}
                                                    </div>
                                                ))}
                                                {project.members.length > 3 && (
                                                    <div
                                                        style={{
                                                            width: "24px",
                                                            height: "24px",
                                                            borderRadius: "50%",
                                                            background: "var(--notion-bg-tertiary)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontSize: "10px",
                                                            color: "var(--notion-text-muted)",
                                                            marginLeft: "-8px",
                                                            border: "2px solid var(--notion-bg-secondary)",
                                                        }}
                                                    >
                                                        +{project.members.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Task Count & Actions */}
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span style={{ fontSize: "12px", color: "var(--notion-text-muted)" }}>
                                                {project._count.tasks} tasks
                                            </span>
                                            <div
                                                style={{ display: "flex", gap: "4px" }}
                                                onClick={(e) => e.preventDefault()}
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        openModal(project);
                                                    }}
                                                    style={{
                                                        padding: "4px",
                                                        border: "none",
                                                        background: "transparent",
                                                        cursor: "pointer",
                                                        color: "var(--notion-text-secondary)",
                                                        borderRadius: "var(--radius-sm)",
                                                    }}
                                                    className="hover-bg"
                                                    title="Edit project"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleDelete(project);
                                                    }}
                                                    style={{
                                                        padding: "4px",
                                                        border: "none",
                                                        background: "transparent",
                                                        cursor: "pointer",
                                                        color: "var(--notion-red)",
                                                        borderRadius: "var(--radius-sm)",
                                                    }}
                                                    className="hover-bg"
                                                    title="Delete project"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={closeModal}
                title={editingProject ? "Edit Project" : "New Project"}
            >
                <form
                    onSubmit={handleSubmit}
                    style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                >
                    <Input
                        label="Project Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        autoFocus
                        placeholder="e.g. Website Redesign"
                    />

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label
                            className="text-xs text-muted"
                            style={{ display: "block", marginBottom: "4px" }}
                        >
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            rows={3}
                            style={{
                                width: "100%",
                                background: "var(--notion-bg-secondary)",
                                border: "1px solid var(--notion-border)",
                                color: "var(--notion-text)",
                                padding: "8px 12px",
                                borderRadius: "var(--radius-sm)",
                                resize: "vertical",
                                fontSize: "14px",
                                fontFamily: "var(--font-body)",
                                outline: "none",
                            }}
                            placeholder="What is this project about?"
                        />
                    </div>

                    <div className="responsive-stack">
                        {/* Color */}
                        <div style={{ flex: 1 }}>
                            <label
                                className="text-xs text-muted"
                                style={{ display: "block", marginBottom: "4px" }}
                            >
                                Color
                            </label>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                {colorOptions.map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color: color.value })}
                                        style={{
                                            width: "28px",
                                            height: "28px",
                                            borderRadius: "50%",
                                            backgroundColor: color.value,
                                            border:
                                                formData.color === color.value
                                                    ? "2px solid white"
                                                    : "2px solid transparent",
                                            cursor: "pointer",
                                            boxShadow:
                                                formData.color === color.value
                                                    ? "0 0 0 2px var(--notion-primary)"
                                                    : "none",
                                        }}
                                        title={color.label}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Client */}
                        <div style={{ flex: 1 }}>
                            <label
                                className="text-xs text-muted"
                                style={{ display: "block", marginBottom: "4px" }}
                            >
                                Client (Optional)
                            </label>
                            <select
                                value={formData.clientId}
                                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    background: "var(--notion-bg-secondary)",
                                    border: "1px solid var(--notion-border)",
                                    color: "var(--notion-text)",
                                    borderRadius: "var(--radius-sm)",
                                    outline: "none",
                                }}
                            >
                                <option value="">No client</option>
                                {(clients || []).map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Team Members */}
                    <div>
                        <label
                            className="text-xs text-muted"
                            style={{ display: "block", marginBottom: "8px" }}
                        >
                            Team Members
                        </label>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                                maxHeight: "200px",
                                overflowY: "auto",
                                padding: "8px",
                                background: "var(--notion-bg-secondary)",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--notion-border)",
                            }}
                        >
                            {(users || []).map((user) => {
                                const isSelected = formData.memberIds.includes(user.id);
                                return (
                                    <label
                                        key={user.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            padding: "8px 10px",
                                            borderRadius: "var(--radius-sm)",
                                            cursor: "pointer",
                                            background: isSelected
                                                ? "var(--notion-bg-tertiary)"
                                                : "transparent",
                                            transition: "background 0.15s ease",
                                        }}
                                        className="hover-bg"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => {
                                                setFormData({
                                                    ...formData,
                                                    memberIds: isSelected
                                                        ? formData.memberIds.filter((id) => id !== user.id)
                                                        : [...formData.memberIds, user.id],
                                                });
                                            }}
                                            style={{
                                                width: "16px",
                                                height: "16px",
                                                accentColor: "var(--notion-primary)",
                                                cursor: "pointer",
                                            }}
                                        />
                                        <div
                                            style={{
                                                width: "32px",
                                                height: "32px",
                                                borderRadius: "50%",
                                                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "12px",
                                                fontWeight: 500,
                                                color: "white",
                                                overflow: "hidden",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {user.avatar ? (
                                                <img
                                                    src={user.avatar}
                                                    alt=""
                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                />
                                            ) : (
                                                `${user.firstName[0]}${user.lastName[0]}`
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontSize: "13px",
                                                    fontWeight: 500,
                                                    color: "var(--notion-text)",
                                                }}
                                            >
                                                {user.firstName} {user.lastName}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "11px",
                                                    color: "var(--notion-text-muted)",
                                                }}
                                            >
                                                {user.email}
                                            </div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "8px",
                            marginTop: "16px",
                        }}
                    >
                        <Button type="button" variant="ghost" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            {editingProject ? "Update" : "Create Project"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setDeletingProject(null);
                }}
                title="Delete Project"
            >
                <div style={{ padding: "8px 0" }}>
                    <p style={{ margin: 0, color: "var(--notion-text-secondary)" }}>
                        Are you sure you want to delete this project?
                    </p>
                    {deletingProject && (
                        <div
                            style={{
                                marginTop: "16px",
                                padding: "12px 16px",
                                background: "var(--notion-bg-tertiary)",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--notion-border)",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div
                                    style={{
                                        width: "4px",
                                        height: "32px",
                                        borderRadius: "2px",
                                        backgroundColor: deletingProject.color,
                                    }}
                                />
                                <div>
                                    <h4 style={{ margin: 0, fontSize: "14px", color: "var(--notion-text)" }}>
                                        {deletingProject.name}
                                    </h4>
                                    {deletingProject._count.tasks > 0 && (
                                        <span style={{ fontSize: "12px", color: "var(--notion-text-muted)" }}>
                                            {deletingProject._count.tasks} task(s) will be unlinked
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <p style={{ marginTop: "16px", fontSize: "13px", color: "var(--notion-red)" }}>
                        This action cannot be undone.
                    </p>
                </div>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "8px",
                        marginTop: "16px",
                    }}
                >
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            setShowDeleteModal(false);
                            setDeletingProject(null);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        onClick={confirmDelete}
                    >
                        Delete Project
                    </Button>
                </div>
            </Modal>
        </PageContainer>
    );
}
