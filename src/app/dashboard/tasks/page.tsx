"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  Filter,
  CheckSquare,
  Zap,
  Search,
  Edit,
  Trash2,
  LayoutTemplate,
  List,
  MoreHorizontal
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

export default function TasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "board">("board");
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Drag & Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Celebration & Toast
  const { celebrate, showStreak } = useCelebration();
  const { success } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TODO",
    dueDate: "",
    assigneeId: "",
  });

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) { console.error(error); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingTask ? "PUT" : "POST";
    const url = editingTask ? `/api/tasks/${editingTask.id}` : "/api/tasks";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchTasks();
        closeModal();
      }
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) fetchTasks(); // Revert if failed
    } catch (error) {
      console.error(error);
      fetchTasks();
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedTaskId(taskId);
    // Add visual feedback
    (e.currentTarget as HTMLElement).style.opacity = "0.5";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Get task ID from dataTransfer (more reliable than state)
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (!taskId) return;

    // Find task
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== status) {
      // Optimistic update
      const updatedTasks = tasks.map(t =>
        t.id === taskId ? { ...t, status: status as any } : t
      );
      setTasks(updatedTasks);
      setDraggedTaskId(null);

      // Celebrate if moved to COMPLETED!
      if (status === "COMPLETED" && task.status !== "COMPLETED") {
        celebrate("confetti");
        success("Task completed");

        // Check for streak
        const completedToday = updatedTasks.filter(
          t => t.status === "COMPLETED"
        ).length;
        if (completedToday >= 3) {
          setTimeout(() => showStreak(completedToday, "tasks completed today!"), 500);
        }
      }

      // API Call
      try {
        await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
      } catch (err) {
        fetchTasks(); // Revert
      }
    }
    setDraggedTaskId(null);
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
      setFormData({
        title: "",
        description: "",
        priority: "MEDIUM",
        status: "TODO",
        dueDate: "",
        assigneeId: "",
      });
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

  // Board Columns
  const boardColumns = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"];

  // List Columns
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
          <span className="font-medium" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
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

  return (
    <PageContainer
      title="Tasks"
      icon="✅"
      action={
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ display: 'flex', background: 'var(--notion-bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
            <button
              onClick={() => setViewMode("list")}
              style={{
                padding: '4px 8px',
                background: viewMode === "list" ? 'var(--notion-bg-tertiary)' : 'transparent',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                color: viewMode === "list" ? 'var(--notion-text)' : 'var(--notion-text-muted)'
              }}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode("board")}
              style={{
                padding: '4px 8px',
                background: viewMode === "board" ? 'var(--notion-bg-tertiary)' : 'transparent',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                color: viewMode === "board" ? 'var(--notion-text)' : 'var(--notion-text-muted)'
              }}
            >
              <LayoutTemplate size={16} />
            </button>
          </div>
          <Button icon={<Plus size={14} />} onClick={() => openModal()}>New</Button>
        </div>
      }
    >
      <Breadcrumb />

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', margin: '24px 0', borderBottom: '1px solid var(--notion-divider)', paddingBottom: '16px' }}>
        <Input placeholder="Search tasks..." icon={<Search size={14} />} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} fullWidth={false} />
      </div>

      {loading ? (
        <div className="skeleton" style={{ width: '100%', height: '300px' }} />
      ) : viewMode === "list" ? (
        <Table columns={listColumns} data={filteredTasks} />
      ) : (
        // Kanban Board View
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          overflowX: 'auto',
          paddingBottom: '24px'
        }}>
          {boardColumns.map(status => (
            <div
              key={status}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                minWidth: '200px'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--notion-bg-secondary)'
              }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--notion-text-secondary)' }}>
                  {status.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--notion-text-muted)' }}>
                  {filteredTasks.filter(t => t.status === status).length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '200px' }}>
                {filteredTasks.filter(t => t.status === status).map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={(e) => {
                      e.currentTarget.classList.remove('opacity-50');
                      setDraggedTaskId(null);
                    }}
                    className="notion-card hover-reveal-parent"
                    style={{
                      backgroundColor: 'var(--notion-bg-secondary)',
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid transparent',
                      cursor: 'grab',
                      boxShadow: 'var(--shadow-sm)',
                      position: 'relative'
                    }}
                  >
                    <TaskHoverPreview
                      task={{
                        title: task.title,
                        status: task.status,
                        priority: task.priority,
                        dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : undefined,
                        assignee: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : undefined,
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--notion-text)', marginBottom: '8px', cursor: 'pointer' }}>
                        {task.title}
                      </div>
                    </TaskHoverPreview>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Badge variant={task.priority === 'URGENT' ? 'error' : task.priority === 'HIGH' ? 'warning' : 'default'} size="sm">
                        {task.priority}
                      </Badge>
                      {task.assignee && (
                        <div style={{
                          width: '20px', height: '20px',
                          borderRadius: '50%', backgroundColor: 'var(--notion-bg-tertiary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px'
                        }}>
                          {task.assignee.firstName[0]}
                        </div>
                      )}
                    </div>

                    {/* Hover Actions */}
                    <div className="hover-reveal" style={{
                      position: 'absolute', top: '8px', right: '8px',
                      display: 'flex', gap: '4px', background: 'var(--notion-bg-secondary)'
                    }}>
                      <button onClick={() => openModal(task)} style={{ padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--notion-text-secondary)' }}><Edit size={12} /></button>
                      <button onClick={() => handleDelete(task.id)} style={{ padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--notion-red)' }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingTask ? "Edit Task" : "New Task"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            autoFocus
          />

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '4px' }}>Status</label>
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
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '4px' }}>Priority</label>
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

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <Input
                type="date"
                label="Due Date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '4px' }}>Assignee</label>
              <select
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--notion-bg-secondary)',
                  border: '1px solid var(--notion-border)',
                  color: 'var(--notion-text)',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none'
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
            <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '4px' }}>Description</label>
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
                borderRadius: 'var(--radius-sm)',
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
    </PageContainer>
  );
}
