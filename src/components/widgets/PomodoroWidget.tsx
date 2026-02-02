"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Clock, Plus, Minus } from "lucide-react";

export default function PomodoroWidget() {
    // Settings state
    const [focusDuration, setFocusDuration] = useState(25);
    const [breakDuration, setBreakDuration] = useState(5);

    // Timer state
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<"focus" | "break">("focus");

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            // Auto-switch mode
            if (mode === "focus") {
                setMode("break");
                setTimeLeft(breakDuration * 60);
            } else {
                setMode("focus");
                setTimeLeft(focusDuration * 60);
            }
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode, focusDuration, breakDuration]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === "focus" ? focusDuration * 60 : breakDuration * 60);
    };

    const handleModeSwitch = (newMode: "focus" | "break") => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(newMode === "focus" ? focusDuration * 60 : breakDuration * 60);
    };

    const adjustTime = (amount: number) => {
        if (mode === "focus") {
            const newTime = Math.max(1, focusDuration + amount);
            setFocusDuration(newTime);
            if (!isActive) setTimeLeft(newTime * 60);
        } else {
            const newTime = Math.max(1, breakDuration + amount);
            setBreakDuration(newTime);
            if (!isActive) setTimeLeft(newTime * 60);
        }
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
            gap: "12px",
            height: "100%",
            justifyContent: "space-between"
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

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <button
                    onClick={() => adjustTime(-1)}
                    disabled={isActive}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: isActive ? "var(--notion-text-muted)" : "var(--notion-text-secondary)",
                        cursor: isActive ? "not-allowed" : "pointer",
                        opacity: isActive ? 0.3 : 1,
                        padding: "4px"
                    }}
                    className={!isActive ? "hover-scale" : ""}
                >
                    <Minus size={16} />
                </button>

                <div style={{
                    fontSize: "48px",
                    fontWeight: 700,
                    color: "var(--notion-text)",
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1,
                    minWidth: "140px",
                    textAlign: "center"
                }}>
                    {formatTime(timeLeft)}
                </div>

                <button
                    onClick={() => adjustTime(1)}
                    disabled={isActive}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: isActive ? "var(--notion-text-muted)" : "var(--notion-text-secondary)",
                        cursor: isActive ? "not-allowed" : "pointer",
                        opacity: isActive ? 0.3 : 1,
                        padding: "4px"
                    }}
                    className={!isActive ? "hover-scale" : ""}
                >
                    <Plus size={16} />
                </button>
            </div>

            <div style={{ fontSize: "12px", color: "var(--notion-text-muted)", marginTop: "-8px" }}>
                {mode === "focus" ? `Focus: ${focusDuration}m` : `Break: ${breakDuration}m`}
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
                    onClick={() => handleModeSwitch("focus")}
                    style={{
                        padding: "4px 12px",
                        fontSize: "12px",
                        background: mode === "focus" ? "var(--notion-bg)" : "transparent",
                        color: mode === "focus" ? "var(--notion-text)" : "var(--notion-text-muted)",
                        border: "none",
                        borderRadius: "4px",
                        boxShadow: mode === "focus" ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    Focus
                </button>
                <button
                    onClick={() => handleModeSwitch("break")}
                    style={{
                        padding: "4px 12px",
                        fontSize: "12px",
                        background: mode === "break" ? "var(--notion-bg)" : "transparent",
                        color: mode === "break" ? "var(--notion-text)" : "var(--notion-text-muted)",
                        border: "none",
                        borderRadius: "4px",
                        boxShadow: mode === "break" ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    Break
                </button>
            </div>
        </div>
    );
}
