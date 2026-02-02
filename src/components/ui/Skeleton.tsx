"use client";

import { ReactNode } from "react";

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
    className?: string;
    style?: React.CSSProperties;
}

export function Skeleton({
    width = "100%",
    height = "16px",
    borderRadius = "4px",
    className = "",
    style = {}
}: SkeletonProps) {
    return (
        <div
            className={`skeleton-shimmer ${className}`}
            style={{
                width: typeof width === "number" ? `${width}px` : width,
                height: typeof height === "number" ? `${height}px` : height,
                borderRadius,
                background: "linear-gradient(90deg, #2a2a2a 25%, #333 50%, #2a2a2a 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
                ...style
            }}
        />
    );
}

// Pre-built skeleton patterns
export function SkeletonText({ lines = 3, gap = 8 }: { lines?: number; gap?: number }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: `${gap}px` }}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    width={i === lines - 1 ? "60%" : "100%"}
                    height={14}
                />
            ))}
        </div>
    );
}

export function SkeletonCard() {
    return (
        <div style={{
            padding: "16px",
            background: "var(--notion-bg-secondary)",
            borderRadius: "8px",
            border: "1px solid var(--notion-border)"
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <Skeleton width={40} height={40} borderRadius="50%" />
                <div style={{ flex: 1 }}>
                    <Skeleton width="60%" height={14} style={{ marginBottom: "8px" }} />
                    <Skeleton width="40%" height={12} />
                </div>
            </div>
            <SkeletonText lines={2} />
        </div>
    );
}

export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            padding: "12px 16px",
            borderBottom: "1px solid var(--notion-divider)"
        }}>
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton
                    key={i}
                    width={i === 0 ? "30%" : `${100 / columns}%`}
                    height={14}
                />
            ))}
        </div>
    );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div style={{ border: "1px solid var(--notion-border)", borderRadius: "8px" }}>
            {/* Header */}
            <div style={{
                display: "flex",
                gap: "16px",
                padding: "12px 16px",
                background: "var(--notion-bg-secondary)",
                borderBottom: "1px solid var(--notion-border)"
            }}>
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} width={`${100 / columns}%`} height={12} />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <SkeletonTableRow key={i} columns={columns} />
            ))}
        </div>
    );
}

export function SkeletonList({ items = 5 }: { items?: number }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {Array.from({ length: items }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "8px 12px",
                        background: "var(--notion-bg-secondary)",
                        borderRadius: "6px"
                    }}
                >
                    <Skeleton width={20} height={20} borderRadius="4px" />
                    <Skeleton width="70%" height={14} />
                    <Skeleton width={60} height={20} borderRadius="12px" style={{ marginLeft: "auto" }} />
                </div>
            ))}
        </div>
    );
}

// CSS Animation (add to globals.css or inline)
export function SkeletonStyles() {
    return (
        <style jsx global>{`
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            .skeleton-shimmer {
                position: relative;
                overflow: hidden;
            }
        `}</style>
    );
}
