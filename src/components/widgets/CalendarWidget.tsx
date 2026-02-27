"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

export default function CalendarWidget() {
    const [date, setDate] = useState(new Date());

    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const prevMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1));
    const nextMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1));
    const today = () => setDate(new Date());

    const isToday = (d: number) => {
        const now = new Date();
        return d === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    };

    return (
        <div className="h-full w-full flex flex-col p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-[var(--brand-cyan)]" />
                    <span className="text-[12px] uppercase tracking-[0.2em] font-bold text-[var(--notion-text-secondary)]">
                        {monthNames[date.getMonth()]} {date.getFullYear()}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={prevMonth} className="p-1.5 rounded-md text-[var(--notion-text-muted)] hover:text-[var(--brand-cyan)] hover:bg-[var(--notion-bg-tertiary)] transition-colors">
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={today} className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] transition-colors">
                        Today
                    </button>
                    <button onClick={nextMonth} className="p-1.5 rounded-md text-[var(--notion-text-muted)] hover:text-[var(--brand-cyan)] hover:bg-[var(--notion-bg-tertiary)] transition-colors">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div
                className="gap-y-2 flex-1 items-start w-full overflow-hidden"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}
            >
                {/* Weekdays */}
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <div key={`day-${i}`} className="text-center text-[10px] uppercase tracking-widest font-bold text-[var(--notion-text-muted)] mb-2">
                        {d}
                    </div>
                ))}

                {/* Empty Days */}
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-1" />
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const d = i + 1;
                    const active = isToday(d);
                    return (
                        <div key={d} className="flex justify-center p-1">
                            <button
                                className={`
                                    flex items-center justify-center w-8 h-8 rounded-md text-xs transition-all duration-300
                                    ${active
                                        ? 'bg-[var(--brand-cyan)] text-[var(--notion-bg)] font-medium shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                                        : 'text-[var(--notion-text)] font-light hover:bg-[var(--notion-bg-tertiary)] hover:text-[var(--brand-cyan)]'}
                                `}
                            >
                                {d}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
