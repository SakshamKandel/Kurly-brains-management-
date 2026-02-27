"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { ReactNode, useState } from "react";

interface DraggableWidgetProps {
    id: string;
    children: ReactNode;
}

export default function DraggableWidget({ id, children }: DraggableWidgetProps) {
    const [isHovered, setIsHovered] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || "transform 220ms cubic-bezier(0.2, 0, 0, 1)",
        opacity: isDragging ? 0 : 1,
        position: "relative" as const,
        height: "100%",
        zIndex: isDragging ? 0 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Drag Handle - Always visible, highlighted on hover */}
            <div
                {...attributes}
                {...listeners}
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "-8px",
                    transform: "translateY(-50%)",
                    zIndex: 20,
                    padding: "8px 4px",
                    borderRadius: "4px",
                    backgroundColor: isHovered ? "var(--notion-bg-tertiary)" : "transparent",
                    cursor: isDragging ? "grabbing" : "grab",
                    opacity: isHovered ? 1 : 0.2,
                    transition: "opacity 0.15s ease, background-color 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    touchAction: "none",
                }}
            >
                <GripVertical
                    size={14}
                    style={{ color: isHovered ? "var(--notion-text-secondary)" : "var(--notion-text-muted)" }}
                />
            </div>

            {/* Widget Content */}
            <div
                style={{
                    height: "100%",
                    borderRadius: "var(--radius-md)",
                    transition: "outline 0.15s ease",
                }}
            >
                {children}
            </div>
        </div>
    );
}
