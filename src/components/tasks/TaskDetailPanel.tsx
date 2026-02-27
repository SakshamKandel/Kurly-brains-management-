"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import {
    X,
    CheckSquare,
    Zap,
    Clock,
    User,
    MessageSquare,
    Send,
    Paperclip,
    Calendar,
    Edit3,
    CheckCircle2,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface TaskDetail {
    id: string;
    title: string;
    description: string | null;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    status: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "CANCELLED";
    dueDate: string | null;
    attachments: string[];
    createdAt: string;
    updatedAt: string;
    creator: { id: string; firstName: string; lastName: string };
    assignee: { id: string; firstName: string; lastName: string } | null;
    project: { id: string; name: string; color: string } | null;
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; firstName: string; lastName: string; avatar: string | null };
}

interface UserInfo {
    id: string;
    firstName: string;
    lastName: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function statusVariant(s: string) {
    switch (s) {
        case "COMPLETED": return "success" as const;
        case "IN_PROGRESS": return "info" as const;
        case "REVIEW": return "warning" as const;
        default: return "default" as const;
    }
}

function priorityColor(p: string) {
    switch (p) {
        case "URGENT": return "var(--notion-red)";
        case "HIGH": return "var(--brand-blue)";
        case "MEDIUM": return "var(--notion-text-secondary)";
        default: return "var(--notion-text-muted)";
    }
}

function timeAgo(dateStr: string) {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export default function TaskDetailPanel({
    taskId,
    isOpen,
    onClose,
    onTaskUpdate,
    users = [],
}: {
    taskId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onTaskUpdate?: () => void;
    users?: UserInfo[];
}) {
    const { data: task, mutate: mutateTask } = useSWR<TaskDetail>(
        taskId && isOpen ? `/api/tasks/${taskId}` : null,
        fetcher
    );
    const { data: comments = [], mutate: mutateComments } = useSWR<Comment[]>(
        taskId && isOpen ? `/api/tasks/${taskId}/comments` : null,
        fetcher
    );

    const [newComment, setNewComment] = useState("");
    const [sendingComment, setSendingComment] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const commentsEndRef = useRef<HTMLDivElement>(null);
    const { success, error: showError } = useToast();

    useEffect(() => {
        if (task) {
            setEditTitle(task.title);
            setEditDescription(task.description || "");
        }
    }, [task]);

    useEffect(() => {
        if (commentsEndRef.current) {
            commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [comments]);

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    const handleSendComment = async () => {
        if (!newComment.trim() || !taskId) return;
        setSendingComment(true);
        try {
            const res = await fetch(`/api/tasks/${taskId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newComment.trim() }),
            });
            if (!res.ok) throw new Error("Failed");
            setNewComment("");
            mutateComments();
        } catch {
            showError("Failed to post comment");
        } finally {
            setSendingComment(false);
        }
    };

    const handleFieldUpdate = async (field: string, value: string) => {
        if (!taskId) return;
        setEditingField(null);
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [field]: value || null }),
            });
            if (!res.ok) throw new Error("Failed");
            mutateTask();
            onTaskUpdate?.();
            success("Task updated");
        } catch {
            showError("Failed to update task");
        }
    };

    const handleStatusChange = async (status: string) => {
        if (!taskId) return;
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Failed");
            mutateTask();
            onTaskUpdate?.();
        } catch {
            showError("Failed to update status");
        }
    };

    const statuses = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40"
                        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
                        style={{
                            width: "min(560px, 90vw)",
                            background: "var(--notion-bg)",
                            borderLeft: "1px solid var(--notion-border)",
                            boxShadow: "-8px 0 40px rgba(0,0,0,0.3)",
                        }}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-6 py-4 shrink-0"
                            style={{ borderBottom: "1px solid var(--notion-border)" }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: priorityColor(task?.priority || "LOW") }} />
                                <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: "var(--notion-text-secondary)" }}>
                                    Task Detail
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 bg-transparent border-none cursor-pointer transition-colors rounded-md hover:bg-[var(--notion-bg-tertiary)]"
                                style={{ color: "var(--notion-text-muted)" }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto">
                            {!task ? (
                                <div className="p-6 flex flex-col gap-4">
                                    {[1, 2, 3].map(i => <div key={i} className="skeleton h-8 w-full rounded-md" />)}
                                </div>
                            ) : (
                                <div className="p-6 flex flex-col gap-6">

                                    {/* Title — click to edit */}
                                    {editingField === "title" ? (
                                        <input
                                            autoFocus
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onBlur={() => handleFieldUpdate("title", editTitle)}
                                            onKeyDown={(e) => { if (e.key === "Enter") handleFieldUpdate("title", editTitle); if (e.key === "Escape") setEditingField(null); }}
                                            className="text-xl font-semibold w-full bg-transparent border-none outline-none"
                                            style={{ color: "var(--notion-text)", padding: "4px 0", borderBottom: "2px solid var(--brand-blue)" }}
                                        />
                                    ) : (
                                        <h2
                                            onClick={() => { setEditingField("title"); setEditTitle(task.title); }}
                                            className="text-xl font-semibold cursor-pointer transition-colors hover:text-[var(--brand-blue)] group flex items-center gap-2"
                                            style={{ color: "var(--notion-text)" }}
                                        >
                                            {task.title}
                                            <Edit3 size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                                        </h2>
                                    )}

                                    {/* Status Switcher */}
                                    <div>
                                        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--notion-text-muted)" }}>
                                            Status
                                        </span>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {statuses.map((s) => {
                                                const isActive = task.status === s;
                                                return (
                                                    <button
                                                        key={s}
                                                        onClick={() => handleStatusChange(s)}
                                                        className="transition-all"
                                                        style={{
                                                            padding: "5px 10px",
                                                            background: isActive ? "var(--notion-bg-tertiary)" : "transparent",
                                                            border: isActive ? "1px solid var(--brand-blue)" : "1px solid var(--notion-border)",
                                                            color: isActive ? "var(--notion-text)" : "var(--notion-text-secondary)",
                                                            borderRadius: "var(--radius-md)",
                                                            fontSize: "11px",
                                                            fontWeight: isActive ? 600 : 400,
                                                            letterSpacing: "0.04em",
                                                            textTransform: "uppercase" as const,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        {s.replace("_", " ")}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Metadata Grid */}
                                    <div
                                        className="grid grid-cols-2 gap-4 p-4 rounded-lg"
                                        style={{ background: "var(--notion-bg-secondary)", border: "1px solid var(--notion-border)" }}
                                    >
                                        {/* Priority */}
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--notion-text-muted)" }}>Priority</span>
                                            <Badge
                                                variant={task.priority === "URGENT" ? "error" : task.priority === "HIGH" ? "warning" : "default"}
                                                size="sm"
                                                className="w-fit"
                                            >
                                                {task.priority}
                                            </Badge>
                                        </div>

                                        {/* Assignee */}
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--notion-text-muted)" }}>Assignee</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold" style={{ background: "var(--notion-bg-tertiary)", color: "var(--notion-text-secondary)", border: "1px solid var(--notion-border)" }}>
                                                    {task.assignee ? task.assignee.firstName[0] : <User size={10} />}
                                                </div>
                                                <span className="text-[12px]" style={{ color: "var(--notion-text)" }}>
                                                    {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : "Unassigned"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Due Date */}
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--notion-text-muted)" }}>Due Date</span>
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={12} style={{ color: "var(--notion-text-muted)" }} />
                                                <span className="text-[12px]" style={{ color: "var(--notion-text)" }}>
                                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "No date"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Creator */}
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--notion-text-muted)" }}>Created by</span>
                                            <span className="text-[12px]" style={{ color: "var(--notion-text-secondary)" }}>
                                                {task.creator.firstName} {task.creator.lastName}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--notion-text-muted)" }}>
                                            Description
                                        </span>
                                        {editingField === "description" ? (
                                            <textarea
                                                autoFocus
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                onBlur={() => handleFieldUpdate("description", editDescription)}
                                                rows={4}
                                                style={{
                                                    width: "100%",
                                                    background: "var(--notion-bg-secondary)",
                                                    border: "1px solid var(--brand-blue)",
                                                    color: "var(--notion-text)",
                                                    padding: "10px 12px",
                                                    borderRadius: "var(--radius-md)",
                                                    resize: "vertical",
                                                    fontSize: "13px",
                                                    lineHeight: "1.6",
                                                    fontFamily: "var(--font-body)",
                                                    outline: "none",
                                                }}
                                            />
                                        ) : (
                                            <div
                                                onClick={() => { setEditingField("description"); setEditDescription(task.description || ""); }}
                                                className="cursor-pointer transition-all hover:bg-[var(--notion-bg-tertiary)] rounded-lg p-3"
                                                style={{
                                                    background: "var(--notion-bg-secondary)",
                                                    border: "1px solid var(--notion-border)",
                                                    minHeight: "60px",
                                                    fontSize: "13px",
                                                    lineHeight: "1.6",
                                                    color: task.description ? "var(--notion-text)" : "var(--notion-text-muted)",
                                                }}
                                            >
                                                {task.description || "Click to add a description..."}
                                            </div>
                                        )}
                                    </div>

                                    {/* Attachments Section (Placeholder for Phase 2) */}
                                    {task.attachments && task.attachments.length > 0 && (
                                        <div>
                                            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--notion-text-muted)" }}>
                                                Attachments
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {task.attachments.map((url, i) => (
                                                    <a
                                                        key={i}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-colors hover:bg-[var(--notion-bg-tertiary)]"
                                                        style={{ background: "var(--notion-bg-secondary)", border: "1px solid var(--notion-border)", color: "var(--notion-text-secondary)", textDecoration: "none" }}
                                                    >
                                                        <Paperclip size={11} />
                                                        File {i + 1}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Comments Section */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <MessageSquare size={13} style={{ color: "var(--brand-blue)" }} />
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--notion-text-muted)" }}>
                                                Comments
                                            </span>
                                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: "var(--brand-blue)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--notion-border)" }}>
                                                {comments.length}
                                            </span>
                                        </div>

                                        {/* Comment list */}
                                        <div className="flex flex-col gap-3 mb-4">
                                            {comments.length === 0 && (
                                                <div className="flex flex-col items-center justify-center py-8 gap-2" style={{ color: "var(--notion-text-muted)" }}>
                                                    <MessageSquare size={16} strokeWidth={1} />
                                                    <span className="text-[10px] tracking-widest uppercase">No comments yet</span>
                                                </div>
                                            )}
                                            {comments.map((comment) => (
                                                <div
                                                    key={comment.id}
                                                    className="flex gap-3 p-3 rounded-lg transition-colors hover:bg-[var(--notion-bg-tertiary)]"
                                                    style={{ background: "var(--notion-bg-secondary)", border: "1px solid var(--notion-border)" }}
                                                >
                                                    {/* Avatar */}
                                                    <div
                                                        className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                                                        style={{ background: "var(--notion-bg-tertiary)", color: "var(--brand-blue)", border: "1px solid var(--notion-border)" }}
                                                    >
                                                        {comment.user.firstName[0]}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[12px] font-semibold" style={{ color: "var(--notion-text)" }}>
                                                                {comment.user.firstName} {comment.user.lastName}
                                                            </span>
                                                            <span className="text-[9px] font-mono" style={{ color: "var(--notion-text-muted)" }}>
                                                                {timeAgo(comment.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="text-[13px] leading-relaxed m-0" style={{ color: "var(--notion-text-secondary)", wordBreak: "break-word" }}>
                                                            {comment.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={commentsEndRef} />
                                        </div>

                                        {/* Comment input */}
                                        <div
                                            className="flex items-end gap-2 p-2 rounded-lg"
                                            style={{ background: "var(--notion-bg-secondary)", border: "1px solid var(--notion-border)" }}
                                        >
                                            <textarea
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
                                                placeholder="Write a comment... (Shift+Enter for new line)"
                                                rows={1}
                                                className="flex-1 bg-transparent border-none outline-none resize-none"
                                                style={{
                                                    color: "var(--notion-text)",
                                                    fontSize: "13px",
                                                    lineHeight: "1.5",
                                                    fontFamily: "var(--font-body)",
                                                    padding: "6px 8px",
                                                    minHeight: "36px",
                                                    maxHeight: "120px",
                                                }}
                                            />
                                            <button
                                                onClick={handleSendComment}
                                                disabled={!newComment.trim() || sendingComment}
                                                className="p-2 rounded-md border-none cursor-pointer transition-all shrink-0 disabled:opacity-30"
                                                style={{
                                                    background: newComment.trim() ? "var(--brand-blue)" : "var(--notion-bg-tertiary)",
                                                    color: newComment.trim() ? "#fff" : "var(--notion-text-muted)",
                                                }}
                                            >
                                                <Send size={14} />
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div
                            className="px-6 py-3 flex items-center justify-between shrink-0"
                            style={{ borderTop: "1px solid var(--notion-border)", background: "var(--notion-bg-secondary)" }}
                        >
                            <span className="text-[9px] font-mono tracking-wide" style={{ color: "var(--notion-text-muted)" }}>
                                {task ? `Updated ${timeAgo(task.updatedAt)}` : ""}
                            </span>
                            <span className="text-[9px] font-mono tracking-wide" style={{ color: "var(--notion-text-muted)" }}>
                                ESC to close
                            </span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
