"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X, Loader2, Trash2 } from "lucide-react";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

export default function AIChatPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        console.log("AIChatPalette mounted, shortcut: Ctrl/Cmd + .");
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && (e.key === "." || e.code === "Period")) {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        };

        const handleCustomEvent = () => setIsOpen(true);

        document.addEventListener("keydown", handleKeyDown);
        window.addEventListener("open-ai-chat", handleCustomEvent);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("open-ai-chat", handleCustomEvent);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSubmit = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: userMessage.content }),
            });

            const data = await res.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.response || "Sorry, I couldn't process that request.",
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: "⚠️ Failed to connect. Please try again.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const clearChat = () => setMessages([]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    backdropFilter: "blur(4px)",
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    paddingTop: "15vh",
                    paddingLeft: "16px",
                    paddingRight: "16px",
                }}
                onClick={() => setIsOpen(false)}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 500 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: "100%",
                        maxWidth: "520px",
                        backgroundColor: "var(--notion-bg)",
                        borderRadius: "12px",
                        boxShadow: "0 24px 48px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--notion-border)",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        maxHeight: "70vh",
                    }}
                >
                    {/* Header - Notion Style */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "16px 20px",
                            borderBottom: "1px solid var(--notion-divider)",
                            gap: "12px",
                        }}
                    >
                        <div
                            style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "6px",
                                backgroundColor: "var(--notion-bg-tertiary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Sparkles size={14} style={{ color: "var(--notion-text-secondary)" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--notion-text)" }}>
                                Kurly AI
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--notion-text-muted)" }}>
                                Has access to your tasks, leaves & data
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "2px" }}>
                            {messages.length > 0 && (
                                <button
                                    onClick={clearChat}
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
                                    title="Clear chat"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
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
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Messages - Notion Style */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: "auto",
                            padding: "12px 16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            minHeight: "200px",
                        }}
                    >
                        {messages.length === 0 ? (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "100%",
                                    gap: "8px",
                                    color: "var(--notion-text-muted)",
                                    padding: "24px",
                                }}
                            >
                                <div style={{ fontSize: "13px", textAlign: "center", lineHeight: 1.5 }}>
                                    Ask about your tasks, leaves, attendance,<br />or anything in your dashboard
                                </div>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        display: "flex",
                                        gap: "12px",
                                        alignItems: "flex-start",
                                        padding: "4px 0",
                                    }}
                                >
                                    {/* Avatar */}
                                    <div
                                        style={{
                                            width: "20px",
                                            height: "20px",
                                            marginTop: "3px",
                                            borderRadius: "3px",
                                            backgroundColor: msg.role === "user"
                                                ? "transparent"
                                                : "transparent",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "16px",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {msg.role === "user" ? "👤" : "✨"}
                                    </div>
                                    {/* Message */}
                                    <div
                                        style={{
                                            flex: 1,
                                            fontSize: "14px",
                                            lineHeight: "1.6",
                                            color: "var(--notion-text)",
                                            whiteSpace: "pre-wrap",
                                            fontWeight: msg.role === "user" ? 500 : 400,
                                        }}
                                    >
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))
                        )}

                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                }}
                            >
                                <div
                                    style={{
                                        width: "24px",
                                        height: "24px",
                                        borderRadius: "4px",
                                        backgroundColor: "var(--notion-bg-tertiary)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "12px",
                                    }}
                                >
                                    ✨
                                </div>
                                <motion.div
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    style={{ fontSize: "14px", color: "var(--notion-text-muted)" }}
                                >
                                    Thinking...
                                </motion.div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input - Notion Style */}
                    <div
                        style={{
                            padding: "12px 16px",
                            borderTop: "1px solid var(--notion-divider)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask Kurly AI..."
                            disabled={isLoading}
                            style={{
                                flex: 1,
                                background: "transparent",
                                border: "none",
                                padding: "8px 0",
                                fontSize: "14px",
                                color: "var(--notion-text)",
                                outline: "none",
                            }}
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={!input.trim() || isLoading}
                            style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "var(--radius-sm)",
                                border: "none",
                                background: input.trim() && !isLoading
                                    ? "var(--notion-text)"
                                    : "var(--notion-bg-tertiary)",
                                color: input.trim() && !isLoading
                                    ? "var(--notion-bg)"
                                    : "var(--notion-text-muted)",
                                cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s",
                            }}
                        >
                            <Send size={14} />
                        </button>
                    </div>

                    {/* Footer - Notion Style */}
                    <div
                        style={{
                            padding: "8px 16px",
                            borderTop: "1px solid var(--notion-divider)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "12px",
                            fontSize: "11px",
                            color: "var(--notion-text-muted)",
                        }}
                    >
                        <span>
                            <kbd style={{
                                padding: "2px 5px",
                                backgroundColor: "var(--notion-bg-tertiary)",
                                borderRadius: "3px",
                                fontSize: "10px",
                            }}>
                                Ctrl + .
                            </kbd>
                            {" "}toggle
                        </span>
                        <span>
                            <kbd style={{
                                padding: "2px 5px",
                                backgroundColor: "var(--notion-bg-tertiary)",
                                borderRadius: "3px",
                                fontSize: "10px",
                            }}>
                                ↵
                            </kbd>
                            {" "}send
                        </span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
