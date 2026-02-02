"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  MessageSquare,
  Clock,
  Calendar,
  Megaphone,
  LogOut,
  Shield,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Key,
} from "lucide-react";
import { preload } from "swr";
import Avatar from "@/components/ui/Avatar";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import DraggableNav from "./DraggableNav";
import NotificationCenter from "@/components/ui/NotificationCenter";
import CustomPagesSidebar from "./CustomPagesSidebar";

// Navigation Items
const navItems = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "tasks", href: "/dashboard/tasks", label: "Tasks", Icon: CheckSquare },
  { id: "directory", href: "/dashboard/directory", label: "Directory", Icon: Users },
  { id: "messages", href: "/dashboard/messages", label: "Messages", Icon: MessageSquare },
  { id: "attendance", href: "/dashboard/attendance", label: "Attendance", Icon: Clock },
  { id: "leaves", href: "/dashboard/leaves", label: "Leaves", Icon: Calendar },
  { id: "announcements", href: "/dashboard/announcements", label: "Announcements", Icon: Megaphone },
  { id: "credentials", href: "/dashboard/credentials", label: "Credentials", Icon: Key },
];

const adminItems = [
  { id: "admin", href: "/dashboard/admin", label: "Admin Panel", Icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isCollapsed, setIsCollapsed, notificationCounts } = useSidebar();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Allow ADMIN, SUPER_ADMIN, and MANAGER to see the admin panel
  const isAdmin = ["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session?.user?.role || "");

  // Auto-collapse on mobile/small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const sidebarWidth = isCollapsed ? '52px' : '240px';

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 'var(--z-sidebar)',
            backdropFilter: 'blur(2px)'
          }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className="sidebar"
        style={{
          width: sidebarWidth,
          height: '100vh',
          backgroundColor: 'var(--notion-bg-secondary)',
          borderRight: '1px solid var(--notion-border)',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: `calc(var(--z-sidebar) + 1)`,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width var(--duration-200) var(--ease-notion)',
          overflow: 'hidden'
        }}
      >
        {/* Toggle Button for Collapsed State - Moved outside overflow area via fixed positioning logic handled below if needed, but actually keeping inside and fixing overflow is risky. 
            Better: Use the header toggle button OR place this absolute button properly. 
            IF I move it OUTSIDE aside, it needs to be tracking the sidebar position. 
            Simpler: Put it INSIDE the sidebar but visible. 
            Actually, the design was 'left: 56px' which is clearly meant to be Floating outside.
            So I will move the button OUTSIDE the aside.
        */}

        {/* Workspace Header */}
        <div
          style={{
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            padding: isCollapsed ? '0 12px' : '0 16px',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            borderBottom: '1px solid var(--notion-divider)',
            flexShrink: 0
          }}
        >
          {!isCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <img
                src="/logo-white.png"
                alt="Kurly Brains"
                style={{ width: '24px', height: '24px', objectFit: 'contain' }}
              />
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                fontSize: '14px'
              }}>KURLY BRAINS</span>
            </div>
          ) : (
            <button
              onClick={() => setIsCollapsed(false)}
              className="hover-bg"
              style={{
                width: '32px',
                height: '32px',
                background: 'transparent',
                border: 'none',
                color: 'var(--notion-text-secondary)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Expand Sidebar"
            >
              <ChevronsRight size={18} />
            </button>
          )}

          {/* Right side actions when expanded */}
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <NotificationCenter />
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hover-bg"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--notion-text-secondary)',
                  padding: '4px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ChevronsLeft size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Search (Notion Style) - Opens Command Palette */}
        {!isCollapsed && (
          <div style={{ padding: '12px 14px 4px 14px' }}>
            <button
              onClick={() => {
                // Dispatch keyboard event to trigger Command Palette
                const event = new KeyboardEvent('keydown', {
                  key: 'k',
                  ctrlKey: true,
                  bubbles: true,
                });
                document.dispatchEvent(event);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                backgroundColor: 'var(--notion-bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--notion-text-secondary)',
                fontSize: '13px',
                cursor: 'pointer',
                border: 'none',
                textAlign: 'left',
              }}>
              <Search size={14} />
              <span>Search</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.6 }}>⌘K</span>
            </button>
          </div>
        )}

        {/* Scrollable Nav Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '12px 4px'
        }}>
          {/* Main Items - Now Draggable */}
          <DraggableNav
            items={navItems}
            isCollapsed={isCollapsed}
            notificationCounts={{
              messages: notificationCounts.messages,
              tasks: notificationCounts.tasks,
              leaves: notificationCounts.leaves,
            }}
          />

          {/* Admin Items */}
          {isAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '24px' }}>
              {!isCollapsed && (
                <div style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--notion-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Shared
                </div>
              )}
              {adminItems.map((item) => {
                const Icon = item.Icon;
                const active = isActiveRoute(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: isCollapsed ? '8px' : '6px 12px',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      color: active ? 'var(--notion-text)' : 'var(--notion-text-secondary)',
                      backgroundColor: active ? 'var(--notion-bg-tertiary)' : 'transparent',
                      textDecoration: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '14px'
                    }}
                    onMouseEnter={() => {
                      if (item.id === "admin") preload("/api/users", (url) => fetch(url).then(r => r.json()));
                    }}
                    className="hover-bg"
                  >
                    <Icon size={18} strokeWidth={1.5} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Custom Pages Section */}
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--notion-divider)', paddingTop: '8px' }}>
            <CustomPagesSidebar isCollapsed={isCollapsed} />
          </div>
        </div>

        {/* User Footer */}
        <div style={{
          padding: isCollapsed ? '12px' : '12px',
          borderTop: '1px solid var(--notion-divider)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          justifyContent: isCollapsed ? 'center' : 'flex-start'
        }}>
          <Link href="/dashboard/profile">
            <Avatar name={session?.user?.name || "User"} size="sm" style={{ cursor: 'pointer' }} />
          </Link>

          {!isCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--notion-text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {session?.user?.name || "User"}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--notion-text-muted)' }}>
                {session?.user?.role || "STAFF"}
              </div>
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--notion-text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px'
              }}
              className="hover-bg"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          )}


        </div>
      </aside>
    </>
  );
}
