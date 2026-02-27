"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import {
    ArrowLeft,
    Settings,
    Users,
    CheckSquare,
    Calendar,
    Plus,
    Edit,
    Trash2,
    UserPlus,
    X,
} from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/layout/Breadcrumb";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Dropdown from "@/components/ui/Dropdown";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

interface Project {
    id: string;
    name: string;
    description: string | null;
    color: string;
    status: "ACTIVE" | "COMPLETED" | "ON_HOLD" | "ARCHIVED";
    client: { id: string; name: string; email?: string } | null;
    createdBy: { id: string; firstName: string; lastName: string; avatar: string | null };
    members: {
        id: string;
        role: string;
        user: { id: string; firstName: string; lastName: string; avatar: string | null; email?: string };
    }[];
    tasks: {
        id: string;
        title: string;
        status: string;
        priority: string;
        assignee: { id: string; firstName: string; lastName: string; avatar: string | null } | null;
    }[];
    _count: { tasks: number };
    createdAt: string;
    updatedAt: string;
}

interface User {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const statusColors: Record<string, string> = {
    TODO: "#6b7280",
    IN_PROGRESS: "#3b82f6",
    REVIEW: "#eab308",
    COMPLETED: "#22c55e",
    CANCELLED: "#ef4444",
};

const priorityBadge: Record<string, "default" | "warning" | "error"> = {
    LOW: "default",
    MEDIUM: "default",
    HIGH: "warning",
    URGENT: "error",
};

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const { data: project, mutate } = useSWR<Project>(`/api/projects/${projectId}`, fetcher);
    const { data: users } = useSWR<User[]>("/api/users", fetcher);

    const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "members" | "settings">("overview");
    const [showAddMember, setShowAddMember] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [taskForm, setTaskForm] = useState({
        title: "",
        description: "",
        priority: "MEDIUM",
        status: "TODO",
        assigneeId: "",
    });
    const [taskCreating, setTaskCreating] = useState(false);

    const { success, error: showError } = useToast();

    if (!project) {
        return (
            <PageContainer title="Loading..." icon="📂">
                <div className="skeleton" style={{ width: "100%", height: "400px" }} />
            </PageContainer>
        );
    }

    const handleAddMember = async () => {
        if (!selectedUserId) return;

        try {
            const res = await fetch(`/api/projects/${projectId}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: selectedUserId }),
            });

            if (res.ok) {
                mutate();
                setShowAddMember(false);
                setSelectedUserId("");
                success("Member added");
            } else {
                const data = await res.json();
                showError(data.error || "Failed to add member");
            }
        } catch (err) {
            showError("Something went wrong");
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm("Remove this member from the project?")) return;

        try {
            const res = await fetch(`/api/projects/${projectId}/members?userId=${userId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                mutate();
                success("Member removed");
            } else {
                const data = await res.json();
                showError(data.error || "Failed to remove member");
            }
        } catch (err) {
            showError("Something went wrong");
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                mutate();
                success("Status updated");
            }
        } catch (err) {
            showError("Failed to update status");
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskForm.title.trim()) return;
        setTaskCreating(true);
        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...taskForm,
                    projectId,
                    assigneeId: taskForm.assigneeId || undefined,
                }),
            });
            if (res.ok) {
                mutate();
                setShowTaskModal(false);
                setTaskForm({ title: "", description: "", priority: "MEDIUM", status: "TODO", assigneeId: "" });
                success("Task created");
            } else {
                const data = await res.json();
                showError(data.error || "Failed to create task");
            }
        } catch (err) {
            showError("Something went wrong");
        } finally {
            setTaskCreating(false);
        }
    };

    const tabs = [
        { id: "overview", label: "Overview", icon: <CheckSquare size={14} /> },
        { id: "tasks", label: "Tasks", icon: <CheckSquare size={14} /> },
        { id: "members", label: "Members", icon: <Users size={14} /> },
        { id: "settings", label: "Settings", icon: <Settings size={14} /> },
    ];

    const tasksByStatus = {
        TODO: project.tasks.filter((t) => t.status === "TODO"),
        IN_PROGRESS: project.tasks.filter((t) => t.status === "IN_PROGRESS"),
        REVIEW: project.tasks.filter((t) => t.status === "REVIEW"),
        COMPLETED: project.tasks.filter((t) => t.status === "COMPLETED"),
    };

    const availableUsers = (users || []).filter(
        (u) => !project.members.some((m) => m.user.id === u.id)
    );

    return (
        <PageContainer
            title={project.name}
            icon="📂"
            action={
                <Link href="/dashboard/projects">
                    <Button variant="ghost" icon={<ArrowLeft size={14} />}>
                        Back
                    </Button>
                </Link>
            }
        >
            <Breadcrumb />

            {/* Header */}
            <div
                style={{
                    padding: "24px",
                    background: "var(--notion-bg-secondary)",
                    borderRadius: "var(--radius-md)",
                    marginBottom: "24px",
                    borderTop: `4px solid ${project.color}`,
                }}
            >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div>
                        <h1 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: 600 }}>{project.name}</h1>
                        {project.description && (
                            <p style={{ color: "var(--notion-text-secondary)", margin: 0 }}>{project.description}</p>
                        )}
                        {project.client && (
                            <p style={{ color: "var(--notion-text-muted)", margin: "8px 0 0 0", fontSize: "13px" }}>
                                Client: {project.client.name}
                            </p>
                        )}
                    </div>
                    <Dropdown
                        options={[
                            { value: "ACTIVE", label: "Active" },
                            { value: "COMPLETED", label: "Completed" },
                            { value: "ON_HOLD", label: "On Hold" },
                            { value: "ARCHIVED", label: "Archived" },
                        ]}
                        value={project.status}
                        onChange={handleStatusChange}
                    />
                </div>

                {/* Quick Stats */}
                <div
                    style={{
                        display: "flex",
                        gap: "24px",
                        marginTop: "20px",
                        paddingTop: "16px",
                        borderTop: "1px solid var(--notion-divider)",
                    }}
                >
                    <div>
                        <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--notion-text)" }}>
                            {project._count.tasks}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--notion-text-muted)" }}>Total Tasks</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "24px", fontWeight: 600, color: "#22c55e" }}>
                            {tasksByStatus.COMPLETED.length}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--notion-text-muted)" }}>Completed</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "24px", fontWeight: 600, color: "#3b82f6" }}>
                            {tasksByStatus.IN_PROGRESS.length}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--notion-text-muted)" }}>In Progress</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--notion-text)" }}>
                            {project.members.length}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--notion-text-muted)" }}>Members</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div
                style={{
                    display: "flex",
                    gap: "4px",
                    marginBottom: "24px",
                    borderBottom: "1px solid var(--notion-divider)",
                    paddingBottom: "0",
                }}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "10px 16px",
                            background: "transparent",
                            border: "none",
                            borderBottom: activeTab === tab.id ? "2px solid var(--notion-primary)" : "2px solid transparent",
                            color: activeTab === tab.id ? "var(--notion-text)" : "var(--notion-text-muted)",
                            fontWeight: activeTab === tab.id ? 500 : 400,
                            cursor: "pointer",
                            marginBottom: "-1px",
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                    {Object.entries(tasksByStatus).map(([status, tasks]) => (
                        <div
                            key={status}
                            style={{
                                padding: "16px",
                                background: "var(--notion-bg-secondary)",
                                borderRadius: "var(--radius-md)",
                                borderTop: `3px solid ${statusColors[status]}`,
                            }}
                        >
                            <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "var(--notion-text-muted)" }}>
                                {status.replace("_", " ")} ({tasks.length})
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {tasks.slice(0, 5).map((task) => (
                                    <Link
                                        key={task.id}
                                        href={`/dashboard/tasks?task=${task.id}`}
                                        style={{
                                            padding: "8px 10px",
                                            background: "var(--notion-bg-tertiary)",
                                            borderRadius: "var(--radius-sm)",
                                            fontSize: "13px",
                                            color: "var(--notion-text)",
                                            textDecoration: "none",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {task.title}
                                        </span>
                                        <Badge variant={priorityBadge[task.priority]} size="sm">
                                            {task.priority}
                                        </Badge>
                                    </Link>
                                ))}
                                {tasks.length > 5 && (
                                    <span style={{ fontSize: "12px", color: "var(--notion-text-muted)", textAlign: "center" }}>
                                        +{tasks.length - 5} more
                                    </span>
                                )}
                                {tasks.length === 0 && (
                                    <span style={{ fontSize: "12px", color: "var(--notion-text-muted)" }}>No tasks</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === "tasks" && (
                <div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                        <Button icon={<Plus size={14} />} onClick={() => setShowTaskModal(true)}>New Task</Button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {project.tasks.map((task) => (
                            <div
                                key={task.id}
                                style={{
                                    padding: "12px 16px",
                                    background: "var(--notion-bg-secondary)",
                                    borderRadius: "var(--radius-sm)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div
                                        style={{
                                            width: "10px",
                                            height: "10px",
                                            borderRadius: "50%",
                                            backgroundColor: statusColors[task.status],
                                        }}
                                    />
                                    <span style={{ fontWeight: 500 }}>{task.title}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Badge variant={priorityBadge[task.priority]} size="sm">
                                        {task.priority}
                                    </Badge>
                                    {task.assignee && (
                                        <div
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
                                            }}
                                        >
                                            {task.assignee.firstName[0]}
                                            {task.assignee.lastName[0]}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {project.tasks.length === 0 && (
                            <div style={{ textAlign: "center", padding: "40px", color: "var(--notion-text-muted)" }}>
                                No tasks in this project yet
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "members" && (
                <div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                        <Button icon={<UserPlus size={14} />} onClick={() => setShowAddMember(true)}>
                            Add Member
                        </Button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {project.members.map((member) => (
                            <div
                                key={member.id}
                                style={{
                                    padding: "12px 16px",
                                    background: "var(--notion-bg-secondary)",
                                    borderRadius: "var(--radius-sm)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div
                                        style={{
                                            width: "36px",
                                            height: "36px",
                                            borderRadius: "50%",
                                            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "12px",
                                            color: "white",
                                            fontWeight: 500,
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
                                    <div>
                                        <div style={{ fontWeight: 500 }}>
                                            {member.user.firstName} {member.user.lastName}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "var(--notion-text-muted)" }}>
                                            {member.role}
                                        </div>
                                    </div>
                                </div>
                                {member.role !== "OWNER" && (
                                    <button
                                        onClick={() => handleRemoveMember(member.user.id)}
                                        style={{
                                            padding: "6px",
                                            border: "none",
                                            background: "transparent",
                                            cursor: "pointer",
                                            color: "var(--notion-red)",
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "settings" && (
                <div
                    style={{
                        padding: "24px",
                        background: "var(--notion-bg-secondary)",
                        borderRadius: "var(--radius-md)",
                    }}
                >
                    <h3 style={{ margin: "0 0 16px 0" }}>Project Settings</h3>
                    <p style={{ color: "var(--notion-text-muted)", fontSize: "14px" }}>
                        Edit project details on the main projects page.
                    </p>
                    <div style={{ marginTop: "24px" }}>
                        <Button
                            variant="ghost"
                            onClick={() => router.push("/dashboard/projects")}
                            icon={<Edit size={14} />}
                        >
                            Edit Project
                        </Button>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Team Member">
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            background: "var(--notion-bg-secondary)",
                            border: "1px solid var(--notion-border)",
                            color: "var(--notion-text)",
                            borderRadius: "var(--radius-sm)",
                        }}
                    >
                        <option value="">Select a team member</option>
                        {availableUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
                            </option>
                        ))}
                    </select>
                    {availableUsers.length === 0 && (
                        <p style={{ color: "var(--notion-text-muted)", fontSize: "13px" }}>
                            All team members are already added to this project.
                        </p>
                    )}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <Button variant="ghost" onClick={() => setShowAddMember(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddMember} disabled={!selectedUserId}>
                            Add Member
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Create Task Modal */}
            <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="New Task">
                <form onSubmit={handleCreateTask} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <Input
                        label="Task Title"
                        value={taskForm.title}
                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                        required
                        autoFocus
                        placeholder="Task name..."
                    />
                    <div className="responsive-stack">
                        <div style={{ flex: 1 }}>
                            <label className="text-xs text-muted" style={{ display: "block", marginBottom: "4px" }}>Priority</label>
                            <select
                                value={taskForm.priority}
                                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                                style={{ width: "100%", padding: "10px 12px", background: "var(--notion-bg-secondary)", border: "1px solid var(--notion-border)", color: "var(--notion-text)", borderRadius: "var(--radius-sm)" }}
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="text-xs text-muted" style={{ display: "block", marginBottom: "4px" }}>Status</label>
                            <select
                                value={taskForm.status}
                                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                                style={{ width: "100%", padding: "10px 12px", background: "var(--notion-bg-secondary)", border: "1px solid var(--notion-border)", color: "var(--notion-text)", borderRadius: "var(--radius-sm)" }}
                            >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="REVIEW">Review</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-muted" style={{ display: "block", marginBottom: "4px" }}>Assignee</label>
                        <select
                            value={taskForm.assigneeId}
                            onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                            style={{ width: "100%", padding: "10px 12px", background: "var(--notion-bg-secondary)", border: "1px solid var(--notion-border)", color: "var(--notion-text)", borderRadius: "var(--radius-sm)" }}
                        >
                            <option value="">Unassigned</option>
                            {project.members.map((m) => (
                                <option key={m.user.id} value={m.user.id}>{m.user.firstName} {m.user.lastName}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-muted" style={{ display: "block", marginBottom: "4px" }}>Description</label>
                        <textarea
                            value={taskForm.description}
                            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                            rows={2}
                            style={{ width: "100%", background: "var(--notion-bg-secondary)", border: "1px solid var(--notion-border)", color: "var(--notion-text)", padding: "8px 12px", borderRadius: "var(--radius-sm)", resize: "vertical", fontSize: "14px", fontFamily: "var(--font-body)", outline: "none" }}
                            placeholder="Description..."
                        />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <Button type="button" variant="ghost" onClick={() => setShowTaskModal(false)}>Cancel</Button>
                        <Button type="submit" disabled={taskCreating || !taskForm.title.trim()}>
                            {taskCreating ? "Creating..." : "Create Task"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </PageContainer>
    );
}
