"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
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
    CreditCard,
    Command,
} from "lucide-react";
import { globalSearch } from "@/app/actions/search";

interface CommandItem {
    id: string;
    label: string;
    href: string;
    icon: any;
    keywords: string[];
    description?: string;
    type?: "page" | "user" | "task" | "invoice" | "message";
}

const STATIC_PAGES: CommandItem[] = [
    { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} />, keywords: ["home", "main"], type: "page" },
    { id: "tasks", label: "Tasks", href: "/dashboard/tasks", icon: <CheckSquare size={18} />, keywords: ["todo", "work"], type: "page" },
    { id: "directory", label: "Directory", href: "/dashboard/directory", icon: <Users size={18} />, keywords: ["team", "people", "staff"], type: "page" },
    { id: "messages", label: "Messages", href: "/dashboard/messages", icon: <MessageSquare size={18} />, keywords: ["chat", "inbox", "dm"], type: "page" },
    { id: "calendar", label: "Work Calendar", href: "/dashboard/calendar", icon: <Calendar size={18} />, keywords: ["schedule", "deadlines", "timeline"], type: "page" },
    { id: "invoices", label: "Invoices", href: "/dashboard/invoices", icon: <CreditCard size={18} />, keywords: ["billing", "finance"], type: "page" },
    { id: "attendance", label: "Attendance", href: "/dashboard/attendance", icon: <Clock size={18} />, keywords: ["time", "clock", "checkin"], type: "page" },
    { id: "leaves", label: "Leaves", href: "/dashboard/leaves", icon: <Calendar size={18} />, keywords: ["vacation", "holiday", "pto"], type: "page" },
    { id: "announcements", label: "Announcements", href: "/dashboard/announcements", icon: <Megaphone size={18} />, keywords: ["news", "updates"], type: "page" },
    { id: "admin", label: "Admin Panel", href: "/dashboard/admin", icon: <Shield size={18} />, keywords: ["settings", "manage"], type: "page" },
    { id: "zen-mode", label: "Toggle Zen Mode", href: "#", icon: <LayoutDashboard size={18} />, keywords: ["focus", "hide", "zen"], type: "page" },
    { id: "profile", label: "Profile", href: "/dashboard/profile", icon: <User size={18} />, keywords: ["account", "me", "settings"], type: "page" },
];

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [results, setResults] = useState<CommandItem[]>(STATIC_PAGES);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Toggle with Cmd+K
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

    useEffect(() => {
        const open = () => setIsOpen(true);
        window.addEventListener("open-command-palette", open);
        return () => window.removeEventListener("open-command-palette", open);
    }, []);

    // Reset when closed
    useEffect(() => {
        if (!isOpen) {
            setQuery("");
            setResults(STATIC_PAGES);
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Deep Search Logic
    useEffect(() => {
        if (!query) {
            setResults(STATIC_PAGES);
            return;
        }

        const timer = setTimeout(() => {
            startTransition(async () => {
                // 1. Filter Static Pages
                const staticBox = STATIC_PAGES.filter(page =>
                    page.label.toLowerCase().includes(query.toLowerCase()) ||
                    page.keywords.some(k => k.includes(query.toLowerCase()))
                );

                try {
                    // 2. Fetch Dynamic Data
                    const data = await globalSearch(query);

                    const dynamicItems: CommandItem[] = [
                        ...data.users.map(u => ({
                            id: u.id,
                            label: u.name,
                            description: u.role,
                            href: `/dashboard/messages?userId=${u.id}`, // Redirect to chat with this user
                            icon: <User size={18} />,
                            keywords: [u.email],
                            type: "user" as const
                        })),
                        ...data.tasks.map(t => ({
                            id: t.id,
                            label: t.title,
                            description: `${t.status} • ${t.priority}`,
                            href: `/dashboard/tasks?id=${t.id}`,
                            icon: <CheckSquare size={18} />,
                            keywords: [],
                            type: "task" as const
                        })),
                        ...data.invoices.map(i => ({
                            id: i.id,
                            label: `Invoice ${i.invoiceNumber}`,
                            description: `${i.clientName} • $${i.total}`,
                            href: `/dashboard/invoices/${i.id}`,
                            icon: <CreditCard size={18} />,
                            keywords: [i.clientName],
                            type: "invoice" as const
                        })),
                        ...data.messages.map(m => ({
                            id: m.id,
                            label: m.senderName,
                            description: m.content,
                            href: `/dashboard/messages?id=${m.id}`,
                            icon: <MessageSquare size={18} />,
                            keywords: [m.content],
                            type: "message" as const
                        }))
                    ];

                    setResults([...staticBox, ...dynamicItems]);
                    setSelectedIndex(0);
                } catch (error) {
                    console.error("Search failed", error);
                    setResults(staticBox);
                }
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Keyboard Navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const item = results[selectedIndex];
            if (item) handleSelect(item);
        }
    };

    const handleSelect = (item: CommandItem) => {
        setIsOpen(false);
        if (item.id === "zen-mode") {
            window.dispatchEvent(new Event("toggle-focus-mode"));
            return;
        }
        router.push(item.href);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)" }}
                onClick={() => setIsOpen(false)}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 500 }}
                    className="relative w-full max-w-lg bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center px-4 py-3 border-b border-[var(--notion-border)]">
                        <Search className="w-5 h-5 text-[var(--notion-text-muted)] mr-3" />
                        <input
                            autoFocus
                            className="flex-1 bg-transparent border-none outline-none text-[15px] text-[var(--notion-text)] placeholder-[var(--notion-text-muted)]"
                            placeholder="Type a command or search..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        {isPending ? (
                            <div className="animate-spin w-4 h-4 border-2 border-[var(--notion-text-muted)] border-t-transparent rounded-full" />
                        ) : (
                            <div className="flex gap-1">
                                <span className="rounded bg-[var(--notion-bg-secondary)] px-1.5 py-0.5 text-xs text-[var(--notion-text-muted)]">ESC</span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                        {results.length === 0 ? (
                            <div className="p-8 text-center text-[var(--notion-text-muted)] text-sm">
                                No results found.
                            </div>
                        ) : (
                            results.map((item, index) => (
                                <div
                                    key={`${item.type}-${item.id}`}
                                    onClick={() => handleSelect(item)}
                                    className={`
                                        flex items-center px-3 py-2.5 rounded-lg cursor-pointer text-sm mb-1
                                        ${index === selectedIndex ? 'bg-[var(--notion-bg-hover)]' : ''}
                                    `}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <div className={`mr-3 ${index === selectedIndex ? 'text-[var(--notion-text)]' : 'text-[var(--notion-text-muted)]'}`}>
                                        {item.icon}
                                    </div>
                                    <div className="flex flex-col overflow-hidden flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[var(--notion-text)] font-medium truncate">
                                                {item.label}
                                            </span>
                                            {item.type && item.type !== 'page' && (
                                                <span className="text-[9px] uppercase tracking-wider text-[var(--notion-text-muted)] ml-2 border border-[var(--notion-border)] px-1 rounded">
                                                    {item.type}
                                                </span>
                                            )}
                                        </div>
                                        {item.description && (
                                            <span className="text-[11px] text-[var(--notion-text-muted)] truncate block mt-0.5">
                                                {item.description}
                                            </span>
                                        )}
                                    </div>
                                    {index === selectedIndex && (
                                        <div className="ml-3 text-[10px] text-[var(--notion-text-muted)]">
                                            ↵
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="px-3 py-2 border-t border-[var(--notion-border)] flex items-center justify-between text-[10px] text-[var(--notion-text-muted)] bg-[var(--notion-bg-secondary)]">
                        <div className="flex gap-3">
                            <span><strong className="font-medium">↑↓</strong> navigate</span>
                            <span><strong className="font-medium">↵</strong> select</span>
                        </div>
                        <div>
                            Universal Search Active
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
