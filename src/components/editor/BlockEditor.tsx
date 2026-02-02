"use client";

import { useState, useRef, useEffect } from "react";
import {
    Type,
    Heading1,
    Heading2,
    StickyNote,
    Calendar as CalendarIcon,
    Image as ImageIcon,
    Code,
    Square,
    Circle,
    PenTool,
} from "lucide-react";

import InfiniteCanvas from "@/components/canvas/InfiniteCanvas";
import ObjectWrapper from "@/components/canvas/ObjectWrapper";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
interface Block {
    id: string;
    type: string;
    content: any;
    order: number;
    _localId?: string; // Stable internal ID for React keys to prevent unmounting on ID save
}

interface BlockEditorProps {
    pageId: string;
    initialBlocks: Block[];
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------
export default function BlockEditor({ pageId, initialBlocks }: BlockEditorProps) {
    const [blocks, setBlocks] = useState<Block[]>(initialBlocks || []);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

    // Viewport State
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);

    // Initial Center
    useEffect(() => {
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        setPan({ x: viewportW / 2 - 400, y: viewportH / 2 - 300 });
    }, []);

    // -------------------------------------------------------------------------
    // Data Operations
    // -------------------------------------------------------------------------
    // 1. Local Update (Fast, for UI only)
    const updateBlock = (id: string, updates: any) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: { ...b.content, ...updates } } : b));
    };

    // 2. Commit Save (Call on DragEnd / Blur / specific action)
    const saveBlockState = async (id: string, overrides: any = {}) => {
        // Fix: Don't save temp blocks to API yet
        if (id.startsWith("temp-")) return;

        const block = blocks.find(b => b.id === id);
        if (!block) return;

        // Merge current block content with overrides (e.g., final drag position)
        const content = { ...block.content, ...overrides };

        try {
            await fetch(`/api/pages/${pageId}/blocks`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ blocks: [{ id, content }] })
            });
        } catch (e) { console.error("Save failed", e); }
    };

    const addBlock = async (type: string) => {
        const tempId = `temp-${Date.now()}`;

        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        const centerX = ((viewportW / 2) - pan.x) / zoom;
        const centerY = ((viewportH / 2) - pan.y) / zoom;

        // Defaults
        let initialContent: any = { text: "", x: centerX - 100, y: centerY - 50, width: 200, height: "auto" };

        if (type === "sticky_note") initialContent = { ...initialContent, color: "#fcd53f", width: 260, height: 260 };
        if (type === "shape_rect") initialContent = { ...initialContent, width: 200, height: 200, background: "transparent", borderColor: "#fff" };
        if (type === "shape_circle") initialContent = { ...initialContent, width: 200, height: 200, background: "transparent", borderColor: "#fff" };
        if (type === "calendar") initialContent = { ...initialContent, width: 300, height: "auto", date: new Date().toISOString() };
        if (type === "image") initialContent = { ...initialContent, width: 400, height: 300 };
        if (type === "heading1") initialContent = { ...initialContent, width: 400, height: "auto" };
        if (type === "heading1") initialContent = { ...initialContent, width: 400, height: "auto" };
        if (type === "heading2") initialContent = { ...initialContent, width: 400, height: "auto" };
        if (type === "hand_text") initialContent = { ...initialContent, width: 300, height: "auto" };

        const newBlock = { id: tempId, type, content: initialContent, order: blocks.length, _localId: tempId };
        setBlocks(prev => [...prev, newBlock]);
        setActiveBlockId(tempId);

        try {
            const res = await fetch(`/api/pages/${pageId}/blocks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, content: initialContent, order: blocks.length })
            });
            if (res.ok) {
                const created = await res.json();

                // CRITICAL FIX: When replacing temp ID, keep the LATEST content from state
                // (which might have been moved by the user while the API call was in flight)
                setBlocks(prev => prev.map(b => {
                    if (b.id === tempId) {
                        // If content changed (moved), we need to save the NEW position to the NEW ID
                        const hasMoved = b.content.x !== initialContent.x || b.content.y !== initialContent.y;

                        // Preserve the stable _localId so React doesn't unmount the component
                        const finalBlock = { ...created, content: b.content, _localId: b._localId };

                        if (hasMoved) {
                            // Queue a save for the new ID with the current position
                            setTimeout(() => {
                                saveBlockState(created.id, { x: b.content.x, y: b.content.y });
                            }, 50);
                        }
                        return finalBlock;
                    }
                    return b;
                }));
            }
        } catch (e) { console.error(e); }
    };

    const deleteBlock = async (id: string) => {
        setBlocks(prev => prev.filter(b => b.id !== id));
        fetch(`/api/pages/${pageId}/blocks?blockId=${id}`, { method: "DELETE" }).catch(console.error);
    };

    return (
        <div style={{ width: "100%", height: "100vh", background: "#191919", overflow: "hidden", position: "relative" }}>
            {/* Toolbox - Seamless */}
            <div className="prevent-pan" onPointerDown={e => e.stopPropagation()} style={{
                position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", zIndex: 5000,
                display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
                padding: "16px 8px", background: "rgba(0,0,0,0.2)", backdropFilter: "blur(10px)",
                borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)"
            }}>
                <ToolboxItem icon={Type} onClick={() => addBlock("text")} tooltip="Text" />
                <ToolboxItem icon={Heading1} onClick={() => addBlock("heading1")} tooltip="Heading 1" />
                <ToolboxItem icon={Heading2} onClick={() => addBlock("heading2")} tooltip="Heading 2" />
                <ToolboxItem icon={PenTool} onClick={() => addBlock("hand_text")} tooltip="Handwritten Text" />
                <ToolboxItem icon={StickyNote} onClick={() => addBlock("sticky_note")} color="#fcd53f" tooltip="Sticky Note" />
                <ToolboxItem icon={ImageIcon} onClick={() => addBlock("image")} tooltip="Image" />
                <ToolboxItem icon={Code} onClick={() => addBlock("code")} tooltip="Code" />
                {/* Shapes */}
                <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", width: "100%" }} />
                <ToolboxItem icon={Square} onClick={() => addBlock("shape_rect")} tooltip="Rectangle" />
                <ToolboxItem icon={Circle} onClick={() => addBlock("shape_circle")} tooltip="Circle" />
                <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", width: "100%" }} />
                <ToolboxItem icon={CalendarIcon} onClick={() => addBlock("calendar")} tooltip="Calendar" />
            </div>

            <InfiniteCanvas
                pan={pan} setPan={setPan}
                zoom={zoom} setZoom={setZoom}
                onBackgroundClick={() => setActiveBlockId(null)}
            >
                {blocks.map(block => (
                    <ObjectWrapper
                        key={block._localId || block.id} // Stable Key Strategy
                        id={block.id}
                        x={block.content.x}
                        y={block.content.y}
                        width={block.content.width}
                        height={block.content.height || "auto"}
                        isSelected={activeBlockId === block.id}
                        onSelect={() => setActiveBlockId(block.id)}
                        onChange={(changes) => updateBlock(block.id, changes)}
                        onDelete={() => deleteBlock(block.id)}
                        onSave={(overrides) => saveBlockState(block.id, overrides)}
                        isSeamless={block.type === 'text' || block.type === 'heading1' || block.type === 'heading2'}
                    >
                        <BlockRenderer block={block} onChange={(c) => updateBlock(block.id, c)} />
                    </ObjectWrapper>
                ))}
            </InfiniteCanvas>
        </div>
    );
}

// -----------------------------------------------------------------------------
// Sub-Components
// -----------------------------------------------------------------------------

function ToolboxItem({ icon: Icon, onClick, color, tooltip }: any) {
    return (
        <button
            onClick={onClick}
            title={tooltip}
            className="group"
            style={{
                width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "50%",
                cursor: "pointer",
                color: "#fff",
                transition: "all 0.2s"
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = "scale(1.15)";
                e.currentTarget.style.background = color || "rgba(255,255,255,0.15)";
                e.currentTarget.style.boxShadow = `0 0 15px ${color || "rgba(255,255,255,0.3)"}`;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            <Icon size={22} style={{ color: color ? "#000" : "#fff", opacity: color ? 1 : 0.8 }} />
        </button>
    );
}

function BlockRenderer({ block, onChange }: { block: Block; onChange: (c: any) => void }) {
    const commonStyle = { background: "transparent", border: "none", outline: "none", color: "white", width: "100%", height: "100%", fontFamily: "inherit" };

    if (block.type === 'text') {
        return <textarea
            value={block.content.text || ""}
            onChange={e => onChange({ text: e.target.value })}
            style={{ ...commonStyle, resize: "none", fontSize: "16px", lineHeight: "1.5" }}
            placeholder="Type..."
        />;
    }

    if (block.type === 'heading1') {
        return <textarea
            value={block.content.text || ""}
            onChange={e => onChange({ text: e.target.value })}
            style={{ ...commonStyle, resize: "none", fontSize: "48px", fontWeight: "800", lineHeight: "1.1", letterSpacing: "-0.02em" }}
            placeholder="Heading 1"
        />;
    }

    if (block.type === 'heading2') {
        return <textarea
            value={block.content.text || ""}
            onChange={e => onChange({ text: e.target.value })}
            style={{ ...commonStyle, resize: "none", fontSize: "32px", fontWeight: "700", lineHeight: "1.2" }}
            placeholder="Heading 2"
        />;
    }

    if (block.type === 'sticky_note') {
        return (
            <div style={{
                background: block.content.color || "#feff9c", width: "100%", height: "100%", padding: "24px",
                color: "#333", fontFamily: 'var(--font-hand)', fontWeight: "700",
                boxShadow: "2px 4px 15px rgba(0,0,0,0.15)", display: "flex"
            }}>
                <textarea
                    value={block.content.text || ""}
                    onChange={e => onChange({ text: e.target.value })}
                    style={{ ...commonStyle, color: "#333", resize: "none", fontSize: "18px" }}
                    placeholder="Write..."
                />
            </div>
        );
    }

    // Clean Shapes
    if (block.type === 'shape_rect') return <div style={{ border: "2px solid #fff", borderRadius: "8px", width: "100%", height: "100%" }} />;
    if (block.type === 'shape_circle') return <div style={{ border: "2px solid #fff", borderRadius: "50%", width: "100%", height: "100%" }} />;

    if (block.type === 'image') {
        return (
            <div style={{ background: "#222", width: "100%", height: "100%", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #444", overflow: "hidden" }}>
                {block.content.url ? (
                    <img src={block.content.url} alt="User upload" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <div style={{ textAlign: "center", color: "#666", width: "100%" }}>
                        <ImageIcon size={24} style={{ margin: "0 auto" }} />
                        <span style={{ display: "block", fontSize: "10px", marginTop: "4px" }}>Image</span>
                        <input
                            placeholder="URL..."
                            style={{ background: "#333", border: "none", borderRadius: "4px", padding: "4px", color: "white", marginTop: "8px", fontSize: "10px", width: "80%" }}
                            onKeyDown={(e) => { if (e.key === 'Enter') onChange({ url: (e.target as HTMLInputElement).value }) }}
                        />
                    </div>
                )}
            </div>
        )
    }

    // Calendar - Real-time Current Month
    if (block.type === 'calendar') {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        // Days in month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        // First day of week (0 = Sunday)
        const firstDay = new Date(year, month, 1).getDay();

        const monthName = today.toLocaleString('default', { month: 'long' });

        return (
            <div style={{ padding: "16px", background: "#252525", borderRadius: "12px", border: "1px solid #404040", width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                <div style={{ marginBottom: "12px", color: "#fff", fontWeight: "600", fontSize: "14px", textAlign: "center", borderBottom: "1px solid #333", paddingBottom: "8px" }}>
                    {monthName} {year}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", fontSize: "10px", textAlign: "center", color: "#888", width: "100%", flex: 1 }}>
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => <div key={`day-${idx}`} style={{ fontSize: "9px", marginBottom: "4px", fontWeight: "bold" }}>{d}</div>)}

                    {/* Empty slots for start of month */}
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}

                    {/* Days */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const d = i + 1;
                        const isToday = d === today.getDate();
                        return (
                            <div key={d} style={{
                                padding: "4px",
                                background: isToday ? "#2383e2" : "transparent",
                                color: isToday ? "white" : "#ccc",
                                borderRadius: "4px",
                                cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center"
                            }}>{d}</div>
                        );
                    })}
                </div>
            </div>
        )
    }

    // Code
    if (block.type === 'code') {
        return (
            <div style={{ background: "#1e1e1e", padding: "16px", borderRadius: "8px", border: "1px solid #333", fontFamily: "monospace", height: "100%" }}>
                <textarea
                    value={block.content.text || ""}
                    onChange={e => onChange({ text: e.target.value })}
                    style={{ ...commonStyle, color: "#d4d4d4", fontSize: "13px", resize: "none", height: "100%" }}
                    placeholder="// content.tsx..."
                />
            </div>
        );
    }

    // Hand Text
    if (block.type === 'hand_text') {
        return <textarea
            value={block.content.text || ""}
            onChange={e => onChange({ text: e.target.value })}
            style={{ ...commonStyle, resize: "none", fontSize: "24px", fontFamily: "var(--font-hand)", lineHeight: "1.5", color: "#e0e0e0" }} /* Slightly off-white for chalk effect */
            placeholder="Write something..."
        />;
    }

    return <div>{block.type}</div>;
}
