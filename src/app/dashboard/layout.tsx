"use client";

import { SessionProvider, useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { Suspense, memo } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { SidebarProvider, useSidebar } from "@/lib/contexts/SidebarContext";
import { ToastProvider } from "@/components/ui/Toast";
import { CelebrationProvider } from "@/components/ui/Celebration";
import { FocusModeProvider } from "@/components/ui/FocusMode";
import { SkeletonStyles } from "@/components/ui/Skeleton";
import DashboardPrefetcher from "@/components/dashboard/DashboardPrefetcher";

// Lazy load non-critical components
const CommandPalette = dynamic(() => import("@/components/ui/CommandPalette"), {
    ssr: false,
});

const KeyboardShortcuts = dynamic(() => import("@/components/ui/KeyboardShortcuts"), {
    ssr: false,
});

const TimeGreeting = dynamic(() => import("@/components/ui/TimeGreeting"), {
    ssr: false,
});

const ContextQuickActions = dynamic(() => import("@/components/ui/ContextQuickActions"), {
    ssr: false,
});

const ForcePasswordChangeModal = dynamic(
    () => import("@/components/auth/ForcePasswordChangeModal"),
    { ssr: false }
);

const PageTransition = dynamic(() => import("@/components/ui/PageTransition"), {
    ssr: false,
    loading: () => null,
});

// Memoized dashboard content to prevent unnecessary re-renders
const DashboardContent = memo(function DashboardContent({
    children
}: {
    children: React.ReactNode
}) {
    const { isCollapsed } = useSidebar();
    const { data: session } = useSession();

    // @ts-ignore
    const mustChangePassword = session?.user?.mustChangePassword;

    return (
        <div className="dashboard-layout">
            {mustChangePassword && session?.user?.id && (
                <Suspense fallback={null}>
                    <ForcePasswordChangeModal userId={session.user.id} />
                </Suspense>
            )}
            <Sidebar />
            <main
                className="main-content"
                style={{
                    paddingLeft: isCollapsed ? '52px' : '240px',
                    minHeight: '100vh',
                    transition: 'padding-left 0.2s ease'
                }}
            >
                <Suspense fallback={null}>
                    <TimeGreeting />
                </Suspense>
                <Suspense fallback={null}>
                    <PageTransition>
                        {children}
                    </PageTransition>
                </Suspense>
            </main>
            <Suspense fallback={null}>
                <CommandPalette />
            </Suspense>
            <Suspense fallback={null}>
                <KeyboardShortcuts />
            </Suspense>
            <Suspense fallback={null}>
                <ContextQuickActions />
            </Suspense>
            <SkeletonStyles />
        </div>
    );
});

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider>
            <ToastProvider>
                <CelebrationProvider>
                    <FocusModeProvider>
                        <SidebarProvider>
                            <DashboardPrefetcher />
                            <DashboardContent>{children}</DashboardContent>
                        </SidebarProvider>
                    </FocusModeProvider>
                </CelebrationProvider>
            </ToastProvider>
        </SessionProvider>
    );
}
