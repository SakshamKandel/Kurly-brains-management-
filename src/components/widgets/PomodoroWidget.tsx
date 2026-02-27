"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";

export default function PomodoroWidget() {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<"work" | "break">("work");

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (mode === "work") {
                setMode("break");
                setTimeLeft(5 * 60);
            } else {
                setMode("work");
                setTimeLeft(25 * 60);
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode]);

    const toggle = () => setIsActive(!isActive);
    const reset = () => {
        setIsActive(false);
        setTimeLeft(mode === "work" ? 25 * 60 : 5 * 60);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const progress = mode === "work"
        ? ((25 * 60 - timeLeft) / (25 * 60)) * 100
        : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

    return (
        <div className="h-full w-full flex flex-col items-center justify-between p-6 relative overflow-hidden group">
            {/* Background Accent */}
            <div className={`absolute top-0 left-0 h-[2px] w-full bg-[var(--notion-bg-tertiary)]`}>
                <div
                    className={`h-full transition-all duration-1000 ease-linear ${mode === 'work' ? 'bg-[var(--brand-blue)]' : 'bg-[var(--notion-green)]'}`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="w-full flex justify-between items-center mb-2">
                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] ${mode === 'work' ? 'text-[var(--brand-blue)]' : 'text-[var(--notion-green)]'}`}>
                    <Timer size={14} />
                    <span>{mode === "work" ? "Focus" : "Break"}</span>
                </div>
            </div>

            <div className="relative flex-1 flex items-center justify-center w-full">
                <div className={`text-[4.5rem] font-extralight tracking-tighter leading-none transition-colors duration-500 ${isActive ? 'text-[var(--notion-text)]' : 'text-[var(--notion-text-muted)]'}`}>
                    {formatTime(timeLeft)}
                </div>
            </div>

            <div className="w-full justify-center flex items-center gap-4 mt-2">
                <button
                    onClick={toggle}
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${isActive ? 'bg-[var(--notion-bg-tertiary)] text-[var(--notion-text)] hover:bg-[var(--notion-border)]' : 'bg-[var(--notion-text)] text-[var(--notion-bg)] hover:scale-105'}`}
                >
                    {isActive ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-1" />}
                </button>
                <button
                    onClick={reset}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--notion-bg-tertiary)] text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-border)] transition-all duration-300"
                >
                    <RotateCcw size={14} />
                </button>
            </div>
        </div>
    );
}
