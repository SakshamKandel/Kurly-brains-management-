"use client";

import { SessionProvider, useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { Suspense, memo } from "react";
import { Menu } from "lucide-react";
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

const AIChatPalette = dynamic(() => import("@/components/ui/AIChatPalette"), {
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
    const { isCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
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
            <button
                className="mobile-sidebar-toggle"
                aria-label={isMobileOpen ? "Close navigation" : "Open navigation"}
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                <Menu size={18} />
            </button>
            <button
                className="ai-fab"
                aria-label="Open Kurly AI"
                onClick={() => window.dispatchEvent(new Event("open-ai-chat"))}
            >
                ✨
            </button>
            <main
                className="main-content"
                style={{
                    // CSS handles padding and mobile overrides.
                    ["--sidebar-space" as any]: isCollapsed ? "52px" : "240px",
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
            <Suspense fallback={null}>
                <AIChatPalette />
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
