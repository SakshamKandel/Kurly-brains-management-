"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import useSWR, { useSWRConfig } from "swr";
import { motion } from "framer-motion";
import {
  Plus,
  Filter,
  CheckSquare,
  CheckCircle2,
  Clock,
  Zap,
  Search,
  Edit,
  Trash2,
  LayoutTemplate,
  List,
  MoreHorizontal,
  ArrowRight,
} from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/layout/Breadcrumb";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Dropdown from "@/components/ui/Dropdown";
import Table from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { TaskHoverPreview } from "@/components/ui/HoverPreview";
import { useCelebration } from "@/components/ui/Celebration";
import { useToast } from "@/components/ui/Toast";
import TaskDetailPanel from "@/components/tasks/TaskDetailPanel";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "CANCELLED";
  dueDate: string | null;
  assignee: { id: string; firstName: string; lastName: string } | null;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

/* ─── Priority color helper ─── */
function priColor(p: string) {
  switch (p) {
    case "URGENT": return "var(--notion-red)";
    case "HIGH": return "var(--brand-blue)";
    case "MEDIUM": return "var(--notion-text-secondary)";
    default: return "var(--notion-text-muted)";
  }
}

/* ─── Status column accent ─── */
function statusAccent(s: string) {
  switch (s) {
    case "TODO": return "var(--notion-text-muted)";
    case "IN_PROGRESS": return "var(--brand-blue)";
    case "REVIEW": return "var(--notion-blue)";
    case "COMPLETED": return "var(--notion-green)";
    default: return "var(--notion-text-muted)";
  }
}

/* ─── Section Header ─── */
function SectionHeader({ title, trailing }: { title: string; trailing?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--brand-blue)" }} />
      <h3 className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: "var(--notion-text-secondary)" }}>
        {title}
      </h3>
      <div className="flex-1 h-px" style={{ background: "var(--notion-border)" }} />
      {trailing && (
        <span className="text-[9px] font-mono tracking-widest uppercase opacity-30 cursor-default select-none" style={{ color: "var(--notion-text-secondary)" }}>
          {trailing}
        </span>
      )}
    </div>
  );
}

export default function TasksPage() {
  const { data: session } = useSession();
  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  const { data: tasksData, error, mutate } = useSWR<Task[]>("/api/tasks", fetcher);
  const { data: usersData } = useSWR<User[]>("/api/users", fetcher);

  const tasks = tasksData || [];
  const users = usersData || [];
  const loading = !tasksData && !error;

  const { mutate: globalMutate } = useSWRConfig();

  const refreshDashboard = () => {
    globalMutate("/api/admin/stats");
    globalMutate("/api/tasks?limit=5");
  };

  const [viewMode, setViewMode] = useState<"list" | "board">("board");
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { celebrate, showStreak } = useCelebration();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TODO",
    dueDate: "",
    assigneeId: "",
  });

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1024px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = !!editingTask;
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `/api/tasks/${editingTask!.id}` : "/api/tasks";

    // Optimistic update — update UI before server responds
    if (isEditing && editingTask) {
      const optimisticTasks = tasks.map(t =>
        t.id === editingTask.id
          ? {
            ...t,
            title: formData.title,
            description: formData.description || null,
            priority: formData.priority as Task["priority"],
            status: formData.status as Task["status"],
            dueDate: formData.dueDate || null,
            assignee: users.find(u => u.id === formData.assigneeId) || t.assignee,
          }
          : t
      );
      mutate(optimisticTasks, false);
    } else {
      const tempTask: Task = {
        id: `temp-${Date.now()}`,
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority as Task["priority"],
        status: formData.status as Task["status"],
        dueDate: formData.dueDate || null,
        assignee: users.find(u => u.id === formData.assigneeId) || null,
      };
      mutate([...tasks, tempTask], false);
    }
    closeModal();
    success(isEditing ? "Task updated" : "Task created");

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed");
      mutate();
      refreshDashboard();
    } catch (error) {
      console.error(error);
      mutate(); // revert optimistic update
      showError(isEditing ? "Failed to update task" : "Failed to create task");
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    mutate(tasks.filter(t => t.id !== taskId), false);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) mutate();
      else { success("Task deleted"); refreshDashboard(); }
    } catch (error) { console.error(error); mutate(); }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedTaskId(taskId);
    (e.currentTarget as HTMLElement).style.opacity = "0.5";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (!taskId) return;
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== status) {
      const updatedTasks = tasks.map(t =>
        t.id === taskId ? { ...t, status: status as any } : t
      );
      mutate(updatedTasks, false);
      setDraggedTaskId(null);
      if (status === "COMPLETED" && task.status !== "COMPLETED") {
        celebrate("confetti");
        success("Task completed");
        const completedToday = updatedTasks.filter(t => t.status === "COMPLETED").length;
        if (completedToday >= 3) {
          setTimeout(() => showStreak(completedToday, "tasks completed today!"), 500);
        }
      }
      try {
        await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        mutate();
        refreshDashboard();
      } catch (err) { mutate(); }
    }
    setDraggedTaskId(null);
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === status) return true;
    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, status: status as any } : t
    );
    mutate(updatedTasks, false);
    if (status === "COMPLETED" && task.status !== "COMPLETED") {
      celebrate("confetti");
      success("Task completed");
      const completedToday = updatedTasks.filter(t => t.status === "COMPLETED").length;
      if (completedToday >= 3) {
        setTimeout(() => showStreak(completedToday, "tasks completed today!"), 500);
      }
    }
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update status");
      mutate();
      refreshDashboard();
      return true;
    } catch (err) { mutate(); return false; }
  };

  const openModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate?.split("T")[0] || "",
        assigneeId: task.assignee?.id || "",
      });
    } else {
      setEditingTask(null);
      setFormData({ title: "", description: "", priority: "MEDIUM", status: "TODO", dueDate: "", assigneeId: "" });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"];
  const boardColumns = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"];

  const listColumns = [
    {
      key: "title",
      header: "Task Name",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, row: Task) => (
        <TaskHoverPreview
          task={{
            title: row.title,
            status: row.status,
            priority: row.priority,
            dueDate: row.dueDate ? new Date(row.dueDate).toLocaleDateString() : undefined,
            assignee: row.assignee ? `${row.assignee.firstName} ${row.assignee.lastName}` : undefined,
          }}
        >
          <span className="font-medium hover:text-[var(--brand-blue)] transition-colors" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setSelectedTaskId(row.id)}>
            {row.priority === 'URGENT' && <Zap size={14} color="var(--notion-red)" />}
            {row.title}
          </span>
        </TaskHoverPreview>
      )
    },
    {
      key: "status",
      header: "Status",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, row: Task) => (
        <Badge variant={row.status === 'COMPLETED' ? 'success' : row.status === 'IN_PROGRESS' ? 'info' : 'default'} size="sm">
          {row.status.replace('_', ' ')}
        </Badge>
      )
    },
    {
      key: "assignee",
      header: "Assignee",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, row: Task) => (
        row.assignee ? (
          <span className="text-sm">{row.assignee.firstName}</span>
        ) : <span className="text-muted text-sm">-</span>
      )
    },
    {
      key: "actions",
      header: "",
      align: "right" as const,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, row: Task) => (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
          <Button size="sm" variant="ghost" onClick={() => openModal(row)}><Edit size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(row.id)}><Trash2 size={14} color="var(--notion-red)" /></Button>
        </div>
      )
    }
  ];

  const effectiveViewMode = isMobile ? "list" : viewMode;

  /* ─── Metric counts ─── */
  const todoCount = tasks.filter(t => t.status === "TODO").length;
  const inProgressCount = tasks.filter(t => t.status === "IN_PROGRESS").length;
  const completedCount = tasks.filter(t => t.status === "COMPLETED").length;

  return (
    <PageContainer
      title="Tasks"
      icon="✅"
      action={
        <div className="flex items-center gap-2">
          {!isMobile && (
            <div className="flex" style={{ background: 'var(--notion-bg-tertiary)', borderRadius: '2px', padding: '2px' }}>
              <button
                onClick={() => setViewMode("list")}
                className="transition-colors"
                style={{
                  padding: '5px 8px',
                  background: viewMode === "list" ? 'var(--notion-bg-secondary)' : 'transparent',
                  borderRadius: '2px',
                  border: viewMode === "list" ? '1px solid var(--notion-border)' : '1px solid transparent',
                  cursor: 'pointer',
                  color: viewMode === "list" ? 'var(--notion-text)' : 'var(--notion-text-muted)'
                }}
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setViewMode("board")}
                className="transition-colors"
                style={{
                  padding: '5px 8px',
                  background: viewMode === "board" ? 'var(--notion-bg-secondary)' : 'transparent',
                  borderRadius: '2px',
                  border: viewMode === "board" ? '1px solid var(--notion-border)' : '1px solid transparent',
                  cursor: 'pointer',
                  color: viewMode === "board" ? 'var(--notion-text)' : 'var(--notion-text-muted)'
                }}
              >
                <LayoutTemplate size={14} />
              </button>
            </div>
          )}
          <Button icon={<Plus size={14} />} onClick={() => openModal()}>New</Button>
        </div>
      }
    >
      <Breadcrumb />

      {/* ═══ Stat Tiles ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 mb-8">
        {[
          { label: "To Do", count: todoCount, color: "var(--notion-text)", accent: "var(--notion-text-muted)", icon: CheckSquare, delay: 0.1 },
          { label: "In Progress", count: inProgressCount, color: "var(--brand-blue)", accent: "var(--brand-blue)", icon: Zap, delay: 0.2 },
          { label: "Done", count: completedCount, color: "var(--notion-green)", accent: "var(--notion-green)", icon: CheckCircle2, delay: 0.3 },
        ].map((m) => (
          <Card key={m.label} animated delay={m.delay} padding="none" hoverEffect className="group flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px]" style={{ background: `linear-gradient(to right, transparent, ${m.accent}, transparent)` }} />
            <div className="p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-5">
                <m.icon size={16} style={{ color: m.accent }} />
              </div>
              <div>
                <div className="text-4xl font-extralight tabular-nums tracking-tighter mb-1" style={{ color: m.color }}>
                  {m.count}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: "var(--notion-text-muted)" }}>
                  {m.label}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ═══ Filter Bar ═══ */}
      <Card animated delay={0.35} padding="none" className="mb-6 overflow-hidden">
        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--brand-blue)" }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: "var(--notion-text-secondary)" }}>
              {effectiveViewMode === "board" ? "Board" : "List"}
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--notion-border)" }} />
            <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: "var(--brand-blue)" }}>
              {filteredTasks.length} tasks
            </span>
          </div>
          <div className="shrink-0">
            <Input placeholder="Search tasks..." icon={<Search size={14} />} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} fullWidth={false} />
          </div>
        </div>
      </Card>

      {/* ═══ Content ═══ */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} padding="none" className="h-64">
              <div className="h-[2px] w-full skeleton" />
              <div className="p-4 flex flex-col gap-3">
                <div className="skeleton h-4 w-24 rounded" />
                {[1, 2, 3].map(j => <div key={j} className="skeleton h-16 w-full rounded" />)}
              </div>
            </Card>
          ))}
        </div>
      ) : effectiveViewMode === "list" ? (
        isMobile ? (
          /* ─── Mobile Task Cards ─── */
          <div className="flex flex-col gap-3">
            {filteredTasks.length === 0 ? (
              <Card animated delay={0.3} padding="none" className="overflow-hidden">
                <div className="flex flex-col items-center justify-center py-20 gap-2" style={{ color: "var(--notion-text-muted)" }}>
                  <CheckSquare size={20} strokeWidth={1} />
                  <span className="text-[11px] tracking-widest uppercase">No tasks found</span>
                </div>
              </Card>
            ) : (
              filteredTasks.map((task, idx) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  className="group/card relative overflow-hidden transition-all duration-300"
                  style={{
                    background: "var(--notion-bg-secondary)",
                    border: "1px solid var(--notion-border)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 z-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at center, var(--notion-bg-active) 0%, transparent 70%)' }} />

                  {/* Priority left accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: priColor(task.priority) }} />

                  <div className="relative z-10 p-4 pl-5">
                    <div className="flex items-center gap-2 mb-2">
                      {task.priority === 'URGENT' && <Zap size={12} color="var(--notion-red)" />}
                      <span className="text-[13px] font-medium cursor-pointer hover:text-[var(--brand-blue)] transition-colors" style={{ color: "var(--notion-text)" }} onClick={() => setSelectedTaskId(task.id)}>{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <Badge variant={task.status === 'COMPLETED' ? 'success' : task.status === 'IN_PROGRESS' ? 'info' : 'default'} size="sm">
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant={task.priority === 'URGENT' ? 'error' : task.priority === 'HIGH' ? 'warning' : 'default'} size="sm">
                        {task.priority}
                      </Badge>
                      {task.assignee && (
                        <span className="text-[11px]" style={{ color: "var(--notion-text-secondary)" }}>{task.assignee.firstName}</span>
                      )}
                      {task.dueDate && (
                        <span className="text-[11px] font-mono" style={{ color: "var(--notion-text-muted)" }}>
                          {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {/* Status switcher */}
                    <div className="flex flex-wrap gap-1.5">
                      {statusOptions.map((status) => {
                        const isActive = (statusOverrides[task.id] ?? task.status) === status;
                        const isUpdating = statusOverrides[task.id] !== undefined;
                        return (
                          <button
                            key={status}
                            type="button"
                            disabled={isUpdating && !isActive}
                            onClick={async () => {
                              if (status === task.status) return;
                              setStatusOverrides(prev => ({ ...prev, [task.id]: status }));
                              const ok = await updateTaskStatus(task.id, status);
                              setStatusOverrides(prev => {
                                const updated = { ...prev };
                                delete updated[task.id];
                                return updated;
                              });
                              if (!ok) showError("Couldn't update task status");
                            }}
                            className="transition-all"
                            style={{
                              padding: '4px 8px',
                              background: isActive ? 'var(--notion-bg-tertiary)' : 'transparent',
                              border: isActive ? '1px solid var(--brand-blue)' : '1px solid var(--notion-border)',
                              color: isActive ? 'var(--notion-text)' : 'var(--notion-text-secondary)',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: isActive ? 600 : 400,
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase' as const,
                              cursor: isUpdating && !isActive ? 'not-allowed' : 'pointer',
                              opacity: isUpdating && !isActive ? 0.5 : 1,
                            }}
                          >
                            {status.replace('_', ' ')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <Table columns={listColumns} data={filteredTasks} />
        )
      ) : (
        /* ═══ Kanban Board View ═══ */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          overflowX: 'auto',
          paddingBottom: '24px'
        }}>
          {boardColumns.map((status, colIdx) => (
            <Card
              key={status}
              animated
              delay={0.4 + colIdx * 0.08}
              padding="none"
              hoverEffect={false}
              className="flex flex-col relative overflow-hidden"
              style={{ minWidth: '200px' }}
            >
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                className="flex flex-col h-full"
              >
                {/* Column header — gradient accent bar on top */}
                <div className="relative">
                  <div className="h-[2px] w-full" style={{ background: `linear-gradient(to right, transparent, ${statusAccent(status)}, transparent)` }} />
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      {status === 'TODO' && <CheckSquare size={12} style={{ color: statusAccent(status) }} />}
                      {status === 'IN_PROGRESS' && <Zap size={12} style={{ color: statusAccent(status) }} />}
                      {status === 'REVIEW' && <Clock size={12} style={{ color: statusAccent(status) }} />}
                      {status === 'COMPLETED' && <CheckCircle2 size={12} style={{ color: statusAccent(status) }} />}
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--notion-text-secondary)" }}>
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                    <span
                      className="text-[9px] font-mono tabular-nums px-1.5 py-0.5"
                      style={{ color: statusAccent(status), background: "rgba(255,255,255,0.04)", borderRadius: "4px", border: "1px solid var(--notion-border)" }}
                    >
                      {filteredTasks.filter(t => t.status === status).length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 p-2 flex-1" style={{ minHeight: '200px' }}>
                  {filteredTasks.filter(t => t.status === status).length === 0 && (
                    <div className="flex flex-col items-center justify-center flex-1 gap-2 py-10" style={{ color: "var(--notion-text-muted)" }}>
                      <CheckSquare size={16} strokeWidth={1} />
                      <span className="text-[9px] tracking-widest uppercase">No tasks</span>
                    </div>
                  )}
                  {filteredTasks.filter(t => t.status === status).map((task, cardIdx) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: cardIdx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                      draggable
                      onDragStart={(e) => handleDragStart(e as any, task.id)}
                      onDragEnd={(e) => {
                        (e.currentTarget as HTMLElement).style.opacity = '1';
                        setDraggedTaskId(null);
                      }}
                      className="group/card relative overflow-hidden transition-all duration-300 cursor-grab"
                      style={{
                        background: "var(--notion-bg-secondary)",
                        border: "1px solid var(--notion-border)",
                        borderRadius: "var(--radius-md)",
                      }}
                      whileHover={{
                        borderColor: "rgba(255,255,255,0.1)",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
                      }}
                    >
                      {/* Hover glow */}
                      <div className="absolute inset-0 z-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{ background: 'radial-gradient(circle at center, var(--notion-bg-active) 0%, transparent 70%)' }} />

                      {/* Priority accent bar - left */}
                      <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: priColor(task.priority) }} />

                      <div className="relative z-10 p-3 pl-4">
                        <TaskHoverPreview
                          task={{
                            title: task.title,
                            status: task.status,
                            priority: task.priority,
                            dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : undefined,
                            assignee: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : undefined,
                          }}
                        >
                          <div
                            className="text-[13px] font-medium mb-2.5 cursor-pointer leading-snug hover:text-[var(--brand-blue)] transition-colors"
                            style={{ color: "var(--notion-text)" }}
                            onClick={(e) => { e.stopPropagation(); setSelectedTaskId(task.id); }}
                          >
                            {task.title}
                          </div>
                        </TaskHoverPreview>

                        <div className="flex justify-between items-center">
                          <Badge
                            variant={task.priority === 'URGENT' ? 'error' : task.priority === 'HIGH' ? 'warning' : 'default'}
                            size="sm"
                            className="text-[8px] tracking-[0.1em] uppercase"
                            style={{ background: "transparent", border: "1px solid var(--notion-border)", borderRadius: "4px" }}
                          >
                            {task.priority}
                          </Badge>
                          <div className="flex items-center gap-1.5">
                            {task.dueDate && (
                              <span className="text-[9px] font-mono" style={{ color: "var(--notion-text-muted)" }}>
                                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            {task.assignee && (
                              <div
                                className="w-5 h-5 flex items-center justify-center text-[9px] font-semibold"
                                style={{
                                  background: "var(--notion-bg-tertiary)",
                                  borderRadius: "4px",
                                  color: "var(--notion-text-secondary)",
                                  border: "1px solid var(--notion-border)",
                                }}
                              >
                                {task.assignee.firstName[0]}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Hover actions */}
                      <div
                        className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity"
                        style={{ background: "var(--notion-bg-secondary)", borderRadius: "4px", padding: "2px", border: "1px solid var(--notion-border)" }}
                      >
                        <button onClick={() => openModal(task)} className="p-1 border-none bg-transparent cursor-pointer transition-colors hover:text-[var(--brand-blue)]" style={{ color: "var(--notion-text-secondary)" }}>
                          <Edit size={11} />
                        </button>
                        <button onClick={() => handleDelete(task.id)} className="p-1 border-none bg-transparent cursor-pointer transition-colors hover:text-[var(--notion-red)]" style={{ color: "var(--notion-text-secondary)" }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ═══ Modal ═══ */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingTask ? "Edit Task" : "New Task"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            autoFocus
          />
          <div className="responsive-stack">
            <div style={{ flex: 1 }}>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--notion-text-secondary)' }}>Status</label>
              <Dropdown
                options={[
                  { value: "TODO", label: "To Do" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "REVIEW", label: "Review" },
                  { value: "COMPLETED", label: "Done" },
                ]}
                value={formData.status}
                onChange={(val) => setFormData({ ...formData, status: val })}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--notion-text-secondary)' }}>Priority</label>
              <Dropdown
                options={[
                  { value: "LOW", label: "Low" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HIGH", label: "High" },
                  { value: "URGENT", label: "Urgent" },
                ]}
                value={formData.priority}
                onChange={(val) => setFormData({ ...formData, priority: val })}
              />
            </div>
          </div>
          <div className="responsive-stack">
            <div style={{ flex: 1 }}>
              <Input
                type="date"
                label="Due Date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--notion-text-secondary)' }}>Assignee</label>
              <select
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--notion-bg-secondary)',
                  border: '1px solid var(--notion-border)',
                  color: 'var(--notion-text)',
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                  fontSize: '14px',
                }}
                value={formData.assigneeId}
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--notion-text-secondary)' }}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              style={{
                width: '100%',
                background: 'var(--notion-bg-secondary)',
                border: '1px solid var(--notion-border)',
                color: 'var(--notion-text)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                resize: 'vertical',
                fontSize: '14px',
                fontFamily: 'var(--font-body)',
                outline: 'none'
              }}
              placeholder="Add more details..."
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary">
              {editingTask ? 'Update' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ═══ Detail Panel ═══ */}
      <TaskDetailPanel
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdate={() => mutate()}
        users={users}
      />
    </PageContainer>
  );
}
