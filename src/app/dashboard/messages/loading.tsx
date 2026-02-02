"use client";

import { Skeleton, SkeletonList } from "@/components/ui/Skeleton";
import PageContainer from "@/components/layout/PageContainer";

export default function Loading() {
    return (
        <div style={{ display: "flex", height: "calc(100vh - 64px)", gap: "1px", background: "var(--notion-divider)" }}>
            {/* Sidebar List Skeleton */}
            <div style={{ width: "300px", background: "var(--notion-bg)", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                    <Skeleton width="80%" height={36} />
                    <Skeleton width={36} height={36} borderRadius="4px" />
                </div>
                <SkeletonList items={8} />
            </div>

            {/* Chat Area Skeleton */}
            <div style={{ flex: 1, background: "var(--notion-bg)", display: "flex", flexDirection: "column" }}>
                {/* Chat Header */}
                <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--notion-border)", display: "flex", alignItems: "center", gap: "12px" }}>
                    <Skeleton width={40} height={40} borderRadius="50%" />
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <Skeleton width={120} height={16} />
                        <Skeleton width={80} height={12} />
                    </div>
                </div>

                {/* Messages Skeleton */}
                <div style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div style={{ alignSelf: "flex-start", maxWidth: "70%" }}><Skeleton width={200} height={40} borderRadius="12px" /></div>
                    <div style={{ alignSelf: "flex-end", maxWidth: "70%" }}><Skeleton width={250} height={60} borderRadius="12px" /></div>
                    <div style={{ alignSelf: "flex-start", maxWidth: "70%" }}><Skeleton width={180} height={40} borderRadius="12px" /></div>
                    <div style={{ alignSelf: "flex-start", maxWidth: "70%" }}><Skeleton width={300} height={80} borderRadius="12px" /></div>
                    <div style={{ alignSelf: "flex-end", maxWidth: "70%" }}><Skeleton width={150} height={40} borderRadius="12px" /></div>
                </div>

                {/* Input Skeleton */}
                <div style={{ padding: "16px" }}>
                    <Skeleton width="100%" height={48} borderRadius="8px" />
                </div>
            </div>
        </div>
    );
}
