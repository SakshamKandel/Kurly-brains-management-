"use client";

import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";
import PageContainer from "@/components/layout/PageContainer";

export default function Loading() {
    return (
        <PageContainer
            title={<Skeleton width={150} height={32} />}
            icon={<Skeleton width={32} height={32} borderRadius="8px" />}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Filter Bar Skeleton */}
                <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--notion-divider)", paddingBottom: "16px" }}>
                    <Skeleton width={200} height={36} />
                    <Skeleton width={100} height={36} />
                    <Skeleton width={100} height={36} style={{ marginLeft: "auto" }} />
                </div>

                {/* Table Skeleton */}
                <SkeletonTable rows={8} columns={4} />
            </div>
        </PageContainer>
    );
}
