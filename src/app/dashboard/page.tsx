"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  MessageSquare,
  ArrowRight,
  Shield,
  Plus,
  GripVertical,
  LayoutDashboard,
  Zap,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/layout/Breadcrumb";
import Button from "@/components/ui/Button";
import GlobalActionMenu from "@/components/layout/GlobalActionMenu";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { TaskHoverPreview } from "@/components/ui/HoverPreview";
import AIInsights from "@/components/ui/AIInsights";
import { BadgeCollection, BadgeType } from "@/components/ui/UserBadge";
import WidgetPicker from "@/components/widgets/WidgetPicker";
import PomodoroWidget from "@/components/widgets/PomodoroWidget";
import QuickNotesWidget from "@/components/widgets/QuickNotesWidget";
import CalendarWidget from "@/components/widgets/CalendarWidget";

interface DashboardStats {
  activeTasks: number;
  unreadMessages: number;
  completedTasks: number;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
}

interface WidgetConfig {
  id: string;
  component: React.ComponentType;
  name: string;
  span?: number;
}

import RecentInvoicesWidget from "@/components/widgets/RecentInvoicesWidget";
import ClockWidget from "@/components/widgets/ClockWidget";
import QuoteWidget from "@/components/widgets/QuoteWidget";
import TodoWidget from "@/components/widgets/TodoWidget";

const WIDGET_CONFIGS: WidgetConfig[] = [
  { id: "pomodoro", component: PomodoroWidget, name: "Pomodoro" },
  { id: "notes", component: QuickNotesWidget, name: "Quick Notes" },
  { id: "calendar", component: CalendarWidget, name: "Calendar" },
  { id: "recent_invoices", component: RecentInvoicesWidget, name: "Recent Invoices" },
  { id: "clock", component: ClockWidget, name: "World Clock" },
  { id: "quote", component: QuoteWidget, name: "Daily Quote" },
  { id: "todos", component: TodoWidget, name: "Quick Tasks" },
];

const USER_BADGES: BadgeType[] = ["early_adopter", "task_master", "fast_responder"];

/* ─── Sortable widget card (dnd-kit) ─── */
function SortableWidgetCard({ id, widget }: { id: string; widget: WidgetConfig }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const spanClass = widget.span === 2 ? "md:col-span-2 xl:col-span-2" : "col-span-1";

  return (
    <div
      ref={setNodeRef}
      className={`relative min-h-[240px] ${spanClass}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition || "transform 220ms cubic-bezier(0.2, 0, 0, 1)",
        opacity: isDragging ? 0 : 1,
        zIndex: isDragging ? 0 : 1,
      }}
    >
      <div
        className="bg-[var(--notion-bg-secondary)] border border-[var(--notion-border)] overflow-hidden h-full rounded-[var(--radius-md)] relative"
        style={{ minHeight: "240px" }}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 z-20 opacity-0 hover:opacity-100 transition-opacity p-1.5 bg-[var(--notion-bg-tertiary)] rounded border border-[var(--notion-border)] cursor-grab active:cursor-grabbing"
          style={{ color: "var(--notion-text-muted)", display: "flex", alignItems: "center", touchAction: "none" }}
          title="Drag to reorder"
        >
          <GripVertical size={12} />
        </div>
        <widget.component />
      </div>
    </div>
  );
}

/* ─── Drag overlay ghost ─── */
function WidgetDragOverlay({ widget }: { widget: WidgetConfig | undefined }) {
  if (!widget) return null;
  return (
    <div
      className="relative min-h-[240px] col-span-1"
      style={{ transform: "rotate(1.5deg)", opacity: 0.92, cursor: "grabbing" }}
    >
      <div
        className="bg-[var(--notion-bg-secondary)] overflow-hidden rounded-[var(--radius-md)]"
        style={{ minHeight: "240px", border: "2px solid var(--brand-blue)", boxShadow: "0 20px 48px rgba(0,0,0,0.4)" }}
      >
        <widget.component />
      </div>
    </div>
  );
}

function priorityColor(p: string) {
  switch (p?.toUpperCase()) {
    case "HIGH":
    case "URGENT":
      return "var(--notion-red)";
    case "MEDIUM":
      return "var(--brand-blue)";
    default:
      return "var(--notion-text-muted)";
  }
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [widgetOrder, setWidgetOrder] = useState<string[]>(WIDGET_CONFIGS.map((w) => w.id));
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [widgetOrderReady, setWidgetOrderReady] = useState(false);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (over && active.id !== over.id) {
      setWidgetOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const [timeStr, setTimeStr] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('Welcome back');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      const hour = now.getHours();
      if (hour < 12) setGreeting('Good morning');
      else if (hour < 18) setGreeting('Good afternoon');
      else setGreeting('Good evening');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load widget order from DB on mount, fallback to localStorage
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/preferences/widgets");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.widgetOrder) && data.widgetOrder.length > 0) {
            const valid = data.widgetOrder.filter((id: string) => WIDGET_CONFIGS.some(w => w.id === id));
            const missing = WIDGET_CONFIGS.map(w => w.id).filter(id => !valid.includes(id));
            setWidgetOrder([...valid, ...missing]);
            setWidgetOrderReady(true);
            return;
          }
        }
      } catch { /* ignore */ }
      // Fallback to localStorage
      try {
        const saved = localStorage.getItem("kurly-widget-order-v2");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setWidgetOrder(parsed);
        }
      } catch { /* ignore */ }
      setWidgetOrderReady(true);
    };
    load();
  }, []);

  // Save widget order to DB whenever it changes (after initial load)
  useEffect(() => {
    if (!widgetOrderReady) return;
    fetch("/api/preferences/widgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widgetOrder }),
    }).catch(() => { /* silently fail */ });
  }, [widgetOrder, widgetOrderReady]);

  useEffect(() => {
    fetchDashboardData();
    fetchMyTasks();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setActivity((data.recentActivity || []).filter((i: ActivityItem) => ['task', 'message'].includes(i.type)));
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTasks = async () => { try { const res = await fetch('/api/tasks?limit=20'); if (res.ok) { const data = await res.json(); const pending = data.filter((t: any) => t.status !== 'COMPLETED' && t.status !== 'DONE'); setMyTasks(pending.slice(0, 5)); } } catch (error) { console.error('Failed to fetch tasks:', error); } };

  const orderedWidgets = widgetOrder
    .map((id) => WIDGET_CONFIGS.find((w) => w.id === id))
    .filter(Boolean) as WidgetConfig[];

  const dashboardItems = [
    { label: "Tasks", count: stats?.activeTasks, icon: CheckSquare, href: "/dashboard/tasks", color: "var(--notion-red)" },
    { label: "Messages", count: stats?.unreadMessages, icon: MessageSquare, href: "/dashboard/messages", color: "var(--notion-purple)" },
  ];

  const isAdmin = session?.user?.role === "ADMIN";

  const statusColors: Record<string, "default" | "info" | "warning" | "success" | "error"> = {
    TODO: "default",
    IN_PROGRESS: "info",
    REVIEW: "warning",
    COMPLETED: "success",
  };

  const statusLabel = (s: string) => s.replace(/_/g, " ");

  return (
    <PageContainer
      title="Dashboard"
      icon="📊"
      action={
        <div className="flex items-center gap-2">
          <GlobalActionMenu />
          <Button size="sm" variant="ghost" icon={<LayoutDashboard size={16} />} onClick={() => window.dispatchEvent(new Event("toggle-focus-mode"))} title="Toggle Zen Mode" />
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowWidgetPicker(true)}>Add Widget</Button>
        </div>
      }
    >
      <Breadcrumb />

      {/* 
          BENTO GRID
           */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6 mb-20 auto-rows-max">

        {/* --- ROW 1: Greeting & Main Stats --- */}
        <Card animated delay={0.1} padding="none" className="xl:col-span-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border)] flex flex-col justify-between relative group">
          <div className="p-8 h-full flex flex-col justify-between">
            <div className="absolute top-4 right-4 flex items-center gap-2 text-[var(--notion-text-muted)]">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-cyan)] animate-pulse" style={{ boxShadow: "0 0 10px var(--brand-cyan-glow)" }} />
              <span className="text-[10px] font-mono tracking-widest uppercase">{timeStr}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--notion-text-secondary)] mb-2 mt-4">
                {greeting}
              </p>
              <h1 className="text-4xl font-extralight tracking-tight text-[var(--notion-text)] mb-6">
                {session?.user?.name || "Commander"}
              </h1>
              <BadgeCollection badges={USER_BADGES} />
            </div>
          </div>
        </Card>

        {/* Tasks Stat Tile */}
        <Card animated delay={0.2} padding="none" hoverEffect className="group flex flex-col justify-between relative">
          <Link href="/dashboard/tasks" style={{ textDecoration: 'none' }} className="p-6 h-full flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--brand-blue)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-6">
              <CheckSquare size={16} className="text-[var(--brand-blue)]" />
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--notion-text-muted)]" />
            </div>
            <div>
              <div className="text-4xl font-extralight text-[var(--notion-text)] mb-2">{loading ? "-" : stats?.activeTasks || 0}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--notion-text-muted)] font-bold">Active Tasks</div>
            </div>
          </Link>
        </Card>

        {/* Messages Stat Tile */}
        <Card animated delay={0.3} padding="none" hoverEffect className="group flex flex-col justify-between relative">
          <Link href="/dashboard/messages" style={{ textDecoration: 'none' }} className="p-6 h-full flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--brand-cyan)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-6">
              <MessageSquare size={16} className="text-[var(--brand-cyan)]" />
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--notion-text-muted)]" />
            </div>
            <div>
              <div className="text-4xl font-extralight text-[var(--notion-text)] mb-2">{loading ? "-" : stats?.unreadMessages || 0}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--notion-text-muted)] font-bold">Unread Msgs</div>
            </div>
          </Link>
        </Card>

        {/* AI Insights Full Width Tile */}
        <div className="xl:col-span-4">
          <AIInsights />
        </div>

        {/* --- ROW 2: Widgets (Smooth dnd-kit drag-and-drop) --- */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={orderedWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
            {orderedWidgets.map((widget) => (
              <SortableWidgetCard key={widget.id} id={widget.id} widget={widget} />
            ))}
          </SortableContext>
          <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
            <WidgetDragOverlay widget={WIDGET_CONFIGS.find(w => w.id === activeDragId)} />
          </DragOverlay>
        </DndContext>

        {/* --- ROW 3: Operations --- */}
        <Card animated delay={0.6} padding="none" className="xl:col-span-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border)] flex flex-col h-[320px]">
          <div className="flex items-center justify-between p-5 border-b border-[var(--notion-border)] bg-[var(--notion-bg-secondary)] z-10">
            <div className="flex items-center gap-3">
              <Zap size={14} className="text-[var(--brand-blue)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--notion-text-secondary)]">Action Queue</span>
              {myTasks.length > 0 && <span className="text-[9px] font-mono text-[var(--brand-blue)] bg-[var(--brand-blue)]/10 px-1.5 py-0.5 rounded">{myTasks.length} pending</span>}
            </div>
            <Link href="/dashboard/tasks" style={{ textDecoration: 'none' }} className="group/link flex items-center gap-1">
              <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--notion-text-muted)] group-hover/link:text-[var(--brand-blue)] transition-colors">View All</span>
            </Link>
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            {myTasks.length > 0 ? (
              myTasks.map((task) => (
                <TaskHoverPreview
                  key={task.id}
                  task={{
                    title: task.title,
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : undefined,
                  }}
                >
                  <Link href="/dashboard/tasks" style={{ textDecoration: "none" }} className="block group/t">
                    <div
                      className="relative flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-md transition-all duration-200 hover:bg-[var(--notion-bg-tertiary)] border border-transparent hover:border-[var(--notion-border)]"
                    >
                      <div
                        className="w-1 h-3 rounded-full shrink-0"
                        style={{ background: priorityColor(task.priority) }}
                      />
                      <CheckSquare
                        size={14}
                        className="shrink-0 transition-colors group-hover/t:text-[var(--brand-blue)]"
                        style={{ color: "var(--notion-text-muted)" }}
                      />
                      <span
                        className="flex-1 text-[12px] font-medium tracking-wide truncate"
                        style={{ color: "var(--notion-text)" }}
                      >
                        {task.title}
                      </span>
                      <Badge
                        variant={statusColors[task.status] || "default"}
                        size="sm"
                        glow={task.status === 'IN_PROGRESS' || task.status === 'REVIEW'}
                        className="font-mono text-[9px] tracking-[0.1em] uppercase shrink-0 bg-transparent border border-[var(--notion-border)]"
                      >
                        {statusLabel(task.status)}
                      </Badge>
                    </div>
                  </Link>
                </TaskHoverPreview>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--notion-text-muted)]">
                <CheckSquare size={18} strokeWidth={1.5} />
                <span className="text-[10px] tracking-widest uppercase">No pending tasks</span>
              </div>
            )}
          </div>
        </Card>

        <Card animated delay={0.7} padding="none" className="xl:col-span-2 bg-[var(--notion-bg-secondary)] border border-[var(--notion-border)] flex flex-col h-[320px]">
          <div className="flex items-center justify-between p-5 border-b border-[var(--notion-border)] bg-[var(--notion-bg-secondary)] z-10">
            <div className="flex items-center gap-3">
              <Activity size={14} className="text-[var(--brand-cyan)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--notion-text-secondary)]">System Log</span>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            {loading ? (
              <div className="flex flex-col gap-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-10 w-full rounded-md opacity-20" />
                ))}
              </div>
            ) : activity.length > 0 ? (
              activity.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="group/l relative flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-md transition-all duration-200 hover:bg-[var(--notion-bg-tertiary)] border border-transparent hover:border-[var(--notion-border)]"
                >
                  <div className="w-6 h-6 flex items-center justify-center shrink-0 bg-[var(--notion-bg-tertiary)] border border-[var(--notion-border)] rounded-md">
                    {item.type === "task" ? (
                      <CheckSquare size={10} className="text-[var(--notion-text-muted)] group-hover/l:text-[var(--brand-cyan)] transition-colors" />
                    ) : (
                      <MessageSquare size={10} className="text-[var(--notion-text-muted)] group-hover/l:text-[var(--brand-cyan)] transition-colors" />
                    )}
                  </div>
                  <span className="flex-1 text-[12px] font-medium tracking-wide truncate text-[var(--notion-text)]">
                    {item.title}
                  </span>
                  <span className="text-[9px] font-mono tracking-widest uppercase text-[var(--notion-text-muted)] shrink-0">
                    {item.time}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--notion-text-muted)]">
                <Activity size={18} strokeWidth={1.5} />
                <span className="text-[10px] tracking-widest uppercase">No recent events</span>
              </div>
            )}
          </div>
        </Card>

        {/* Admin Link Tile */}
        {isAdmin && (
          <Card animated delay={0.8} padding="none" hoverEffect className="xl:col-span-4 group bg-[var(--notion-bg-secondary)] border border-[var(--notion-border)] hover:border-[var(--brand-cyan)] hover:bg-[var(--notion-bg-tertiary)] transition-all">
            <Link href="/dashboard/admin" style={{ textDecoration: 'none' }} className="block p-5">
              <div className="flex items-center justify-center gap-3 text-[var(--notion-text-muted)]">
                <Shield size={14} className="group-hover:text-[var(--brand-cyan)] transition-colors" />
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold group-hover:text-[var(--notion-text)] transition-colors">Access Admin Diagnostics (v5.0)</span>
              </div>
            </Link>
          </Card>
        )}
      </div>

      {/* Widget Picker Modal */}
      <WidgetPicker
        isOpen={showWidgetPicker}
        onClose={() => setShowWidgetPicker(false)}
        activeWidgets={widgetOrder}
        onAddWidget={(id) => {
          if (!widgetOrder.includes(id)) {
            setWidgetOrder([...widgetOrder, id]);
          }
        }}
        onRemoveWidget={(id) => {
          setWidgetOrder(widgetOrder.filter(w => w !== id));
        }}
      />
    </PageContainer>
  );
}

