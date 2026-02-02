"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  CheckSquare,
  MessageSquare,
  Clock,
  Calendar,
  Megaphone,
  TrendingUp,
  ArrowRight,
  Shield,
  Plus
} from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/layout/Breadcrumb";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { TaskHoverPreview } from "@/components/ui/HoverPreview";
import AIInsights from "@/components/ui/AIInsights";
import PomodoroWidget from "@/components/widgets/PomodoroWidget";
import QuickNotesWidget from "@/components/widgets/QuickNotesWidget";
import CalendarWidget from "@/components/widgets/CalendarWidget";

interface DashboardStats {
  totalUsers: number;
  activeTasks: number;
  pendingLeaves: number;
  todayAttendance: number;
  unreadMessages: number;
  newAnnouncements: number;
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

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

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
        setActivity(data.recentActivity || []);
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

  const dashboardItems = [
    { label: "Directory", count: stats?.totalUsers, icon: Users, href: "/dashboard/directory", color: "var(--notion-blue)" },
    { label: "Tasks", count: stats?.activeTasks, icon: CheckSquare, href: "/dashboard/tasks", color: "var(--notion-red)" },
    { label: "Leaves", count: stats?.pendingLeaves, icon: Calendar, href: "/dashboard/leaves", color: "var(--notion-yellow)" },
    { label: "Attendance", count: stats?.todayAttendance, icon: Clock, href: "/dashboard/attendance", color: "var(--notion-green)" },
    { label: "Messages", count: stats?.unreadMessages, icon: MessageSquare, href: "/dashboard/messages", color: "var(--notion-purple)" },
    { label: "Announcements", count: stats?.newAnnouncements, icon: Megaphone, href: "/dashboard/announcements", color: "var(--notion-pink)" },
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
        <Button size="sm" icon={<Plus size={14} />}>Add Page</Button>
      }
    >
      <Breadcrumb />

      {/* AI Insights */}
      <AIInsights />

      {/* Greeting Block */}
      <div style={{ margin: "24px 0 40px 0" }}>
        <p style={{ fontSize: "16px", color: "var(--notion-text)", marginBottom: "8px" }}>
          Welcome back, <strong>{session?.user?.name}</strong>
        </p>
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
              Press <code style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "3px" }}>Ctrl + /</code> to see keyboard shortcuts.
            </div>
          </div>
        </div>
      </div>

      {/* Widget Dashboard */}
      <h3 style={{
        fontSize: "14px",
        fontWeight: "600",
        color: "var(--notion-text-secondary)",
        marginTop: "32px",
        marginBottom: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.05em"
      }}>
        My Widgets
      </h3>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "16px",
        marginBottom: "32px"
      }}>
        <div style={{ height: "100%" }}>
          <PomodoroWidget />
        </div>
        <div style={{ height: "100%" }}>
          <QuickNotesWidget />
        </div>
        <div style={{ height: "100%" }}>
          <CalendarWidget />
        </div>
      </div>

      {/* Pages / Database View */}
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
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: item.color
              }}>
                <item.icon size={18} strokeWidth={2} />
                <span style={{
                  color: "var(--notion-text)",
                  fontWeight: "500",
                  fontSize: "14px"
                }}>
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

      {/* My Tasks Section - with Hover Preview */}
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
              <div
                className="hover-bg"
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  gap: "12px",
                  cursor: "pointer"
                }}
              >
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

      {/* Activity Section */}
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
            <div
              key={item.id}
              className="hover-bg"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px",
                borderRadius: "var(--radius-sm)",
                gap: "12px",
                borderBottom: "1px solid var(--notion-divider)"
              }}
            >
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
                {item.type === "leave" && <Calendar size={12} />}
                {item.type === "message" && <MessageSquare size={12} />}
                {item.type === "attendance" && <Clock size={12} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", color: "var(--notion-text)" }}>{item.title}</div>
              </div>
              <div style={{ fontSize: "12px", color: "var(--notion-text-secondary)" }}>
                {item.time}
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: "16px", color: "var(--notion-text-muted)", fontSize: "14px" }}>
            No recent activity updates.
          </div>
        )}
      </div>

      {/* Admin Quick Link */}
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
    </PageContainer>
  );
}
