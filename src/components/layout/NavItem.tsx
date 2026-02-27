"use client";

import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { preload } from "swr";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import NotificationBadge from "@/components/ui/NotificationBadge";
import SidebarHoverPreview from "./SidebarHoverPreview";
import { LucideIcon } from "lucide-react";

interface NavItemProps {
    id: string;
    href: string;
    label: string;
    Icon: LucideIcon;
    isCollapsed: boolean;
    notificationCount?: number;
    isDraggable?: boolean;
}

export default function NavItem({
    id,
    href,
    label,
    Icon,
    isCollapsed,
    notificationCount = 0,
    isDraggable = true,
}: NavItemProps) {
    const pathname = usePathname();
    const { favorites, toggleFavorite } = useSidebar();
    const isFavorite = favorites.includes(id);
    const [isMounted, setIsMounted] = useState(false);

    // Only enable dnd-kit after client mount to prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const isActive = href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(href);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id,
        disabled: !isDraggable || !isMounted,
    });

    // Only apply dnd-kit styles after mount
    const style = isMounted ? {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : "auto",
        cursor: isDraggable ? "grab" : "default",
    } : {
        position: "relative" as const,
    };

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(id);
    };

    const [isHovered, setIsHovered] = useState(false);

    const fetcher = (url: string) => fetch(url).then((res) => res.json());

    const handleMouseEnter = () => {
        setIsHovered(true);
        // Aggressive Hover Prefetch
        if (href === '/dashboard/tasks') preload('/api/tasks', fetcher);
        if (href === '/dashboard/credentials') preload('/api/credentials', fetcher);
        if (href === '/dashboard/messages') preload('/api/conversations', fetcher);
    };

    return (
        <SidebarHoverPreview itemId={id} isCollapsed={isCollapsed}>
            <div
                ref={isMounted ? setNodeRef : undefined}
                style={style as React.CSSProperties}
                {...(isMounted ? attributes : {})}
                {...(isMounted ? listeners : {})}
                className="nav-item-wrapper"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setIsHovered(false)}
                suppressHydrationWarning={true}
            >
                <Link
                    href={href}
                    title={isCollapsed ? label : undefined}
                    onClick={(e) => {
                        // Only navigate if not dragging
                        if (isDragging) {
                            e.preventDefault();
                        }
                    }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: isCollapsed ? "8px" : "6px 12px",
                        justifyContent: isCollapsed ? "center" : "flex-start",
                        color: isActive
                            ? "var(--notion-text)"
                            : "var(--notion-text-secondary)",
                        backgroundColor: isActive
                            ? "var(--notion-bg-tertiary)"
                            : "transparent",
                        textDecoration: "none",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "14px",
                        transition: "background-color 0.1s ease",
                        position: "relative",
                    }}
                    className="hover-bg"
                >
                    <Icon size={18} strokeWidth={1.5} />

                    {!isCollapsed && <span>{label}</span>}

                    {/* Right side: Favorite star + Badge */}
                    {!isCollapsed && (
                        <div
                            style={{
                                marginLeft: "auto",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            {/* Favorite Star */}
                            <motion.button
                                onClick={handleFavoriteClick}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    padding: "2px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    color: isFavorite
                                        ? "var(--notion-yellow)"
                                        : "var(--notion-text-muted)",
                                    opacity: isFavorite || isHovered ? 1 : 0,
                                    transition: "opacity 0.15s ease",
                                }}
                                className="favorite-star"
                                whileTap={{ scale: 0.85 }}
                                animate={isFavorite ? { scale: [1, 1.3, 1] } : {}}
                                transition={{ duration: 0.2 }}
                            >
                                <Star
                                    size={14}
                                    fill={isFavorite ? "var(--notion-yellow)" : "none"}
                                />
                            </motion.button>

                            {/* Notification Badge */}
                            {notificationCount > 0 && (
                                <NotificationBadge count={notificationCount} />
                            )}
                        </div>
                    )}

                    {/* Badge for collapsed state */}
                    {isCollapsed && notificationCount > 0 && (
                        <div
                            style={{
                                position: "absolute",
                                top: "-2px",
                                right: "-4px",
                            }}
                        >
                            <NotificationBadge count={notificationCount} />
                        </div>
                    )}
                </Link>
            </div>
        </SidebarHoverPreview>
    );
}

