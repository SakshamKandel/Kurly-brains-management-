"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell,
    X,
    CheckSquare,
    MessageSquare,
    Calendar,
    Clock,
    CheckCheck,
} from "lucide-react";

interface Notification {
    id: string;
    type: "task" | "message" | "leave" | "attendance" | "system";
    title: string;
    description?: string;
    time: string;
    read: boolean;
    href?: string;
}

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (e) {
            setNotifications([
                { id: "1", type: "task", title: "New task assigned", description: "Review project proposal", time: "2m ago", read: false },
                { id: "2", type: "message", title: "New message from Ahmed", time: "10m ago", read: false },
                { id: "3", type: "leave", title: "Leave request approved", time: "1h ago", read: true },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const handleClick = (notification: Notification) => {
        markAsRead(notification.id);
        if (notification.href) {
            router.push(notification.href);
        }
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type: Notification["type"]) => {
        switch (type) {
            case "task": return <CheckSquare size={14} style={{ color: "#eb5757" }} />;
            case "message": return <MessageSquare size={14} style={{ color: "#9b59b6" }} />;
            case "leave": return <Calendar size={14} style={{ color: "#f2994a" }} />;
            case "attendance": return <Clock size={14} style={{ color: "#0f9d58" }} />;
            default: return <Bell size={14} style={{ color: "var(--notion-text-muted)" }} />;
        }
    };

    return (
        <div ref={panelRef} style={{ position: "relative" }}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: "relative",
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    background: isOpen ? "var(--notion-bg-tertiary)" : "transparent",
                    border: "none",
                    color: "var(--notion-text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                className="hover-bg"
            >
                <Bell size={16} />
                {unreadCount > 0 && (
                    <span style={{
                        position: "absolute",
                        top: "2px",
                        right: "2px",
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: "#eb5757",
                        color: "#fff",
                        fontSize: "9px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel - Notion Style */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: "fixed",
                            top: "56px",
                            right: "16px",
                            width: "340px",
                            maxHeight: "440px",
                            background: "var(--notion-bg-secondary)",
                            border: "1px solid var(--notion-border)",
                            borderRadius: "8px",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                            overflow: "hidden",
                            zIndex: 9999,
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 14px",
                            borderBottom: "1px solid var(--notion-divider)",
                        }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--notion-text)" }}>
                                Notifications
                            </span>
                            <div style={{ display: "flex", gap: "8px" }}>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            color: "var(--notion-blue)",
                                            fontSize: "11px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px"
                                        }}
                                    >
                                        <CheckCheck size={12} />
                                        Mark all read
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div style={{
                            maxHeight: "360px",
                            overflowY: "auto",
                            padding: "6px"
                        }}>
                            {notifications.length > 0 ? notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleClick(notification)}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "10px",
                                        padding: "10px 12px",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        background: notification.read ? "transparent" : "rgba(82, 156, 202, 0.08)",
                                        marginBottom: "2px",
                                    }}
                                    className="hover-bg"
                                >
                                    <div style={{
                                        width: "26px",
                                        height: "26px",
                                        borderRadius: "6px",
                                        background: "var(--notion-bg-tertiary)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0
                                    }}>
                                        {getIcon(notification.type)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: "13px",
                                            fontWeight: notification.read ? 400 : 500,
                                            color: "var(--notion-text)",
                                            marginBottom: "2px"
                                        }}>
                                            {notification.title}
                                        </div>
                                        {notification.description && (
                                            <div style={{
                                                fontSize: "12px",
                                                color: "var(--notion-text-muted)",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap"
                                            }}>
                                                {notification.description}
                                            </div>
                                        )}
                                        <div style={{ fontSize: "11px", color: "var(--notion-text-muted)", marginTop: "4px" }}>
                                            {notification.time}
                                        </div>
                                    </div>
                                    {!notification.read && (
                                        <div style={{
                                            width: "6px",
                                            height: "6px",
                                            borderRadius: "50%",
                                            background: "var(--notion-blue)",
                                            flexShrink: 0,
                                            marginTop: "8px"
                                        }} />
                                    )}
                                </div>
                            )) : (
                                <div style={{
                                    padding: "24px",
                                    textAlign: "center",
                                    color: "var(--notion-text-muted)",
                                    fontSize: "13px"
                                }}>
                                    No notifications yet
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
