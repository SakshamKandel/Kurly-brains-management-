"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    LayoutDashboard,
    Users,
    CheckSquare,
    MessageSquare,
    Clock,
    Calendar,
    Megaphone,
    Shield,
    User,
    X,
    Command,
} from "lucide-react";

interface CommandItem {
    id: string;
    label: string;
    href: string;
    icon: React.ReactNode;
    keywords?: string[];
}

const commands: CommandItem[] = [
    { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} />, keywords: ["home", "main"] },
    { id: "tasks", label: "Tasks", href: "/dashboard/tasks", icon: <CheckSquare size={18} />, keywords: ["todo", "work"] },
    { id: "directory", label: "Directory", href: "/dashboard/directory", icon: <Users size={18} />, keywords: ["team", "people", "staff"] },
    { id: "messages", label: "Messages", href: "/dashboard/messages", icon: <MessageSquare size={18} />, keywords: ["chat", "inbox", "dm"] },
    { id: "attendance", label: "Attendance", href: "/dashboard/attendance", icon: <Clock size={18} />, keywords: ["time", "clock", "checkin"] },
    { id: "leaves", label: "Leaves", href: "/dashboard/leaves", icon: <Calendar size={18} />, keywords: ["vacation", "holiday", "pto"] },
    { id: "announcements", label: "Announcements", href: "/dashboard/announcements", icon: <Megaphone size={18} />, keywords: ["news", "updates"] },
    { id: "admin", label: "Admin Panel", href: "/dashboard/admin", icon: <Shield size={18} />, keywords: ["settings", "manage"] },
    { id: "profile", label: "Profile", href: "/dashboard/profile", icon: <User size={18} />, keywords: ["account", "me", "settings"] },
];

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Fuzzy search filter
    const filteredCommands = commands.filter((cmd) => {
        const searchLower = search.toLowerCase();
        const labelMatch = cmd.label.toLowerCase().includes(searchLower);
        const keywordMatch = cmd.keywords?.some((kw) => kw.includes(searchLower));
        return labelMatch || keywordMatch;
    });

    // Keyboard shortcut handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }

            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setSearch("");
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Navigation keyboard controls
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < filteredCommands.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredCommands.length - 1
                );
            } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
                router.push(filteredCommands[selectedIndex].href);
                setIsOpen(false);
            }
        },
        [filteredCommands, selectedIndex, router]
    );

    // Reset selection when search changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    backdropFilter: "blur(4px)",
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    paddingTop: "15vh",
                }}
                onClick={() => setIsOpen(false)}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 500 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: "100%",
                        maxWidth: "520px",
                        backgroundColor: "var(--notion-bg)",
                        borderRadius: "12px",
                        boxShadow: "0 24px 48px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--notion-border)",
                        overflow: "hidden",
                    }}
                >
                    {/* Search Input */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "16px 20px",
                            borderBottom: "1px solid var(--notion-divider)",
                            gap: "12px",
                        }}
                    >
                        <Search size={20} style={{ color: "var(--notion-text-muted)" }} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search or jump to..."
                            style={{
                                flex: 1,
                                background: "transparent",
                                border: "none",
                                outline: "none",
                                fontSize: "16px",
                                color: "var(--notion-text)",
                            }}
                        />
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 8px",
                                backgroundColor: "var(--notion-bg-tertiary)",
                                borderRadius: "6px",
                                fontSize: "12px",
                                color: "var(--notion-text-muted)",
                            }}
                        >
                            <Command size={12} />
                            <span>K</span>
                        </div>
                    </div>

                    {/* Results */}
                    <div
                        style={{
                            maxHeight: "320px",
                            overflowY: "auto",
                            padding: "8px",
                        }}
                    >
                        {filteredCommands.length === 0 ? (
                            <div
                                style={{
                                    padding: "24px",
                                    textAlign: "center",
                                    color: "var(--notion-text-muted)",
                                }}
                            >
                                No results found
                            </div>
                        ) : (
                            filteredCommands.map((cmd, index) => (
                                <motion.button
                                    key={cmd.id}
                                    onClick={() => {
                                        router.push(cmd.href);
                                        setIsOpen(false);
                                    }}
                                    initial={false}
                                    animate={{
                                        backgroundColor:
                                            index === selectedIndex
                                                ? "var(--notion-bg-tertiary)"
                                                : "transparent",
                                    }}
                                    transition={{ duration: 0.1 }}
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        padding: "10px 12px",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        color: "var(--notion-text)",
                                        textAlign: "left",
                                        fontSize: "14px",
                                    }}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <span style={{ color: "var(--notion-text-secondary)" }}>
                                        {cmd.icon}
                                    </span>
                                    <span>{cmd.label}</span>
                                    {index === selectedIndex && (
                                        <span
                                            style={{
                                                marginLeft: "auto",
                                                fontSize: "12px",
                                                color: "var(--notion-text-muted)",
                                            }}
                                        >
                                            ↵ Enter
                                        </span>
                                    )}
                                </motion.button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            padding: "12px 16px",
                            borderTop: "1px solid var(--notion-divider)",
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            fontSize: "12px",
                            color: "var(--notion-text-muted)",
                        }}
                    >
                        <span>
                            <kbd style={{ padding: "2px 4px", backgroundColor: "var(--notion-bg-tertiary)", borderRadius: "4px" }}>↑↓</kbd> to navigate
                        </span>
                        <span>
                            <kbd style={{ padding: "2px 4px", backgroundColor: "var(--notion-bg-tertiary)", borderRadius: "4px" }}>↵</kbd> to select
                        </span>
                        <span>
                            <kbd style={{ padding: "2px 4px", backgroundColor: "var(--notion-bg-tertiary)", borderRadius: "4px" }}>esc</kbd> to close
                        </span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
