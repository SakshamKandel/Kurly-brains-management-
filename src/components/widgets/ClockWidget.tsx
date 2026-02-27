"use client";

import { useState, useEffect } from "react";
import { Globe, Settings, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TIMEZONES = [
    { label: "Local Time", zone: "local" },
    { label: "New York (USA)", zone: "America/New_York" },
    { label: "London (UK)", zone: "Europe/London" },
    { label: "Tokyo (Japan)", zone: "Asia/Tokyo" }
];

export default function ClockWidget() {
    const [time, setTime] = useState(new Date());
    const [selectedZone, setSelectedZone] = useState(TIMEZONES[0]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const filteredZones = TIMEZONES.filter(tz =>
        tz.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getTimeString = (date: Date, zone: string) => {
        if (zone === "local") return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        try {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: zone });
        } catch (e) {
            return "--:--";
        }
    };

    const getDateString = (date: Date, zone: string) => {
        if (zone === "local") return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
        try {
            return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', timeZone: zone });
        } catch (e) {
            return "";
        }
    };

    return (
        <div className="relative h-full w-full overflow-hidden group">
            {/* Front Face (Clock) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                {/* Micro Label */}
                <div className="flex items-center gap-1.5 text-[var(--brand-cyan)] text-[9px] font-bold uppercase tracking-[0.3em] mb-4">
                    <Globe size={10} />
                    <span>{selectedZone.label}</span>
                </div>

                {/* Massive Time */}
                <div className="text-[4rem] sm:text-[5rem] font-extralight tracking-tighter leading-none text-[var(--notion-text)] mb-3 transition-colors duration-1000 group-hover:text-white">
                    {getTimeString(time, selectedZone.zone)}
                </div>

                {/* Date String */}
                <div className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--notion-text-muted)]">
                    {getDateString(time, selectedZone.zone)}
                </div>

                {/* Decorative & Actions */}
                <div className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => {
                            setIsSettingsOpen(true);
                            setSearchQuery("");
                        }}
                        className="text-[var(--notion-text-muted)] hover:text-[var(--brand-cyan)] transition-colors"
                        title="Change Timezone"
                    >
                        <Settings size={14} />
                    </button>
                </div>
            </div>

            {/* Back Face (Settings) */}
            <AnimatePresence>
                {isSettingsOpen && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute inset-0 bg-[var(--notion-bg-secondary)] border-t border-[var(--notion-border)] z-20 flex flex-col p-4"
                    >
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[var(--notion-border)]">
                            <Search size={14} className="text-[var(--notion-text-muted)]" />
                            <input
                                autoFocus
                                className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--notion-text)] placeholder-[var(--notion-text-muted)]"
                                placeholder="Search city..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button onClick={() => setIsSettingsOpen(false)}>
                                <X size={14} className="text-[var(--notion-text-muted)] hover:text-[var(--notion-text)]" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 dashboard-scrollbar">
                            {filteredZones.length === 0 ? (
                                <div className="text-center py-4 text-xs text-[var(--notion-text-muted)]">
                                    No results found.
                                </div>
                            ) : (
                                filteredZones.map((tz) => (
                                    <button
                                        key={tz.zone + tz.label}
                                        onClick={() => {
                                            setSelectedZone(tz);
                                            setIsSettingsOpen(false);
                                        }}
                                        className={`
                                            w-full text-left px-2 py-2 rounded text-xs transition-colors flex items-center justify-between
                                            ${selectedZone.zone === tz.zone
                                                ? 'bg-[var(--notion-bg-tertiary)] text-[var(--brand-cyan)] font-medium'
                                                : 'text-[var(--notion-text)] hover:bg-[var(--notion-bg-tertiary)]'}
                                        `}
                                    >
                                        <span className="truncate">{tz.label}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
