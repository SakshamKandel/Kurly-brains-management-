"use client";

import { useState, useEffect } from "react";
import { StickyNote, Plus, Trash2 } from "lucide-react";

export default function QuickNotesWidget() {
    const [note, setNote] = useState("");

    // In a real app, this would be persisted to DB or localStorage
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
        <div style={{
            background: "#fff9c4", // Post-it yellow color
            borderRadius: "2px", // Slightly sharper corners
            padding: "16px",
            height: "100%",
            minHeight: "220px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            position: "relative",
            overflow: "hidden"
        }}>
            {/* Top Tape Effect (Visual) */}
            <div style={{
                position: "absolute",
                top: "-10px",
                left: "50%",
                transform: "translateX(-50%) rotate(-1deg)",
                width: "40%",
                height: "24px",
                background: "rgba(255,255,255,0.4)",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
            }} />

            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "rgba(0,0,0,0.5)",
                textTransform: "uppercase",
                fontWeight: 600,
                letterSpacing: "0.05em",
                marginBottom: "4px"
            }}>
                <StickyNote size={12} />
                Quick Note
            </div>

            <textarea
                value={note}
                onChange={handleChange}
                placeholder="Type something..."
                style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    resize: "none",
                    outline: "none",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    color: "#333",
                    fontFamily: "'Indie Flower', sans-serif" // Or default
                }}
            />
        </div>
    );
}
