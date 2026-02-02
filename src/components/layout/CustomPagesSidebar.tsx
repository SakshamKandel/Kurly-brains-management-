"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    X,
    FileText
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CustomPage {
    id: string;
    title: string;
    icon: string;
    updatedAt: string;
    _count: {
        blocks: number;
    };
}



interface CustomPagesProps {
    isCollapsed: boolean;
}

export default function CustomPagesSidebar({ isCollapsed }: CustomPagesProps) {
    console.log("CustomPagesSidebar rendering - HMR Check");
    const [pages, setPages] = useState<CustomPage[]>([]);
    const [mounted, setMounted] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const router = useRouter();

    const fetchPages = async () => {
        try {
            console.log("Sidebar: Fetching pages...");
            const res = await fetch("/api/pages");
            console.log("Sidebar status:", res.status);
            if (res.ok) {
                const data = await res.json();
                console.log("Sidebar data:", data);
                setPages(data);
            } else {
                console.error("Sidebar fetch failed:", await res.text());
            }
        } catch (e) {
            console.error("Failed to fetch pages:", e);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchPages();
    }, [refreshTrigger]);

    // Listen for title updates to trigger refresh
    useEffect(() => {
        const handleTitleUpdate = (event: Event) => {
            const customEvent = event as CustomEvent<{ pageId: string; title: string }>;
            const { pageId, title } = customEvent.detail || {};

            console.log("Sidebar: Received page-title-updated event", { pageId, title });

            if (pageId && title) {
                // Directly update the specific page's title in state
                setPages(prevPages =>
                    prevPages.map(p =>
                        p.id === pageId ? { ...p, title } : p
                    )
                );
            } else {
                // Fallback: refetch all pages
                setRefreshTrigger(prev => prev + 1);
            }
        };

        window.addEventListener('page-title-updated', handleTitleUpdate);
        return () => {
            window.removeEventListener('page-title-updated', handleTitleUpdate);
        };
    }, []);

    const addPage = async () => {
        try {
            const res = await fetch("/api/pages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: `Mood Board ${new Date().toLocaleDateString()}`,
                    type: "moodboard",
                    icon: "📄"
                })
            });

            if (res.ok) {
                const newPage = await res.json();
                setPages([...pages, newPage]);
                router.push(`/dashboard/pages/${newPage.id}`);
            }
        } catch (e) {
            console.error("Failed to create page:", e);
        }
    };

    const removePage = async (id: string, e: React.MouseEvent, blockCount: number) => {
        e.preventDefault();
        e.stopPropagation();

        // If the page has content (more than 1 block, assuming 1 is default empty), ask for confirmation.
        // Otherwise, just delete it.
        if (blockCount > 1) {
            if (!confirm("This page has content. Are you sure you want to delete it?")) return;
        }

        try {
            const res = await fetch(`/api/pages/${id}`, { method: "DELETE" });
            if (res.ok) {
                setPages(pages.filter(p => p.id !== id));
                // Only navigate away if we are currently on that page
                if (window.location.pathname.includes(id)) {
                    router.push("/dashboard");
                }
            }
        } catch (e) {
            console.error("Failed to delete page:", e);
        }
    };

    if (!mounted) return null;

    return (
        <>
            {/* Section Header */}
            <div style={{
                padding: isCollapsed ? "8px 12px" : "8px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "space-between",
                marginTop: "8px"
            }}>
                {!isCollapsed && (
                    <span style={{
                        fontSize: "11px",
                        fontWeight: 500,
                        color: "var(--notion-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                    }}>
                        Pages
                    </span>
                )}
                <button
                    onClick={() => addPage()}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--notion-text-muted)",
                        cursor: "pointer",
                        padding: "4px",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center"
                    }}
                    className="hover-bg"
                    title="Add New Page"
                >
                    <Plus size={14} />
                </button>
            </div>

            {/* Pages List */}
            <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                padding: isCollapsed ? "0 8px" : "0 8px"
            }}>
                {pages.map((page) => (
                    <div
                        key={page.id}
                        className="group hover-bg"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: isCollapsed ? "8px" : "6px 8px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            justifyContent: isCollapsed ? "center" : "space-between",
                            color: "var(--notion-text)"
                        }}
                        onClick={() => router.push(`/dashboard/pages/${page.id}`)}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, overflow: "hidden" }}>
                            <FileText size={14} style={{ color: "var(--notion-text-muted)", flexShrink: 0 }} />
                            {!isCollapsed && (
                                <span style={{
                                    fontSize: "13px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                }}>
                                    {page.title}
                                </span>
                            )}
                        </div>

                        {!isCollapsed && (
                            <button
                                onClick={(e) => removePage(page.id, e, page._count?.blocks || 0)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--notion-text-muted)",
                                    padding: "4px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "4px",
                                    zIndex: 10
                                }}
                                className="hover:bg-[rgba(0,0,0,0.05)]"
                                title="Remove Page"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                ))}

                {pages.length === 0 && !isCollapsed && (
                    <div style={{
                        fontSize: "12px",
                        color: "var(--notion-text-muted)",
                        padding: "8px",
                        textAlign: "center"
                    }}>
                        No pages yet
                    </div>
                )}
            </div>


        </>
    );
}
