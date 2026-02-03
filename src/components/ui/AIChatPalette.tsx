"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X, Loader2, Trash2, Mic, Globe, Square } from "lucide-react";
import { useSpeechRecognition, SpeechLanguage } from "@/lib/hooks/useSpeechRecognition";

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
    const [voiceLang, setVoiceLang] = useState<SpeechLanguage>("en-US");
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Voice Support
    const { isListening, transcript, error: voiceError, startListening, stopListening, hasRecognitionSupport } = useSpeechRecognition();
    const voiceErrorText = (() => {
        if (!voiceError) return null;
        switch (voiceError) {
            case "network":
                return "Network error (check internet)";
            case "offline":
                return "Offline";
            case "permission":
                return "Mic blocked";
            case "service-not-allowed":
                return "Speech service blocked";
            case "insecure-context":
                return "Use HTTPS or localhost";
            case "unsupported":
                return "Speech not supported";
            default:
                return "Speech error";
        }
    })();

    // Auto-fill input when transcript changes
    useEffect(() => {
        if (transcript) {
            setInput(transcript);
        }
    }, [transcript]);

    useEffect(() => {
        const lang = navigator.language || "en-US";
        if (lang.toLowerCase().startsWith("ne")) {
            setVoiceLang("ne-NP");
        } else if (lang.toLowerCase().startsWith("hi")) {
            setVoiceLang("hi-IN");
        } else {
            setVoiceLang("en-US");
        }
    }, []);

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

        console.log("AIChatPalette: Version CENTERED loaded");
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
            inputRef.current.style.height = "auto";
            inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
        }
    }, [isOpen]);

    const submitPrompt = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) return;
        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: text.trim(),
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
    }, [isLoading]);

    const handleSubmit = useCallback(async () => {
        if (!input.trim() || isLoading) return;
        await submitPrompt(input);
    }, [input, isLoading, submitPrompt]);

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
                transition={{ duration: 0.2 }}
                style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    backdropFilter: "blur(8px)",
                    zIndex: 9999,
                    display: "grid",
                    placeItems: "center",
                    padding: "16px",
                }}
                onClick={() => setIsOpen(false)}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: "spring", damping: 30, stiffness: 350 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: "100%",
                        maxWidth: "600px",
                        backgroundColor: "#1A1A1A",
                        border: "1px solid #333",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        maxHeight: "80vh",
                        fontFamily: "var(--font-sans)",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "16px 20px",
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                            justifyContent: "space-between",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "8px",
                                    backgroundColor: "#2d2d2d",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: "1px solid #404040",
                                }}
                            >
                                <Sparkles size={16} color="#e5e5e5" />
                            </div>
                            <div>
                                <div style={{ fontSize: "15px", fontWeight: 600, color: "#fff" }}>
                                    Kurly AI
                                </div>
                                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                                    Your personal dashboard assistant
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "4px" }}>
                            {messages.length > 0 && (
                                <button
                                    onClick={clearChat}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        padding: "8px",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        color: "rgba(255,255,255,0.4)",
                                        display: "flex",
                                        transition: "all 0.2s",
                                    }}
                                    className="hover:bg-white/10 hover:text-white"
                                    title="Clear chat"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    padding: "8px",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    color: "rgba(255,255,255,0.4)",
                                    display: "flex",
                                    transition: "all 0.2s",
                                }}
                                className="hover:bg-white/10 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: "auto",
                            padding: "20px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                            minHeight: "300px",
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
                                    gap: "12px",
                                    color: "rgba(255,255,255,0.4)",
                                    padding: "40px",
                                    textAlign: "center"
                                }}
                            >
                                <div style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "12px",
                                    background: "rgba(255,255,255,0.05)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: "4px"
                                }}>
                                    <Sparkles size={24} style={{ opacity: 0.5 }} />
                                </div>
                                <div style={{ fontSize: "14px", lineHeight: 1.6, maxWidth: "280px" }}>
                                    Ask me about your tasks, pending invoices, team availability, or anything else in your dashboard.
                                </div>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        display: "flex",
                                        gap: "12px",
                                        alignItems: "flex-start",
                                        flexDirection: msg.role === "user" ? "row-reverse" : "row",
                                    }}
                                >
                                    {/* Avatar */}
                                    <div
                                        style={{
                                            width: "28px",
                                            height: "28px",
                                            borderRadius: "8px",
                                            backgroundColor: msg.role === "user" ? "#404040" : "#2d2d2d",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                            marginTop: "2px",
                                            boxShadow: "none",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                        }}
                                    >
                                        {msg.role === "user" ? (
                                            <div style={{ fontSize: "12px", fontWeight: "bold", color: "white" }}>U</div>
                                        ) : (
                                            <Sparkles size={14} color="#a78bfa" />
                                        )}
                                    </div>
                                    {/* Bubble */}
                                    < div
                                        style={{
                                            maxWidth: "85%",
                                            fontSize: "14px",
                                            lineHeight: "1.6",
                                            color: "rgba(255,255,255,0.9)",
                                            backgroundColor: msg.role === "user" ? "#333" : "rgba(255,255,255,0.05)",
                                            padding: "10px 14px",
                                            borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                                            whiteSpace: "pre-wrap",
                                            boxShadow: "none",
                                            border: "1px solid rgba(255,255,255,0.05)",
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
                                    gap: "12px",
                                    alignItems: "flex-start",
                                }}
                            >
                                <div
                                    style={{
                                        width: "28px",
                                        height: "28px",
                                        borderRadius: "8px",
                                        backgroundColor: "#2d2d2d",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                    }}
                                >
                                    <Sparkles size={14} color="#888" />
                                </div>
                                <div style={{
                                    padding: "10px 14px",
                                    backgroundColor: "rgba(255,255,255,0.05)",
                                    borderRadius: "4px 16px 16px 16px",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                }}>
                                    <div style={{ display: "flex", gap: "4px", alignItems: "center", height: "14px" }}>
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                                            style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#888" }}
                                        />
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                            style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#888" }}
                                        />
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                            style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#888" }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div
                        style={{
                            padding: "16px 20px",
                            borderTop: "1px solid rgba(255,255,255,0.08)",
                            backgroundColor: "rgba(0,0,0,0.2)",
                        }}
                    >
                        <div style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: "10px",
                            backgroundColor: "rgba(255, 255, 255, 0.07)",
                            padding: "6px 6px 6px 16px",
                            borderRadius: "12px",
                            border: "1px solid rgba(255,255,255,0.08)",
                            transition: "all 0.2s",
                        }}>
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    const el = e.currentTarget;
                                    el.style.height = "auto";
                                    el.style.height = `${el.scrollHeight}px`;
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Kurly AI..."
                                disabled={isLoading}
                                style={{
                                    flex: 1,
                                    background: "transparent",
                                    border: "none",
                                    fontSize: "14px",
                                    color: "#fff",
                                    outline: "none",
                                    padding: "4px 0",
                                    resize: "none",
                                    minHeight: "24px",
                                    maxHeight: "120px",
                                    overflowY: "auto",
                                }}
                                rows={1}
                            />

                            {/* Voice Controls */}
                            {hasRecognitionSupport && (
                                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginRight: "4px" }}>
                                    {isListening ? (
                                        <div style={{
                                            display: "flex", alignItems: "center", gap: "8px",
                                            background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)",
                                            borderRadius: "20px", padding: "4px 8px", height: "32px"
                                        }}>
                                            {/* Waveform Visualizer */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "12px" }}>
                                                {[1, 2, 3, 4, 5].map((i) => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{ height: ["20%", "100%", "20%"] }}
                                                        transition={{
                                                            duration: 0.5,
                                                            repeat: Infinity,
                                                            delay: i * 0.1,
                                                            ease: "easeInOut"
                                                        }}
                                                        style={{
                                                            width: "3px",
                                                            background: "#ef4444",
                                                            borderRadius: "2px"
                                                        }}
                                                    />
                                                ))}
                                            </div>

                                            <button
                                                onClick={stopListening}
                                                style={{
                                                    background: "transparent",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    color: "#ef4444",
                                                    padding: "2px",
                                                    display: "flex"
                                                }}
                                                title="Stop Listening"
                                            >
                                                <Square size={12} fill="#ef4444" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            {voiceErrorText && (
                                                <span style={{
                                                    fontSize: "11px",
                                                    color: "#ef4444",
                                                    marginRight: "8px",
                                                    background: "rgba(239,68,68,0.1)",
                                                    padding: "2px 6px",
                                                    borderRadius: "4px"
                                                }}>
                                                    {voiceErrorText}
                                                </span>
                                            )}
                                            <button
                                                onClick={() => startListening(voiceLang)}
                                                style={{
                                                    background: "transparent",
                                                    border: "none",
                                                    padding: "6px",
                                                    borderRadius: "6px",
                                                    cursor: "pointer",
                                                    color: "rgba(255,255,255,0.5)",
                                                    display: "flex",
                                                    transition: "all 0.2s",
                                                }}
                                                className="hover:bg-white/5 hover:text-white"
                                                title="Speak"
                                            >
                                                <Mic size={16} />
                                            </button>
                                            <button
                                                onClick={() => setVoiceLang((prev) => {
                                                    if (prev === "en-US") return "ne-NP";
                                                    if (prev === "ne-NP") return "hi-IN";
                                                    return "en-US";
                                                })}
                                                style={{
                                                    background: "transparent",
                                                    border: "1px solid rgba(255,255,255,0.15)",
                                                    padding: "4px 6px",
                                                    borderRadius: "6px",
                                                    cursor: "pointer",
                                                    color: "rgba(255,255,255,0.6)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                    marginLeft: "6px"
                                                }}
                                                className="hover:bg-white/5 hover:text-white"
                                                title={`Language: ${voiceLang}`}
                                            >
                                                <Globe size={12} />
                                                <span style={{ fontSize: "10px", fontWeight: 600 }}>
                                                    {voiceLang === "ne-NP" ? "NE" : voiceLang === "hi-IN" ? "HI" : "EN"}
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={!input.trim() || isLoading}
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "8px",
                                    border: "none",
                                    background: input.trim() && !isLoading
                                        ? "#fff"
                                        : "rgba(255,255,255,0.1)",
                                    color: input.trim() && !isLoading
                                        ? "#000"
                                        : "rgba(255,255,255,0.3)",
                                    cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s",
                                }}
                            >
                                {isLoading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Send size={16} />
                                )}
                            </button>
                        </div>
                        <div style={{
                            marginTop: "12px",
                            display: "flex",
                            justifyContent: "center",
                            gap: "16px",
                            fontSize: "11px",
                            color: "rgba(255,255,255,0.3)",
                        }}>
                            <span><span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Ctrl + .</span> to open</span>
                            <span><span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>↵</span> to send</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div >
        </AnimatePresence >
    );
}
