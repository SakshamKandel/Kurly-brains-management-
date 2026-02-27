"use client";

import { useState, useEffect } from "react";
import { StickyNote, Pencil } from "lucide-react";

export default function QuickNotesWidget() {
    const [note, setNote] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("quickNote");
        if (saved) setNote(saved);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newVal = e.target.value;
        setNote(newVal);
        localStorage.setItem("quickNote", newVal);
    };

    return (
        <div className="h-full w-full flex flex-col relative overflow-hidden group bg-[var(--notion-bg-secondary)]">
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-1 transition-colors duration-500 ${isFocused ? 'bg-[#eab308]' : 'bg-[#eab308]/20'}`}></div>

            <div className="flex items-center justify-between p-6 pb-2">
                <div className="flex items-center gap-2 text-[#eab308] opacity-80">
                    <StickyNote size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Quick Note</span>
                </div>
                <Pencil size={12} className={`transition-opacity duration-300 ${isFocused ? 'opacity-100 text-[#eab308]' : 'opacity-0'}`} />
            </div>

            <div className="flex-1 p-6 pt-2">
                <textarea
                    value={note}
                    onChange={handleChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Jot down a quick thought..."
                    className="w-full h-full bg-transparent border-none resize-none outline-none text-[var(--notion-text)] placeholder-[var(--notion-text-muted)] font-extralight text-sm leading-relaxed dashboard-scrollbar"
                />
            </div>

            {/* Subtle background icon */}
            <StickyNote size={120} className="absolute -bottom-6 -right-6 text-[#eab308] opacity-[0.02] pointer-events-none rotate-12" />
        </div>
    );
}
