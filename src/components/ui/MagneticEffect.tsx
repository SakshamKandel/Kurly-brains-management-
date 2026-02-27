"use client";

import React, { useRef, useState, MouseEvent } from "react";
import { motion } from "framer-motion";

interface MagneticEffectProps {
    children: React.ReactNode;
    className?: string;
    strength?: number;
}

export function MagneticEffect({
    children,
    className = "",
    strength = 15, // How far it pulls towards the cursor
}: MagneticEffectProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouse = (e: MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current.getBoundingClientRect();

        // Calculate distance from center of element
        const x = clientX - (left + width / 2);
        const y = clientY - (top + height / 2);

        setPosition({
            x: x * (strength / 100),
            y: y * (strength / 100)
        });
    };

    const reset = () => {
        setPosition({ x: 0, y: 0 });
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
