"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface FocusModeContextType {
    isFocusMode: boolean;
    toggleFocusMode: () => void;
}

const FocusModeContext = createContext<FocusModeContextType | null>(null);

export function useFocusMode() {
    const context = useContext(FocusModeContext);
    if (!context) throw new Error("useFocusMode must be used within FocusModeProvider");
    return context;
}

export function FocusModeProvider({ children }: { children: ReactNode }) {
    const [isFocusMode, setIsFocusMode] = useState(false);

    const toggleFocusMode = useCallback(() => {
        setIsFocusMode(prev => !prev);
    }, []);

    // Listen for keyboard shortcut from KeyboardShortcuts component
    useEffect(() => {
        const handleToggle = () => toggleFocusMode();
        window.addEventListener("toggle-focus-mode", handleToggle);
        return () => window.removeEventListener("toggle-focus-mode", handleToggle);
    }, [toggleFocusMode]);

    // Apply focus mode styles to body
    useEffect(() => {
        if (isFocusMode) {
            document.body.classList.add("focus-mode");
        } else {
            document.body.classList.remove("focus-mode");
        }
    }, [isFocusMode]);

    return (
        <FocusModeContext.Provider value={{ isFocusMode, toggleFocusMode }}>
            {children}

            {/* Zen Mode Overlay & Styles */}
            {isFocusMode && (
                <>
                    {/* Floating Zen Indicator */}
                    <div style={{
                        position: "fixed",
                        bottom: "24px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        padding: "10px 20px",
                        background: "rgba(0, 0, 0, 0.4)",
                        backdropFilter: "blur(4px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "30px",
                        fontSize: "13px",
                        color: "rgba(255, 255, 255, 0.8)",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        zIndex: 1000,
                        animation: "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                        fontFamily: "var(--font-sans)",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                    }}>
                        <span style={{
                            width: "8px",
                            height: "8px",
                            background: "#a3a3a3",
                            borderRadius: "50%",
                            boxShadow: "0 0 10px rgba(255, 255, 255, 0.2)"
                        }} />
                        Zen Mode
                        <div style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.2)" }} />
                        <button
                            onClick={toggleFocusMode}
                            style={{
                                background: "transparent",
                                border: "none",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                color: "rgba(255, 255, 255, 0.6)",
                                cursor: "pointer",
                                transition: "color 0.2s",
                            }}
                            className="hover:text-white"
                        >
                            Exit
                        </button>
                    </div>
                </>
            )}

            <style jsx global>{`
                @keyframes fadeUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }

                /* Zen Mode Transitions */
                body {
                    transition: filter 0.8s ease, background-color 0.8s ease;
                }

                .focus-mode {
                    filter: grayscale(100%) contrast(1.05);
                    background-color: #111 !important; /* Deep dark bg */
                }

                /* Hide Distractions */
                .focus-mode .sidebar,
                .focus-mode .mobile-sidebar-toggle,
                .focus-mode .ai-fab,
                .focus-mode .command-palette-trigger, /* Assuming class name */
                .focus-mode header,
                .focus-mode .breadcrumb,
                .focus-mode .time-greeting {
                    opacity: 0 !important;
                    pointer-events: none !important;
                    transition: opacity 0.5s ease;
                }

                /* Focus Content */
                .focus-mode .main-content {
                    padding-left: 0 !important;
                    max-width: 800px;
                    margin: 0 auto;
                    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }

                /* Hide Badges/Notifications */
                .focus-mode .notification-badge,
                .focus-mode .unread-count {
                    display: none !important;
                }
            `}</style>
        </FocusModeContext.Provider>
    );
}
