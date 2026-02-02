"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function PomodoroWidget() {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<"focus" | "break">("focus");

    // Audio ref (optional, simple beep)
    // const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            // Auto-switch mode or just stop
            if (mode === "focus") {
                setMode("break");
                setTimeLeft(5 * 60);
            } else {
                setMode("focus");
                setTimeLeft(25 * 60);
            }
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === "focus" ? 25 * 60 : 5 * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{
            background: "var(--notion-bg-secondary)",
            border: "1px solid var(--notion-border)",
            borderRadius: "8px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px"
        }}>
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                color: "var(--notion-text-muted)",
                textTransform: "uppercase",
                fontWeight: 600,
                letterSpacing: "0.05em",
                alignSelf: "flex-start"
            }}>
                <Clock size={12} />
                Pomodoro
            </div>

            <div style={{
                fontSize: "48px",
                fontWeight: 700,
                color: "var(--notion-text)",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1
            }}>
                {formatTime(timeLeft)}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
                <button
                    onClick={toggleTimer}
                    style={{
                        background: isActive ? "var(--notion-bg-hover)" : "var(--notion-text)",
                        color: isActive ? "var(--notion-text)" : "var(--notion-bg)",
                        border: "none",
                        borderRadius: "6px",
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    {isActive ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
                </button>
                <button
                    onClick={resetTimer}
                    style={{
                        background: "transparent",
                        border: "1px solid var(--notion-border)",
                        color: "var(--notion-text-muted)",
                        borderRadius: "6px",
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
                    }}
                    className="hover-bg"
                >
                    <RotateCcw size={14} />
                </button>
            </div>

            <div style={{ display: "flex", gap: "4px", background: "var(--notion-bg-tertiary)", padding: "2px", borderRadius: "6px" }}>
                <button
                    onClick={() => { setMode("focus"); setTimeLeft(25 * 60); setIsActive(false); }}
                    style={{
                        padding: "4px 12px",
                        fontSize: "12px",
                        background: mode === "focus" ? "var(--notion-bg)" : "transparent",
                        color: mode === "focus" ? "var(--notion-text)" : "var(--notion-text-muted)",
                        border: "none",
                        borderRadius: "4px",
                        boxShadow: mode === "focus" ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                        cursor: "pointer"
                    }}
                >
                    Focus
                </button>
                <button
                    onClick={() => { setMode("break"); setTimeLeft(5 * 60); setIsActive(false); }}
                    style={{
                        padding: "4px 12px",
                        fontSize: "12px",
                        background: mode === "break" ? "var(--notion-bg)" : "transparent",
                        color: mode === "break" ? "var(--notion-text)" : "var(--notion-text-muted)",
                        border: "none",
                        borderRadius: "4px",
                        boxShadow: mode === "break" ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                        cursor: "pointer"
                    }}
                >
                    Break
                </button>
            </div>
        </div>
    );
}
