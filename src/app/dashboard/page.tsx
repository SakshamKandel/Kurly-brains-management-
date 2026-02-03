"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  CheckSquare,
  MessageSquare,
  ArrowRight,
  Shield,
  Plus,
  GripVertical,
  LayoutDashboard
} from "lucide-react";
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

const STORAGE_KEY = "kurly-widget-order-v2";

const USER_BADGES: BadgeType[] = ["early_adopter", "task_master", "fast_responder"];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [widgetOrder, setWidgetOrder] = useState<string[]>(
    WIDGET_CONFIGS.map((w) => w.id)
  );
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  // Load widget order from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === WIDGET_CONFIGS.length) {
          setWidgetOrder(parsed);
        }
      } catch {
        // Use default
      }
    }
  }, []);

  // Save widget order to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgetOrder));
  }, [widgetOrder]);

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

  const fetchMyTasks = async () => {
    try {
      const res = await fetch("/api/tasks?limit=5");
      if (res.ok) {
        const data = await res.json();
        setMyTasks(data.slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  // Native drag handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== draggedId) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const newOrder = [...widgetOrder];
    const draggedIndex = newOrder.indexOf(draggedId);
    const targetIndex = newOrder.indexOf(targetId);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedId);

    setWidgetOrder(newOrder);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

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
      <AIInsights />

      {/* Greeting Block with Badges */}
      <div style={{ margin: "24px 0 40px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <p style={{ fontSize: "16px", color: "var(--notion-text)", margin: 0 }}>
            Welcome back, <strong>{session?.user?.name}</strong>
          </p>
          <BadgeCollection badges={USER_BADGES} />
        </div>
        <div style={{
          padding: "12px 16px",
          backgroundColor: "var(--notion-bg-secondary)",
          borderRadius: "var(--radius-sm)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderLeft: "3px solid var(--notion-text)"
        }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "600" }}>Quick Tip</div>
            <div style={{ fontSize: "13px", color: "var(--notion-text-secondary)" }}>
              Press <code style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "3px" }}>Ctrl + .</code> to ask Kurly AI anything!
            </div>
          </div>
        </div>
      </div>

      {/* Draggable Widgets - Native HTML5 */}
      <h3 style={{
        fontSize: "14px",
        fontWeight: "600",
        color: "var(--notion-text-secondary)",
        marginTop: "32px",
        marginBottom: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        My Widgets
        <span style={{
          fontSize: "11px",
          color: "var(--notion-text-muted)",
          fontWeight: 400,
          textTransform: "none",
          letterSpacing: "normal"
        }}>
          (drag ⋮⋮ to reorder)
        </span>
      </h3>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "16px",
        marginBottom: "32px"
      }}>
        {orderedWidgets.map((widget) => (
          <div
            key={widget.id}
            draggable
            onDragStart={(e) => handleDragStart(e, widget.id)}
            onDragOver={(e) => handleDragOver(e, widget.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, widget.id)}
            onDragEnd={handleDragEnd}
            style={{
              position: "relative",
              opacity: draggedId === widget.id ? 0.5 : 1,
              transform: dragOverId === widget.id ? "scale(1.02)" : "scale(1)",
              outline: dragOverId === widget.id ? "2px solid var(--notion-blue)" : "none",
              outlineOffset: "4px",
              borderRadius: "8px",
              transition: "transform 0.15s, opacity 0.15s, outline 0.15s",
            }}
          >
            {/* Drag Handle */}
            <div
              style={{
                position: "absolute",
                top: "8px",
                left: "8px",
                zIndex: 10,
                padding: "6px 4px",
                borderRadius: "4px",
                backgroundColor: "var(--notion-bg-tertiary)",
                cursor: "grab",
                display: "flex",
                alignItems: "center",
              }}
            >
              <GripVertical size={14} style={{ color: "var(--notion-text-muted)" }} />
            </div>
            <widget.component />
          </div>
        ))}
      </div>

      {/* Overview */}
      <h3 style={{
        fontSize: "14px",
        fontWeight: "600",
        color: "var(--notion-text-secondary)",
        marginTop: "32px",
        marginBottom: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.05em"
      }}>
        Overview
      </h3>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "12px"
      }}>
        {dashboardItems.map((item) => (
          <Link key={item.label} href={item.href} style={{ textDecoration: "none" }}>
            <Card hoverEffect padding="sm" style={{ height: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: item.color }}>
                <item.icon size={18} strokeWidth={2} />
                <span style={{ color: "var(--notion-text)", fontWeight: "500", fontSize: "14px" }}>
                  {item.label}
                </span>
              </div>
              {loading ? (
                <div className="skeleton" style={{ width: "40px", height: "16px" }} />
              ) : (
                <div style={{ fontSize: "13px", color: "var(--notion-text-secondary)" }}>
                  {item.count || 0} active
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {/* My Tasks */}
      <h3 style={{
        fontSize: "14px",
        fontWeight: "600",
        color: "var(--notion-text-secondary)",
        marginTop: "48px",
        marginBottom: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <span>My Tasks</span>
        <Link href="/dashboard/tasks" style={{ fontSize: "12px", color: "var(--notion-blue)", textDecoration: "none", textTransform: "none" }}>
          View all
        </Link>
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {myTasks.length > 0 ? myTasks.map((task) => (
          <TaskHoverPreview
            key={task.id}
            task={{
              title: task.title,
              status: task.status,
              priority: task.priority,
              dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : undefined,
            }}
          >
            <Link href="/dashboard/tasks" style={{ textDecoration: "none" }}>
              <div className="hover-bg" style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                gap: "12px",
                cursor: "pointer"
              }}>
                <CheckSquare size={14} style={{ color: "var(--notion-text-muted)" }} />
                <span style={{ flex: 1, fontSize: "14px", color: "var(--notion-text)" }}>
                  {task.title}
                </span>
                <Badge variant={statusColors[task.status] || "default"} size="sm">
                  {task.status.replace("_", " ")}
                </Badge>
              </div>
            </Link>
          </TaskHoverPreview>
        )) : (
          <div style={{ padding: "16px", color: "var(--notion-text-muted)", fontSize: "14px" }}>
            No tasks assigned yet.
          </div>
        )}
      </div>

      {/* Activity */}
      <h3 style={{
        fontSize: "14px",
        fontWeight: "600",
        color: "var(--notion-text-secondary)",
        marginTop: "48px",
        marginBottom: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.05em"
      }}>
        Recent Activity
      </h3>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: "32px", width: "100%" }} />)}
          </div>
        ) : activity.length > 0 ? (
          activity.slice(0, 5).map((item) => (
            <div key={item.id} className="hover-bg" style={{
              display: "flex",
              alignItems: "center",
              padding: "8px",
              borderRadius: "var(--radius-sm)",
              gap: "12px",
              borderBottom: "1px solid var(--notion-divider)"
            }}>
              <div style={{
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "var(--notion-bg-secondary)",
                borderRadius: "3px",
              }}>
                {item.type === "task" && <CheckSquare size={12} />}
                {item.type === "message" && <MessageSquare size={12} />}
              </div>
              <div style={{ flex: 1, fontSize: "14px", color: "var(--notion-text)" }}>{item.title}</div>
              <div style={{ fontSize: "12px", color: "var(--notion-text-secondary)" }}>{item.time}</div>
            </div>
          ))
        ) : (
          <div style={{ padding: "16px", color: "var(--notion-text-muted)", fontSize: "14px" }}>
            No recent activity updates.
          </div>
        )}
      </div>

      {/* Admin */}
      {isAdmin && (
        <div style={{ marginTop: "48px" }}>
          <h3 style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "var(--notion-text-secondary)",
            marginBottom: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Admin
          </h3>
          <Link href="/dashboard/admin" style={{ textDecoration: "none" }}>
            <Card hoverEffect padding="sm" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Shield size={18} />
              <span>Admin Panel</span>
              <ArrowRight size={14} style={{ marginLeft: "auto", opacity: 0.5 }} />
            </Card>
          </Link>
        </div>
      )}

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
