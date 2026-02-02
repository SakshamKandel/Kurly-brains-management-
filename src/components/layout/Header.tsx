"use client";

import { Bell, Search, Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import GlobalActionMenu from "./GlobalActionMenu";

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(".search-input");
        searchInput?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const firstName = session?.user?.name?.split(" ")[0] || "User";

  return (
    <header className="header">
      {/* Mobile Menu Button */}
      <button
        className="header-btn mobile-menu-btn"
        onClick={onMenuClick}
        aria-label="Toggle menu"
        style={{ display: "none" }}
      >
        <Menu size={20} strokeWidth={1.5} />
      </button>

      {/* Page Title */}
      <div className="header-left">
        <h1>{title}</h1>
      </div>

      {/* Right Side Actions */}
      <div className="header-right">
        {/* Search Box */}
        <div className="search-box">
          <Search size={18} className="search-icon" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search... (⌘K)"
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Global Action Menu */}
        <div style={{ marginRight: '8px' }}>
          <GlobalActionMenu />
        </div>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            className="header-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell size={20} strokeWidth={1.5} />
            <span className="notification-dot" />
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + var(--space-2))",
                right: 0,
                width: "320px",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-lg)",
                zIndex: "var(--z-dropdown)",
                animation: "slideDown var(--duration-150) ease-out",
              }}
            >
              <div
                style={{
                  padding: "var(--space-4)",
                  borderBottom: "1px solid var(--color-divider)",
                }}
              >
                <h4 style={{ margin: 0, fontSize: "var(--text-sm)" }}>NOTIFICATIONS</h4>
              </div>
              <div
                style={{
                  padding: "var(--space-6)",
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                  fontSize: "var(--text-sm)",
                }}
              >
                No new notifications
              </div>
            </div>
          )}
        </div>

        {/* User Greeting */}
        <div className="user-greeting">
          <span className="text-muted" style={{ fontSize: "var(--text-xs)" }}>
            Welcome,
          </span>
          <span
            className="user-name"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--text-sm)",
              textTransform: "uppercase",
              letterSpacing: "var(--tracking-wider)",
            }}
          >
            {firstName}
          </span>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
