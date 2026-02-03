"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import { CalendarDays, Filter, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Dropdown from "@/components/ui/Dropdown";
import { useToast } from "@/components/ui/Toast";

type CalendarEvent = {
    id: string;
    sourceId?: string;
    type: "task" | "leave" | "invoice";
    title: string;
    date: string;
    endDate?: string;
    startDate?: string;
    spanDays?: number;
    meta?: string;
    href?: string;
    isUndated?: boolean;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toDateKey = (d: Date) => d.toISOString().slice(0, 10);
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const addDays = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function CalendarPage() {
    const { data, error, mutate } = useSWR<{ events: CalendarEvent[] }>("/api/calendar", fetcher);
    const [range, setRange] = useState<"30" | "90" | "all">("30");
    const [viewDate, setViewDate] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [typeFilter, setTypeFilter] = useState<"all" | "task" | "leave" | "invoice">("all");
    const [query, setQuery] = useState("");
    const [viewMode, setViewMode] = useState<"month" | "week" | "agenda">("month");
    const [dragOverKey, setDragOverKey] = useState<string | null>(null);
    const [quickOpen, setQuickOpen] = useState(false);
    const [quickType, setQuickType] = useState<"task" | "leave" | "invoice">("task");
    const [quickSaving, setQuickSaving] = useState(false);

    const { success, error: showError } = useToast();

    const [taskForm, setTaskForm] = useState({
        title: "",
        priority: "MEDIUM",
        dueDate: "",
    });
    const [leaveForm, setLeaveForm] = useState({
        type: "ANNUAL",
        startDate: "",
        endDate: "",
        reason: "",
    });
    const [invoiceForm, setInvoiceForm] = useState({
        clientName: "",
        amount: "",
        dueDate: "",
        description: "Services",
    });

    const events = data?.events || [];
    const now = new Date();

    const filtered = useMemo(() => {
        let list = events;
        if (typeFilter !== "all") {
            list = list.filter(e => e.type === typeFilter);
        }
        if (query.trim()) {
            const q = query.toLowerCase();
            list = list.filter(e =>
                e.title.toLowerCase().includes(q) ||
                (e.meta || "").toLowerCase().includes(q)
            );
        }
        if (range === "all") return list;
        const days = range === "30" ? 30 : 90;
        const end = new Date(now);
        end.setDate(end.getDate() + days);
        return list.filter(e => {
            if (e.isUndated) return true;
            const d = new Date(e.date);
            return d >= new Date(now.toDateString()) && d <= end;
        });
    }, [events, range, typeFilter, now, query]);

    const undated = useMemo(() => filtered.filter(e => e.isUndated), [filtered]);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        for (const e of filtered.filter(e => !e.isUndated)) {
            const key = toDateKey(new Date(e.date));
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(e);
        }
        return map;
    }, [filtered]);

    const grouped = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        for (const e of filtered.filter(e => !e.isUndated)) {
            const key = new Date(e.date).toDateString();
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(e);
        }
        return Array.from(map.entries()).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
    }, [filtered]);

    const typeBadge: Record<CalendarEvent["type"], "default" | "info" | "warning" | "success" | "error"> = {
        task: "info",
        leave: "warning",
        invoice: "success",
    };

    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const gridStart = addDays(monthStart, -monthStart.getDay());
    const gridEnd = addDays(monthEnd, 6 - monthEnd.getDay());

    const calendarDays: Date[] = [];
    for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
        calendarDays.push(d);
    }

    const selectedKey = toDateKey(selectedDate);
    const selectedEvents = eventsByDate.get(selectedKey) || [];

    const weekStart = addDays(selectedDate, -selectedDate.getDay());
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

    const openQuickAdd = (type: "task" | "leave" | "invoice") => {
        const selected = selectedDate.toISOString().slice(0, 10);
        if (type === "task") {
            setTaskForm({ title: "", priority: "MEDIUM", dueDate: selected });
        }
        if (type === "leave") {
            setLeaveForm({ type: "ANNUAL", startDate: selected, endDate: selected, reason: "" });
        }
        if (type === "invoice") {
            setInvoiceForm({ clientName: "", amount: "", dueDate: selected, description: "Services" });
        }
        setQuickType(type);
        setQuickOpen(true);
    };

    const handleQuickSave = useCallback(async () => {
        setQuickSaving(true);
        try {
            if (quickType === "task") {
                if (!taskForm.title.trim()) {
                    showError("Task title is required");
                    return;
                }
                const res = await fetch("/api/tasks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: taskForm.title,
                        priority: taskForm.priority,
                        dueDate: taskForm.dueDate || null,
                    })
                });
                if (!res.ok) throw new Error("Failed to create task");
                success("Task created");
            }
            if (quickType === "leave") {
                if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason.trim()) {
                    showError("All leave fields are required");
                    return;
                }
                const res = await fetch("/api/leaves", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: leaveForm.type,
                        startDate: leaveForm.startDate,
                        endDate: leaveForm.endDate,
                        reason: leaveForm.reason,
                    })
                });
                if (!res.ok) throw new Error("Failed to create leave");
                success("Leave created");
            }
            if (quickType === "invoice") {
                const amount = Number(invoiceForm.amount);
                if (!invoiceForm.clientName.trim() || !amount || Number.isNaN(amount)) {
                    showError("Client name and amount are required");
                    return;
                }
                const res = await fetch("/api/invoices", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        clientName: invoiceForm.clientName,
                        items: [{ description: invoiceForm.description || "Services", quantity: 1, unitPrice: amount }],
                        dueDate: invoiceForm.dueDate || null,
                    })
                });
                if (!res.ok) throw new Error("Failed to create invoice");
                success("Invoice created");
            }
            await mutate();
            setQuickOpen(false);
        } catch (err) {
            showError("Quick add failed");
        } finally {
            setQuickSaving(false);
        }
    }, [quickType, taskForm, leaveForm, invoiceForm, mutate, success, showError]);
    const counts = useMemo(() => {
        const taskIds = new Set<string>();
        const leaveIds = new Set<string>();
        const invoiceIds = new Set<string>();
        for (const e of events) {
            if (e.type === "task") taskIds.add(e.sourceId || e.id);
            if (e.type === "leave") leaveIds.add(e.sourceId || e.id);
            if (e.type === "invoice") invoiceIds.add(e.sourceId || e.id);
        }
        return {
            task: taskIds.size,
            leave: leaveIds.size,
            invoice: invoiceIds.size,
        };
    }, [events]);

    const handleDragStart = useCallback((e: React.DragEvent, item: CalendarEvent) => {
        const payload = JSON.stringify({
            type: item.type,
            sourceId: item.sourceId,
            spanDays: item.spanDays || 1,
        });
        e.dataTransfer.setData("text/plain", payload);
        e.dataTransfer.effectAllowed = "move";
    }, []);

    const updateEventDate = useCallback(async (payload: { type: CalendarEvent["type"]; sourceId?: string; spanDays?: number }, date: Date) => {
        if (!payload.sourceId) return false;
        const dateStr = date.toISOString().slice(0, 10);
        try {
            if (payload.type === "task") {
                const res = await fetch(`/api/tasks/${payload.sourceId}/due-date`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ dueDate: dateStr })
                });
                if (!res.ok) throw new Error("Failed to update task date");
            } else if (payload.type === "invoice") {
                const res = await fetch(`/api/invoices/${payload.sourceId}/due-date`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ dueDate: dateStr })
                });
                if (!res.ok) throw new Error("Failed to update invoice date");
            } else if (payload.type === "leave") {
                const span = Math.max(1, payload.spanDays || 1);
                const end = addDays(date, span - 1);
                const res = await fetch(`/api/leaves/${payload.sourceId}/dates`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        startDate: date.toISOString().slice(0, 10),
                        endDate: end.toISOString().slice(0, 10)
                    })
                });
                if (!res.ok) throw new Error("Failed to update leave dates");
            }
            await mutate();
            success("Date updated");
            return true;
        } catch (err) {
            showError("Failed to update date");
            return false;
        }
    }, [mutate, success, showError]);

    const handleDrop = useCallback(async (e: React.DragEvent, date: Date) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverKey(null);
        try {
            const raw = e.dataTransfer.getData("text/plain");
            const payload = JSON.parse(raw);
            await updateEventDate(payload, date);
            setSelectedDate(date);
        } catch {
            // ignore
        }
    }, [updateEventDate]);

    return (
        <PageContainer
            title="Work Calendar"
            icon="🗓️"
            action={
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: "4px", border: "1px solid var(--notion-border)", background: "var(--notion-bg-secondary)", borderRadius: "8px", padding: "2px" }}>
                        {(["month", "week", "agenda"] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setViewMode(v)}
                                style={{
                                    border: "none",
                                    background: viewMode === v ? "var(--notion-bg-tertiary)" : "transparent",
                                    color: "var(--notion-text)",
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    textTransform: "capitalize"
                                }}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            border: "1px solid var(--notion-border)",
                            background: "var(--notion-bg-secondary)",
                            padding: "4px",
                            borderRadius: "8px",
                        }}
                    >
                        <Filter size={14} />
                        <button
                            onClick={() => setRange("30")}
                            style={{
                                border: "none",
                                background: range === "30" ? "var(--notion-bg-tertiary)" : "transparent",
                                color: "var(--notion-text)",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "12px",
                            }}
                        >
                            30 days
                        </button>
                        <button
                            onClick={() => setRange("90")}
                            style={{
                                border: "none",
                                background: range === "90" ? "var(--notion-bg-tertiary)" : "transparent",
                                color: "var(--notion-text)",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "12px",
                            }}
                        >
                            90 days
                        </button>
                        <button
                            onClick={() => setRange("all")}
                            style={{
                                border: "none",
                                background: range === "all" ? "var(--notion-bg-tertiary)" : "transparent",
                                color: "var(--notion-text)",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "12px",
                            }}
                        >
                            All
                        </button>
                    </div>
                    <Button
                        size="sm"
                        icon={<Plus size={14} />}
                        onClick={() => openQuickAdd("task")}
                    >
                        Quick Add
                    </Button>
                </div>
            }
        >
            <Breadcrumb />

            <div className="calendar-layout" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
                <Card padding="md" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                        style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            background: "var(--notion-bg-tertiary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <CalendarDays size={18} />
                    </div>
                    <div>
                        <div style={{ fontSize: "14px", fontWeight: 600 }}>Unified timeline</div>
                        <div style={{ fontSize: "12px", color: "var(--notion-text-muted)" }}>
                            Tasks, leave, and invoice due dates in one place.
                        </div>
                    </div>
                </Card>

                {error && (
                    <Card padding="md">
                        <div style={{ color: "var(--notion-red)" }}>Failed to load calendar.</div>
                    </Card>
                )}

                <Card padding="md" className="calendar-main" style={{ border: "1px solid var(--notion-border)", background: "var(--notion-bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            <div style={{ fontSize: "11px", color: "var(--notion-text-muted)", padding: "4px 8px", border: "1px solid var(--notion-border)", borderRadius: "999px" }}>
                                Tasks: <strong style={{ color: "var(--notion-text)" }}>{counts.task}</strong>
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--notion-text-muted)", padding: "4px 8px", border: "1px solid var(--notion-border)", borderRadius: "999px" }}>
                                Leaves: <strong style={{ color: "var(--notion-text)" }}>{counts.leave}</strong>
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--notion-text-muted)", padding: "4px 8px", border: "1px solid var(--notion-border)", borderRadius: "999px" }}>
                                Invoices: <strong style={{ color: "var(--notion-text)" }}>{counts.invoice}</strong>
                            </div>
                        </div>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search events..."
                            style={{
                                border: "1px solid var(--notion-border)",
                                background: "var(--notion-bg-secondary)",
                                color: "var(--notion-text)",
                                padding: "6px 10px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                minWidth: "220px",
                                outline: "none",
                            }}
                        />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button
                                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                                className="hover-bg"
                                style={{ border: "none", background: "transparent", padding: "4px", borderRadius: "6px", cursor: "pointer" }}
                                title="Previous month"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div style={{ fontSize: "15px", fontWeight: 600 }}>
                                {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                            </div>
                            <button
                                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                                className="hover-bg"
                                style={{ border: "none", background: "transparent", padding: "4px", borderRadius: "6px", cursor: "pointer" }}
                                title="Next month"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ display: "flex", gap: "4px", border: "1px solid var(--notion-border)", background: "var(--notion-bg-secondary)", borderRadius: "8px", padding: "2px" }}>
                                {(["all", "task", "leave", "invoice"] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTypeFilter(t)}
                                        style={{
                                            border: "none",
                                            background: typeFilter === t ? "var(--notion-bg-tertiary)" : "transparent",
                                            color: "var(--notion-text)",
                                            padding: "4px 8px",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontSize: "11px",
                                            textTransform: "capitalize"
                                        }}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    const today = new Date();
                                    setViewDate(today);
                                    setSelectedDate(today);
                                }}
                                style={{
                                    border: "1px solid var(--notion-border)",
                                    background: "var(--notion-bg-secondary)",
                                    color: "var(--notion-text)",
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                }}
                            >
                                Today
                            </button>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", color: "var(--notion-text-muted)" }}>Legend:</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--notion-text-muted)" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "var(--notion-blue)" }} />
                            Task
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--notion-text-muted)" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "var(--notion-yellow)" }} />
                            Leave
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--notion-text-muted)" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "var(--notion-green)" }} />
                            Invoice
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--notion-text-muted)" }}>
                            Drag items to reschedule
                        </span>
                    </div>

                    {viewMode === "month" && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
                            {weekdayNames.map((d) => (
                                <div key={d} style={{ textAlign: "center", fontSize: "11px", color: "var(--notion-text-muted)", fontWeight: 600 }}>
                                    {d}
                                </div>
                            ))}
                            {calendarDays.map((d) => {
                                const key = toDateKey(d);
                                const dayEvents = eventsByDate.get(key) || [];
                                const isCurrentMonth = d.getMonth() === viewDate.getMonth();
                                const isSelected = sameDay(d, selectedDate);
                                const isToday = sameDay(d, now);
                                const isDragOver = dragOverKey === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedDate(d)}
                                        onDragOver={(e) => { e.preventDefault(); setDragOverKey(key); }}
                                        onDragEnter={() => setDragOverKey(key)}
                                        onDragLeave={() => setDragOverKey(null)}
                                        onDrop={(e) => handleDrop(e, d)}
                                        style={{
                                            border: isSelected ? "1px solid var(--notion-blue)" : "1px solid var(--notion-border)",
                                            background: isSelected || isDragOver ? "var(--notion-bg-tertiary)" : "var(--notion-bg-secondary)",
                                            color: isCurrentMonth ? "var(--notion-text)" : "var(--notion-text-muted)",
                                            borderRadius: "10px",
                                            padding: "8px",
                                            minHeight: "72px",
                                            textAlign: "left",
                                            cursor: "pointer",
                                            position: "relative",
                                            outline: "none",
                                        }}
                                        className="hover-bg"
                                    >
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <span style={{ fontSize: "12px", fontWeight: 600 }}>{d.getDate()}</span>
                                            {isToday && (
                                                <span style={{
                                                    fontSize: "9px",
                                                    background: "var(--notion-red)",
                                                    color: "white",
                                                    padding: "2px 4px",
                                                    borderRadius: "6px"
                                                }}>
                                                    TODAY
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "6px" }}>
                                            {dayEvents.slice(0, 3).map((e) => (
                                                <span
                                                    key={e.id}
                                                    style={{
                                                        width: "8px",
                                                        height: "8px",
                                                        borderRadius: "999px",
                                                        background:
                                                            e.type === "task" ? "var(--notion-blue)" :
                                                                e.type === "leave" ? "var(--notion-yellow)" :
                                                                    "var(--notion-green)",
                                                    }}
                                                    title={`${e.type.toUpperCase()}: ${e.title}`}
                                                />
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <span style={{ fontSize: "10px", color: "var(--notion-text-muted)" }}>+{dayEvents.length - 3}</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {viewMode === "week" && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
                            {weekDays.map((d) => {
                                const key = toDateKey(d);
                                const dayEvents = eventsByDate.get(key) || [];
                                const isToday = sameDay(d, now);
                                const isDragOver = dragOverKey === key;
                                return (
                                    <div
                                        key={key}
                                        onDragOver={(e) => { e.preventDefault(); setDragOverKey(key); }}
                                        onDragEnter={() => setDragOverKey(key)}
                                        onDragLeave={() => setDragOverKey(null)}
                                        onDrop={(e) => handleDrop(e, d)}
                                        style={{
                                            border: "1px solid var(--notion-border)",
                                            background: isDragOver ? "var(--notion-bg-tertiary)" : "var(--notion-bg-secondary)",
                                            borderRadius: "10px",
                                            padding: "8px",
                                            minHeight: "140px",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                                            <span style={{ fontSize: "12px", fontWeight: 600 }}>{weekdayNames[d.getDay()]} {d.getDate()}</span>
                                            {isToday && (
                                                <span style={{ fontSize: "9px", background: "var(--notion-red)", color: "white", padding: "2px 4px", borderRadius: "6px" }}>
                                                    TODAY
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            {dayEvents.length === 0 && (
                                                <div style={{ fontSize: "11px", color: "var(--notion-text-muted)" }}>No items</div>
                                            )}
                                            {dayEvents.map((e) => (
                                                <div
                                                    key={e.id}
                                                    draggable
                                                    onDragStart={(ev) => handleDragStart(ev, e)}
                                                    onClick={() => setSelectedDate(d)}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        padding: "6px 8px",
                                                        borderRadius: "8px",
                                                        border: "1px solid var(--notion-border)",
                                                        background: "var(--notion-bg)",
                                                        fontSize: "11px",
                                                        cursor: "grab",
                                                    }}
                                                >
                                                    <span style={{
                                                        width: "6px",
                                                        height: "6px",
                                                        borderRadius: "999px",
                                                        background:
                                                            e.type === "task" ? "var(--notion-blue)" :
                                                                e.type === "leave" ? "var(--notion-yellow)" :
                                                                    "var(--notion-green)",
                                                    }} />
                                                    <span style={{ color: "var(--notion-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {e.title}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {viewMode === "agenda" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {grouped.length === 0 ? (
                                <div style={{ color: "var(--notion-text-muted)" }}>No upcoming items in this range.</div>
                            ) : (
                                grouped.map(([day, items]) => (
                                    <div key={day} style={{ border: "1px solid var(--notion-border)", borderRadius: "10px", padding: "10px", background: "var(--notion-bg-secondary)" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                            <div style={{ fontSize: "12px", fontWeight: 600 }}>{day}</div>
                                            <div style={{ fontSize: "11px", color: "var(--notion-text-muted)" }}>{items.length} item{items.length === 1 ? "" : "s"}</div>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            {items.map((e) => (
                                                <div
                                                    key={e.id}
                                                    draggable
                                                    onDragStart={(ev) => handleDragStart(ev, e)}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "10px",
                                                        padding: "8px 10px",
                                                        background: "var(--notion-bg)",
                                                        borderRadius: "8px",
                                                        border: "1px solid var(--notion-border)",
                                                    }}
                                                >
                                                    <Badge size="sm" variant={typeBadge[e.type]}>
                                                        {e.type.toUpperCase()}
                                                    </Badge>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: "13px", fontWeight: 500 }}>{e.title}</div>
                                                        <div style={{ fontSize: "11px", color: "var(--notion-text-muted)" }}>{e.meta || "—"}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </Card>

                <Card padding="md" className="calendar-side" style={{ border: "1px solid var(--notion-border)", background: "var(--notion-bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 600 }}>
                            {selectedDate.toDateString()}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--notion-text-muted)" }}>
                            {selectedEvents.length} item{selectedEvents.length === 1 ? "" : "s"}
                        </div>
                    </div>

                    {selectedEvents.length === 0 ? (
                        <div style={{ color: "var(--notion-text-muted)", fontSize: "12px" }}>No items for this day.</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {selectedEvents.map((e) => (
                                <div
                                    key={e.id}
                                    draggable
                                    onDragStart={(ev) => handleDragStart(ev, e)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        padding: "8px 10px",
                                        background: "var(--notion-bg-secondary)",
                                        borderRadius: "8px",
                                        border: "1px solid var(--notion-border)",
                                        cursor: "grab",
                                    }}
                                >
                                    <Badge size="sm" variant={typeBadge[e.type]}>
                                        {e.type.toUpperCase()}
                                    </Badge>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: "13px", fontWeight: 500 }}>{e.title}</div>
                                        <div style={{ fontSize: "11px", color: "var(--notion-text-muted)" }}>
                                            {e.meta || "—"}
                                            {e.endDate ? ` • Ends ${new Date(e.endDate).toLocaleDateString()}` : ""}
                                        </div>
                                    </div>
                                    {e.href && (
                                        <Link href={e.href} style={{ color: "var(--notion-text-muted)", fontSize: "11px" }} title="Open">
                                            Open
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {viewMode !== "agenda" && grouped.length === 0 && !error && (
                    <Card padding="md" className="calendar-side">
                        <div style={{ color: "var(--notion-text-muted)" }}>No upcoming items in this range.</div>
                    </Card>
                )}

                {undated.length > 0 && (
                    <Card padding="md" className="calendar-side">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                            <div style={{ fontSize: "13px", fontWeight: 600 }}>Undated items</div>
                            <div style={{ fontSize: "11px", color: "var(--notion-text-muted)" }}>
                                {undated.length} item{undated.length === 1 ? "" : "s"}
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {undated.map((e) => (
                                <div
                                    key={e.id}
                                    draggable
                                    onDragStart={(ev) => handleDragStart(ev, e)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        padding: "8px 10px",
                                        background: "var(--notion-bg-secondary)",
                                        borderRadius: "8px",
                                        border: "1px solid var(--notion-border)",
                                        cursor: "grab",
                                    }}
                                >
                                    <Badge size="sm" variant={typeBadge[e.type]}>
                                        {e.type.toUpperCase()}
                                    </Badge>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: "13px", fontWeight: 500 }}>{e.title}</div>
                                        <div style={{ fontSize: "11px", color: "var(--notion-text-muted)" }}>
                                            {e.meta || "—"}
                                        </div>
                                    </div>
                                    {e.href && (
                                        <Link href={e.href} style={{ color: "var(--notion-text-muted)", fontSize: "11px" }} title="Open">
                                            Open
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
            <style jsx>{`
                .calendar-layout {
                    grid-template-columns: minmax(0, 1fr);
                }
                @media (min-width: 1100px) {
                    .calendar-layout {
                        grid-template-columns: minmax(0, 1fr) 360px;
                        align-items: start;
                    }
                    .calendar-main {
                        grid-column: 1 / 2;
                    }
                    .calendar-side {
                        grid-column: 2 / 3;
                    }
                }
            `}</style>
            <Modal
                isOpen={quickOpen}
                onClose={() => setQuickOpen(false)}
                title="Quick Add"
                size="md"
            >
                <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
                    {(["task", "leave", "invoice"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setQuickType(t)}
                            style={{
                                border: "1px solid var(--notion-border)",
                                background: quickType === t ? "var(--notion-bg-tertiary)" : "var(--notion-bg-secondary)",
                                color: "var(--notion-text)",
                                padding: "6px 10px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "12px",
                                textTransform: "capitalize"
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {quickType === "task" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <Input
                            label="Title"
                            value={taskForm.title}
                            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                            placeholder="Task title"
                        />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <div>
                                <label style={{ fontSize: "12px", color: "var(--notion-text-secondary)", display: "block", marginBottom: "4px" }}>Priority</label>
                                <Dropdown
                                    options={[
                                        { value: "LOW", label: "Low" },
                                        { value: "MEDIUM", label: "Medium" },
                                        { value: "HIGH", label: "High" },
                                        { value: "URGENT", label: "Urgent" },
                                    ]}
                                    value={taskForm.priority}
                                    onChange={(value) => setTaskForm({ ...taskForm, priority: value })}
                                />
                            </div>
                            <Input
                                label="Due Date"
                                type="date"
                                value={taskForm.dueDate}
                                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {quickType === "leave" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div>
                            <label style={{ fontSize: "12px", color: "var(--notion-text-secondary)", display: "block", marginBottom: "4px" }}>Leave Type</label>
                            <Dropdown
                                options={[
                                    { value: "ANNUAL", label: "Annual" },
                                    { value: "SICK", label: "Sick" },
                                    { value: "PERSONAL", label: "Personal" },
                                    { value: "MATERNITY", label: "Maternity" },
                                    { value: "PATERNITY", label: "Paternity" },
                                    { value: "UNPAID", label: "Unpaid" },
                                ]}
                                value={leaveForm.type}
                                onChange={(value) => setLeaveForm({ ...leaveForm, type: value })}
                            />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <Input
                                label="Start Date"
                                type="date"
                                value={leaveForm.startDate}
                                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                            />
                            <Input
                                label="End Date"
                                type="date"
                                value={leaveForm.endDate}
                                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                            />
                        </div>
                        <Input
                            label="Reason"
                            value={leaveForm.reason}
                            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                            placeholder="Reason for leave"
                        />
                    </div>
                )}

                {quickType === "invoice" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <Input
                            label="Client Name"
                            value={invoiceForm.clientName}
                            onChange={(e) => setInvoiceForm({ ...invoiceForm, clientName: e.target.value })}
                            placeholder="Client"
                        />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <Input
                                label="Amount"
                                type="number"
                                value={invoiceForm.amount}
                                onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                                placeholder="0"
                            />
                            <Input
                                label="Due Date"
                                type="date"
                                value={invoiceForm.dueDate}
                                onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                            />
                        </div>
                        <Input
                            label="Description"
                            value={invoiceForm.description}
                            onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                            placeholder="Services"
                        />
                    </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
                    <Button variant="ghost" onClick={() => setQuickOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleQuickSave} disabled={quickSaving}>
                        {quickSaving ? "Saving..." : "Create"}
                    </Button>
                </div>
            </Modal>
        </PageContainer>
    );
}
