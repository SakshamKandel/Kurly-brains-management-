"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Clock, FileText, Calendar, Timer, Quote, ListTodo } from "lucide-react";

export interface WidgetOption {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
}

const ALL_WIDGETS: WidgetOption[] = [
    { id: "pomodoro", name: "Pomodoro Timer", description: "Focus timer with breaks", icon: <Timer size={20} /> },
    { id: "notes", name: "Quick Notes", description: "Jot down quick thoughts", icon: <FileText size={20} /> },
    { id: "calendar", name: "Calendar", description: "View upcoming events", icon: <Calendar size={20} /> },
    { id: "clock", name: "World Clock", description: "Multiple time zones", icon: <Clock size={20} /> },
    { id: "quote", name: "Daily Quote", description: "Inspirational quotes", icon: <Quote size={20} /> },
    { id: "todos", name: "Quick Tasks", description: "Personal task list", icon: <ListTodo size={20} /> },
];

interface WidgetPickerProps {
    isOpen: boolean;
    onClose: () => void;
    activeWidgets: string[];
    onAddWidget: (widgetId: string) => void;
    onRemoveWidget: (widgetId: string) => void;
}

export default function WidgetPicker({
    isOpen,
    onClose,
    activeWidgets,
    onAddWidget,
    onRemoveWidget
}: WidgetPickerProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    backdropFilter: "blur(4px)",
                    zIndex: 9998,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: "100%",
                        maxWidth: "480px",
                        backgroundColor: "var(--notion-bg)",
                        borderRadius: "12px",
                        boxShadow: "0 24px 48px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--notion-border)",
                        overflow: "hidden",
                    }}
                >
                    {/* Header */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        borderBottom: "1px solid var(--notion-divider)",
                    }}>
                        <div>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--notion-text)" }}>
                                Widget Gallery
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--notion-text-muted)" }}>
                                Add or remove widgets from your dashboard
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: "transparent",
                                border: "none",
                                padding: "6px",
                                borderRadius: "var(--radius-sm)",
                                cursor: "pointer",
                                color: "var(--notion-text-muted)",
                                display: "flex",
                            }}
                            className="hover-bg"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Widget Grid */}
                    <div style={{
                        padding: "16px",
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "12px",
                        maxHeight: "400px",
                        overflowY: "auto",
                    }}>
                        {ALL_WIDGETS.map((widget) => {
                            const isActive = activeWidgets.includes(widget.id);
                            return (
                                <div
                                    key={widget.id}
                                    style={{
                                        padding: "16px",
                                        borderRadius: "8px",
                                        border: `1px solid ${isActive ? "var(--notion-blue)" : "var(--notion-border)"}`,
                                        backgroundColor: isActive ? "var(--notion-blue-bg)" : "var(--notion-bg-secondary)",
                                        cursor: "pointer",
                                        transition: "all 0.15s",
                                    }}
                                    className="hover-bg"
                                    onClick={() => {
                                        if (isActive) {
                                            onRemoveWidget(widget.id);
                                        } else {
                                            onAddWidget(widget.id);
                                        }
                                    }}
                                >
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: "8px",
                                    }}>
                                        <div style={{ color: isActive ? "var(--notion-blue)" : "var(--notion-text-secondary)" }}>
                                            {widget.icon}
                                        </div>
                                        <div style={{
                                            width: "20px",
                                            height: "20px",
                                            borderRadius: "4px",
                                            border: `1px solid ${isActive ? "var(--notion-blue)" : "var(--notion-border)"}`,
                                            backgroundColor: isActive ? "var(--notion-blue)" : "transparent",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}>
                                            {isActive && <X size={12} color="white" />}
                                            {!isActive && <Plus size={12} style={{ color: "var(--notion-text-muted)" }} />}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--notion-text)" }}>
                                        {widget.name}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "var(--notion-text-muted)", marginTop: "2px" }}>
                                        {widget.description}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: "12px 16px",
                        borderTop: "1px solid var(--notion-divider)",
                        fontSize: "11px",
                        color: "var(--notion-text-muted)",
                        textAlign: "center",
                    }}>
                        {activeWidgets.length} widgets active • Click to add or remove
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export { ALL_WIDGETS };
