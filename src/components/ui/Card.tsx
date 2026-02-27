import { ReactNode, HTMLAttributes, forwardRef, ElementType } from 'react';
import { motion } from 'framer-motion';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'editorial';
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    hoverEffect?: boolean;
    animated?: boolean;
    delay?: number;
    children: ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ variant = 'default', padding = 'md', hoverEffect = true, animated = false, delay = 0, className = '', style, children, ...props }, ref) => {

        const isEditorial = variant === 'editorial';

        const baseStyle: React.CSSProperties = {
            backgroundColor: variant === 'default' ? 'var(--notion-bg-secondary)'
                : isEditorial ? 'var(--notion-bg-secondary)'
                    : 'transparent',
            border: variant === 'outline' ? '1px solid var(--notion-border)'
                : isEditorial ? '1px solid transparent'
                    : 'none',
            borderRadius: isEditorial ? '0' : 'var(--radius-md)',
            // Flat 2D transitions
            transition: 'background-color 300ms ease, transform 300ms cubic-bezier(0.16, 1, 0.3, 1), border-color 300ms ease, box-shadow 300ms ease',
            position: 'relative',
            overflow: 'hidden', // Required for pseudo-element glows
            ...style,
        };

        const paddingMap = {
            none: '0',
            sm: '16px',
            md: '24px',
            lg: '32px',
            xl: '48px',
        };

        // Custom flat 2D hover logic with enhanced cinematic glow
        let premiumHover = "";
        if (hoverEffect && isEditorial) {
            premiumHover = "hover:bg-[var(--notion-bg-tertiary)] hover:-translate-y-1 hover:border-[var(--brand-blue)] hover:shadow-glow group/card";
        } else if (hoverEffect) {
            premiumHover = "hover-reveal-parent hover:border-[rgba(255,255,255,0.15)] hover:bg-[var(--notion-bg-hover)] group/card";
        }

        const CardWrapper = (animated ? motion.div : 'div') as React.ElementType;
        const motionProps = animated ? {
            initial: { opacity: 0, y: 15, scale: 0.98 },
            animate: { opacity: 1, y: 0, scale: 1 },
            transition: {
                duration: 0.5,
                delay: delay,
                ease: [0.16, 1, 0.3, 1] // Apple-like smooth spring ease
            }
        } : {};

        return (
            <CardWrapper
                ref={ref as any}
                className={`notion-card ${premiumHover} ${className}`}
                style={{
                    ...baseStyle,
                    padding: paddingMap[padding]
                }}
                {...motionProps}
                {...props}
            >
                {/* Premium Mouse Follow Glow (CSS representation) */}
                {hoverEffect && !isEditorial && (
                    <div className="absolute inset-0 z-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{ background: 'radial-gradient(circle at center, var(--notion-bg-active) 0%, transparent 70%)' }} />
                )}

                {/* Premium Noise Overlay for Material Feel */}
                {isEditorial && (
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay z-0"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                        }}
                    />
                )}

                {/* Editorial Inner Shine */}
                {isEditorial && <div className="absolute inset-0 border-t border-white/[0.05] pointer-events-none z-0" />}

                <div className="relative z-10 w-full h-full">
                    {children}
                </div>
            </CardWrapper>
        );
    }
);

Card.displayName = 'Card';

export { Card };
export default Card;
