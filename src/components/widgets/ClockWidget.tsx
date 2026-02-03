"use client";

import { useState, useEffect } from "react";
import { Clock, Globe, Settings, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TIMEZONES = [
    { label: "Local Time", zone: "local" },
    { label: "Accra (Ghana)", zone: "Africa/Accra" },
    { label: "Addis Ababa (Ethiopia)", zone: "Africa/Addis_Ababa" },
    { label: "Adelaide (Australia)", zone: "Australia/Adelaide" },
    { label: "Algiers (Algeria)", zone: "Africa/Algiers" },
    { label: "Almaty (Kazakhstan)", zone: "Asia/Almaty" },
    { label: "Amman (Jordan)", zone: "Asia/Amman" },
    { label: "Amsterdam (Netherlands)", zone: "Europe/Amsterdam" },
    { label: "Anchorage (USA)", zone: "America/Anchorage" },
    { label: "Ankara (Turkey)", zone: "Europe/Istanbul" },
    { label: "Antananarivo (Madagascar)", zone: "Indian/Antananarivo" },
    { label: "Asuncion (Paraguay)", zone: "America/Asuncion" },
    { label: "Athens (Greece)", zone: "Europe/Athens" },
    { label: "Auckland (New Zealand)", zone: "Pacific/Auckland" },
    { label: "Baghdad (Iraq)", zone: "Asia/Baghdad" },
    { label: "Bangkok (Thailand)", zone: "Asia/Bangkok" },
    { label: "Barcelona (Spain)", zone: "Europe/Madrid" },
    { label: "Beijing (China)", zone: "Asia/Shanghai" },
    { label: "Beirut (Lebanon)", zone: "Asia/Beirut" },
    { label: "Belgrade (Serbia)", zone: "Europe/Belgrade" },
    { label: "Berlin (Germany)", zone: "Europe/Berlin" },
    { label: "Bogota (Colombia)", zone: "America/Bogota" },
    { label: "Boston (USA)", zone: "America/New_York" },
    { label: "Brasilia (Brazil)", zone: "America/Sao_Paulo" },
    { label: "Brussels (Belgium)", zone: "Europe/Brussels" },
    { label: "Bucharest (Romania)", zone: "Europe/Bucharest" },
    { label: "Budapest (Hungary)", zone: "Europe/Budapest" },
    { label: "Buenos Aires (Argentina)", zone: "America/Argentina/Buenos_Aires" },
    { label: "Cairo (Egypt)", zone: "Africa/Cairo" },
    { label: "Calgary (Canada)", zone: "America/Edmonton" },
    { label: "Canberra (Australia)", zone: "Australia/Sydney" },
    { label: "Cape Town (South Africa)", zone: "Africa/Johannesburg" },
    { label: "Caracas (Venezuela)", zone: "America/Caracas" },
    { label: "Casablanca (Morocco)", zone: "Africa/Casablanca" },
    { label: "Chicago (USA)", zone: "America/Chicago" },
    { label: "Colombo (Sri Lanka)", zone: "Asia/Colombo" },
    { label: "Copenhagen (Denmark)", zone: "Europe/Copenhagen" },
    { label: "Dallas (USA)", zone: "America/Chicago" },
    { label: "Dar es Salaam (Tanzania)", zone: "Africa/Dar_es_Salaam" },
    { label: "Darwin (Australia)", zone: "Australia/Darwin" },
    { label: "Denver (USA)", zone: "America/Denver" },
    { label: "Dhaka (Bangladesh)", zone: "Asia/Dhaka" },
    { label: "Doha (Qatar)", zone: "Asia/Qatar" },
    { label: "Dubai (UAE)", zone: "Asia/Dubai" },
    { label: "Dublin (Ireland)", zone: "Europe/Dublin" },
    { label: "Edmonton (Canada)", zone: "America/Edmonton" },
    { label: "Frankfurt (Germany)", zone: "Europe/Berlin" },
    { label: "Guatemala City (Guatemala)", zone: "America/Guatemala" },
    { label: "Halifax (Canada)", zone: "America/Halifax" },
    { label: "Hanoi (Vietnam)", zone: "Asia/Bangkok" },
    { label: "Harare (Zimbabwe)", zone: "Africa/Harare" },
    { label: "Havana (Cuba)", zone: "America/Havana" },
    { label: "Helsinki (Finland)", zone: "Europe/Helsinki" },
    { label: "Hong Kong", zone: "Asia/Hong_Kong" },
    { label: "Honolulu (USA)", zone: "Pacific/Honolulu" },
    { label: "Houston (USA)", zone: "America/Chicago" },
    { label: "Indianapolis (USA)", zone: "America/Indiana/Indianapolis" },
    { label: "Islamabad (Pakistan)", zone: "Asia/Karachi" },
    { label: "Istanbul (Turkey)", zone: "Europe/Istanbul" },
    { label: "Jakarta (Indonesia)", zone: "Asia/Jakarta" },
    { label: "Jerusalem (Israel)", zone: "Asia/Jerusalem" },
    { label: "Johannesburg (South Africa)", zone: "Africa/Johannesburg" },
    { label: "Kabul (Afghanistan)", zone: "Asia/Kabul" },
    { label: "Kampala (Uganda)", zone: "Africa/Kampala" },
    { label: "Karachi (Pakistan)", zone: "Asia/Karachi" },
    { label: "Kathmandu (Nepal)", zone: "Asia/Kathmandu" },
    { label: "Khartoum (Sudan)", zone: "Africa/Khartoum" },
    { label: "Kingston (Jamaica)", zone: "America/Jamaica" },
    { label: "Kinshasa (DR Congo)", zone: "Africa/Kinshasa" },
    { label: "Kuala Lumpur (Malaysia)", zone: "Asia/Kuala_Lumpur" },
    { label: "Kuwait City (Kuwait)", zone: "Asia/Kuwait" },
    { label: "Kyiv (Ukraine)", zone: "Europe/Kiev" },
    { label: "Lagos (Nigeria)", zone: "Africa/Lagos" },
    { label: "La Paz (Bolivia)", zone: "America/La_Paz" },
    { label: "Lima (Peru)", zone: "America/Lima" },
    { label: "Lisbon (Portugal)", zone: "Europe/Lisbon" },
    { label: "London (UK)", zone: "Europe/London" },
    { label: "Los Angeles (USA)", zone: "America/Los_Angeles" },
    { label: "Madrid (Spain)", zone: "Europe/Madrid" },
    { label: "Manila (Philippines)", zone: "Asia/Manila" },
    { label: "Melbourne (Australia)", zone: "Australia/Melbourne" },
    { label: "Mexico City (Mexico)", zone: "America/Mexico_City" },
    { label: "Miami (USA)", zone: "America/New_York" },
    { label: "Minneapolis (USA)", zone: "America/Chicago" },
    { label: "Minsk (Belarus)", zone: "Europe/Minsk" },
    { label: "Montevideo (Uruguay)", zone: "America/Montevideo" },
    { label: "Montreal (Canada)", zone: "America/Toronto" },
    { label: "Moscow (Russia)", zone: "Europe/Moscow" },
    { label: "Mumbai (India)", zone: "Asia/Kolkata" },
    { label: "Nairobi (Kenya)", zone: "Africa/Nairobi" },
    { label: "New Delhi (India)", zone: "Asia/Kolkata" },
    { label: "New Orleans (USA)", zone: "America/Chicago" },
    { label: "New York (USA)", zone: "America/New_York" },
    { label: "Oslo (Norway)", zone: "Europe/Oslo" },
    { label: "Ottawa (Canada)", zone: "America/Toronto" },
    { label: "Paris (France)", zone: "Europe/Paris" },
    { label: "Perth (Australia)", zone: "Australia/Perth" },
    { label: "Philadelphia (USA)", zone: "America/New_York" },
    { label: "Phoenix (USA)", zone: "America/Phoenix" },
    { label: "Prague (Czech Republic)", zone: "Europe/Prague" },
    { label: "Reykjavik (Iceland)", zone: "Atlantic/Reykjavik" },
    { label: "Rio de Janeiro (Brazil)", zone: "America/Sao_Paulo" },
    { label: "Riyadh (Saudi Arabia)", zone: "Asia/Riyadh" },
    { label: "Rome (Italy)", zone: "Europe/Rome" },
    { label: "Salt Lake City (USA)", zone: "America/Denver" },
    { label: "San Francisco (USA)", zone: "America/Los_Angeles" },
    { label: "San Juan (Puerto Rico)", zone: "America/Puerto_Rico" },
    { label: "Santiago (Chile)", zone: "America/Santiago" },
    { label: "Santo Domingo (Dominican Republic)", zone: "America/Santo_Domingo" },
    { label: "Sao Paulo (Brazil)", zone: "America/Sao_Paulo" },
    { label: "Seattle (USA)", zone: "America/Los_Angeles" },
    { label: "Seoul (South Korea)", zone: "Asia/Seoul" },
    { label: "Shanghai (China)", zone: "Asia/Shanghai" },
    { label: "Singapore", zone: "Asia/Singapore" },
    { label: "Sofia (Bulgaria)", zone: "Europe/Sofia" },
    { label: "Stockholm (Sweden)", zone: "Europe/Stockholm" },
    { label: "Sydney (Australia)", zone: "Australia/Sydney" },
    { label: "Taipei (Taiwan)", zone: "Asia/Taipei" },
    { label: "Tallinn (Estonia)", zone: "Europe/Tallinn" },
    { label: "Tehran (Iran)", zone: "Asia/Tehran" },
    { label: "Tel Aviv (Israel)", zone: "Asia/Tel_Aviv" },
    { label: "Tokyo (Japan)", zone: "Asia/Tokyo" },
    { label: "Toronto (Canada)", zone: "America/Toronto" },
    { label: "Vancouver (Canada)", zone: "America/Vancouver" },
    { label: "Vienna (Austria)", zone: "Europe/Vienna" },
    { label: "Warsaw (Poland)", zone: "Europe/Warsaw" },
    { label: "Washington DC (USA)", zone: "America/New_York" },
    { label: "Yangon (Myanmar)", zone: "Asia/Yangon" },
    { label: "Zurich (Switzerland)", zone: "Europe/Zurich" }
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
            return date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: zone
            });
        } catch (e) {
            return "--:--";
        }
    };

    const getDateString = (date: Date, zone: string) => {
        if (zone === "local") return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
        try {
            return date.toLocaleDateString([], {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                timeZone: zone
            });
        } catch (e) {
            return "";
        }
    };

    return (
        <div className="relative bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-xl h-[180px] overflow-hidden group">
            {/* Front Face (Clock) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div className="flex flex-col items-center z-10">
                    <div className="flex items-center gap-2 text-[var(--notion-text-muted)] text-[10px] font-bold uppercase tracking-widest mb-2 px-2 py-1 bg-[var(--notion-bg-secondary)] rounded-full text-center">
                        <Globe size={10} />
                        <span className="truncate max-w-[150px]">{selectedZone.label}</span>
                    </div>

                    <div className="text-5xl font-mono font-bold text-[var(--notion-text)] tracking-tighter tabular-nums leading-none mb-1 shadow-sm">
                        {getTimeString(time, selectedZone.zone)}
                    </div>

                    <div className="text-sm font-medium text-[var(--notion-text-secondary)]">
                        {getDateString(time, selectedZone.zone)}
                    </div>
                </div>

                {/* Decorative & Actions */}
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => {
                            setIsSettingsOpen(true);
                            setSearchQuery(""); // clear search on open
                        }}
                        className="p-1.5 hover:bg-[var(--notion-bg-secondary)] rounded text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] transition-colors"
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
                        className="absolute inset-0 bg-[var(--notion-bg)] z-20 flex flex-col p-4"
                    >
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[var(--notion-border)]">
                            <Search size={14} className="text-[var(--notion-text-muted)]" />
                            <input
                                autoFocus
                                className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--notion-text)] placeholder-[var(--notion-text-muted)]"
                                placeholder="Search city or country..."
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
                                            w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between
                                            ${selectedZone.zone === tz.zone
                                                ? 'bg-[var(--notion-blue-bg)] text-[var(--notion-blue)] font-medium'
                                                : 'text-[var(--notion-text)] hover:bg-[var(--notion-bg-secondary)]'}
                                        `}
                                    >
                                        <span className="truncate">{tz.label}</span>
                                        {selectedZone.zone === tz.zone && <div className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
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
