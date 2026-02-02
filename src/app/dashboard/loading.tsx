"use client";

import { Skeleton, SkeletonCard, SkeletonList } from "@/components/ui/Skeleton";
import PageContainer from "@/components/layout/PageContainer";

export default function Loading() {
    return (
        <PageContainer
            title={<Skeleton width={200} height={32} />}
            icon={<Skeleton width={32} height={32} borderRadius="8px" />}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Stats Grid Skeleton */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "16px"
                }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
                    {/* Main Content Skeleton */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <Skeleton width="40%" height={24} style={{ marginBottom: "8px" }} />
                        <SkeletonList items={5} />
                    </div>

                    {/* Side Widget Skeleton */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <Skeleton width="60%" height={24} style={{ marginBottom: "8px" }} />
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
