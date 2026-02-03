"use client";

import React, { useState, useRef, useEffect } from "react";
import { Trash2, MoveDiagonal } from "lucide-react";

interface ObjectWrapperProps {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number | "auto";
    isSelected: boolean;
    onSelect: () => void;
    onChange: (changes: { x?: number, y?: number, width?: number, height?: number }) => void;
    onDelete: () => void;
    onSave?: (changes?: { x?: number, y?: number, width?: number, height?: number }) => void;
    children: React.ReactNode;
    isSeamless?: boolean;
}

export default function ObjectWrapper({
    id,
    x,
    y,
    width,
    height,
    isSelected,
    onSelect,
    onChange,
    onDelete,
    onSave,
    children,
    isSeamless = false
}: ObjectWrapperProps) {
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const objStartRef = useRef({ x: 0, y: 0 });
    const lastTouchRef = useRef({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);

    // Helper to check if we are clicking an interactive element (Input, Textarea, etc)
    const isInteractive = (target: EventTarget | null) => {
        if (!target) return false;
        const el = target as HTMLElement;
        const tagName = el.tagName.toUpperCase();
        return tagName === 'INPUT' || tagName === 'TEXTAREA' || el.isContentEditable || el.closest('.interactive-control');
    };

    const startDrag = (clientX: number, clientY: number) => {
        setIsDragging(true);
        isDraggingRef.current = true;
        dragStartRef.current = { x: clientX, y: clientY };
        objStartRef.current = { x, y };
        lastTouchRef.current = { x: clientX, y: clientY };
    };

    // Drag Logic
    const handlePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation(); // Always stop propagation to canvas (prevent panning)

        onSelect(); // Always select on click

        // CRITICAL FIX: If clicking text/input, DO NOT drag, DO NOT prevent default behavior (focus)
        if (isInteractive(e.target)) {
            return;
        }

        e.preventDefault(); // Prevent default browser drag for non-inputs

        // Start Drag
        startDrag(e.clientX, e.clientY);

        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        e.stopPropagation();
        onSelect();

        if (isInteractive(e.target)) {
            return;
        }

        const touch = e.touches[0];
        if (!touch) return;

        e.preventDefault();
        startDrag(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        if (!touch) return;

        e.preventDefault();
        const dx = touch.clientX - dragStartRef.current.x;
        const dy = touch.clientY - dragStartRef.current.y;

        onChange({
            x: objStartRef.current.x + dx,
            y: objStartRef.current.y + dy
        });

        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        isDraggingRef.current = false;

        if (onSave) {
            const dx = lastTouchRef.current.x - dragStartRef.current.x;
            const dy = lastTouchRef.current.y - dragStartRef.current.y;
            onSave({
                x: objStartRef.current.x + dx,
                y: objStartRef.current.y + dy
            });
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;

        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;

        onChange({
            x: objStartRef.current.x + dx,
            y: objStartRef.current.y + dy
        });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (isDragging) {
        setIsDragging(false);
        isDraggingRef.current = false;
            if (onSave) {
                // Calculate final pos explicitly to avoid stale state issues in parent
                const dx = e.clientX - dragStartRef.current.x;
                const dy = e.clientY - dragStartRef.current.y;
                onSave({
                    x: objStartRef.current.x + dx,
                    y: objStartRef.current.y + dy
                });
            }
            try {
                (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            } catch (err) { /* ignore */ }
        }
    };

    // Resize Logic
    const handleResizeStart = (e: React.PointerEvent) => {
        e.stopPropagation(); // Prevent drag start
        e.preventDefault();  // Prevent selection

        const startX = e.clientX;
        const startY = e.clientY;
        const startW = width;
        // Handle "auto" height safely
        const startH = typeof height === 'number' ? height : 100;

        const onMove = (mv: PointerEvent) => {
            mv.preventDefault();
            const newW = Math.max(100, startW + (mv.clientX - startX));
            // Only update height if it's NOT auto (or if we force it to number)
            const changes: any = { width: newW };
            if (typeof height === 'number') {
                changes.height = Math.max(100, startH + (mv.clientY - startY));
            }
            onChange(changes);
        };

        const onUp = (e: PointerEvent) => {
            if (onSave) {
                // Calculate final resize explicitly
                const newW = Math.max(100, startW + (e.clientX - startX));
                const changes: any = { width: newW };
                if (typeof height === 'number') {
                    changes.height = Math.max(100, startH + (e.clientY - startY));
                }
                onSave(changes);
            }
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
    };

    return (
        <div
            className="group"
            style={{
                position: "absolute",
                left: x,
                top: y,
                width: width,
                height: height,
                touchAction: "none",
                // If dragging, show grabbing. 
                // If NOT dragging, show default cursor so text inputs show text cursor properly
                cursor: isDragging ? "grabbing" : (isSelected ? "move" : "default"),
                zIndex: isSelected ? 1000 : 10,
                // Only show border if Selected OR if it's NOT a seamless type (like a card)
                // If seamless (Text/H1), render transparent border unless selected
                border: isSelected ? "1px solid #2383e2" : "1px solid transparent",
                background: "transparent", // Always transparent container, let inner content handle bg
                borderRadius: "8px",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            {/* Drag Handle (useful for touch on text blocks) */}
            {isSelected && (
                <div
                    className="interactive-control"
                    title="Move"
                    style={{
                        position: "absolute",
                        top: "-10px",
                        left: "-10px",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "#2383e2",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        zIndex: 1002,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        cursor: "grab",
                        touchAction: "none"
                    }}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onSelect();
                        startDrag(e.clientX, e.clientY);
                        (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    }}
                    onTouchStart={(e) => {
                        e.stopPropagation();
                        const touch = e.touches[0];
                        if (!touch) return;
                        e.preventDefault();
                        onSelect();
                        startDrag(touch.clientX, touch.clientY);
                    }}
                >
                    ⠿
                </div>
            )}
            {/* Delete Handle - Add 'interactive-control' class */}
            {isSelected && (
                <div
                    className="interactive-control"
                    title="Delete"
                    style={{ position: "absolute", top: "-12px", right: "-12px", background: "#ff4d4d", borderRadius: "50%", padding: "6px", cursor: "pointer", zIndex: 1002, boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
                    onPointerDown={(e) => {
                        e.stopPropagation(); // Stop wrapper drag
                        onDelete();
                    }}
                >
                    <Trash2 size={12} color="white" />
                </div>
            )}

            {/* Content Slot */}
            <div style={{ width: "100%", height: "100%", position: 'relative' }}>
                {children}
            </div>

            {/* Resize Handle - Add 'interactive-control' class */}
            {isSelected && (
                <div
                    className="interactive-control"
                    onPointerDown={handleResizeStart}
                    style={{
                        position: "absolute", bottom: "-6px", right: "-6px",
                        width: "16px", height: "16px",
                        background: "white", border: "2px solid #2383e2", borderRadius: "50%",
                        cursor: "nwse-resize", zIndex: 1002,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                />
            )}
        </div>
    );
}
