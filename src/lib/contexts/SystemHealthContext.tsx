"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type HealthState = "blooming" | "neutral" | "decaying" | "critical";

interface SystemHealthContextType {
    entropy: number; // 0-100
    healthState: HealthState;
    setEntropy: (score: number) => void;
}

const SystemHealthContext = createContext<SystemHealthContextType | null>(null);

export function useSystemHealth() {
    const context = useContext(SystemHealthContext);
    if (!context) throw new Error("useSystemHealth must be used within SystemHealthProvider");
    return context;
}

export function SystemHealthProvider({ children }: { children: ReactNode }) {
    const [entropy, setEntropy] = useState(20); // Default to neutral/healthy-ish
    const [healthState, setHealthState] = useState<HealthState>("neutral");

    // Calculate health state based on entropy
    useEffect(() => {
        if (entropy <= 10) setHealthState("blooming");
        else if (entropy <= 40) setHealthState("neutral");
        else if (entropy <= 70) setHealthState("decaying");
        else setHealthState("critical");
    }, [entropy]);

    return (
        <SystemHealthContext.Provider value={{ entropy, healthState, setEntropy }}>
            {children}
        </SystemHealthContext.Provider>
    );
}
