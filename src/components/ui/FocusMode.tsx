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

            {/* Focus mode indicator */}
            {isFocusMode && (
                <div style={{
                    position: "fixed",
                    bottom: "16px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    padding: "8px 16px",
                    background: "var(--notion-bg-secondary)",
                    border: "1px solid var(--notion-border)",
                    borderRadius: "20px",
                    fontSize: "12px",
                    color: "var(--notion-text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    zIndex: 1000,
                    animation: "fadeUp 0.3s ease-out",
                }}>
                    <span style={{ color: "var(--notion-green)" }}>●</span>
                    Focus Mode
                    <button
                        onClick={toggleFocusMode}
                        style={{
                            background: "var(--notion-bg-tertiary)",
                            border: "none",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            color: "var(--notion-text-muted)",
                            cursor: "pointer",
                        }}
                    >
                        Exit
                    </button>
                </div>
            )}

            <style jsx global>{`
                @keyframes fadeUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }

                .focus-mode .sidebar {
                    transform: translateX(-100%);
                    opacity: 0;
                }

                .focus-mode .main-content {
                    padding-left: 24px !important;
                    max-width: 900px;
                    margin: 0 auto;
                }

                .focus-mode .time-greeting,
                .focus-mode .breadcrumb {
                    display: none;
                }
            `}</style>
        </FocusModeContext.Provider>
    );
}
