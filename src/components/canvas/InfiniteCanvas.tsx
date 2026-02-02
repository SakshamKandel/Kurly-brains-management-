"use client";

import React, { useRef, useState, useEffect } from "react";

interface InfiniteCanvasProps {
    children: React.ReactNode;
    pan: { x: number, y: number };
    zoom: number;
    setPan: (pan: { x: number, y: number }) => void;
    setZoom: (zoom: number) => void;
    onBackgroundClick?: () => void;
}

export default function InfiniteCanvas({
    children,
    pan,
    zoom,
    setPan,
    setZoom,
    onBackgroundClick
}: InfiniteCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPanning, setIsPanning] = useState(false);
    const lastPanRef = useRef({ x: 0, y: 0 });

    // Prevent browser zoom on the canvas - use native event listener for proper preventDefault
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleNativeWheel = (e: WheelEvent) => {
            // If Ctrl/Meta is pressed, this is a zoom gesture
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                e.stopPropagation();

                // Calculate zoom - scroll up (negative deltaY) = zoom in
                const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
                const newZoom = Math.min(Math.max(0.1, zoom * zoomFactor), 5);
                setZoom(newZoom);
            }
        };

        // Attach with { passive: false } to allow preventDefault
        container.addEventListener('wheel', handleNativeWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleNativeWheel);
        };
    }, [zoom, setZoom]);

    // Panning Logic (Middle Click / Space+Drag / standard drag on background)
    const handlePointerDown = (e: React.PointerEvent) => {
        // If clicking on an interactive element (block), don't pan
        if ((e.target as HTMLElement).closest(".interactive-block")) return;

        // If left click and NOT on a block, we pan (Freeform style)
        // OR if middle click
        if (e.button === 0 || e.button === 1) {
            setIsPanning(true);
            lastPanRef.current = { x: e.clientX, y: e.clientY };
            (e.target as HTMLElement).setPointerCapture(e.pointerId);

            if (onBackgroundClick) onBackgroundClick();
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isPanning) return;

        const dx = e.clientX - lastPanRef.current.x;
        const dy = e.clientY - lastPanRef.current.y;

        setPan({
            x: pan.x + dx,
            y: pan.y + dy
        });

        lastPanRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsPanning(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    return (
        <div
            ref={containerRef}
            className="infinite-canvas-container"
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: "#191919",
                cursor: isPanning ? "grabbing" : "grab",
                position: "relative",
                touchAction: "none",
                // Dotted Grid
                backgroundImage: "radial-gradient(#333 1px, transparent 1px)",
                backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
                backgroundPosition: `${pan.x}px ${pan.y}px`
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* Transform Container */}
            <div
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: "0 0",
                    width: 0,
                    height: 0,
                    position: "absolute",
                    top: 0,
                    left: 0,
                }}
            >
                {children}
            </div>
        </div>
    );
}

