import { HTMLAttributes, forwardRef } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'pink' | 'blue';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    size?: 'sm' | 'md';
    glow?: boolean;
    children: React.ReactNode;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ variant = 'default', size = 'md', glow = false, children, className = '', style, ...props }, ref) => {

        const variantStyles = {
            default: { bg: 'rgba(255,255,255,0.1)', color: 'var(--notion-text)', glow: 'rgba(255,255,255,0.2)' },
            success: { bg: 'var(--notion-green-bg)', color: 'var(--notion-green)', glow: 'rgba(74, 226, 144, 0.4)' },
            warning: { bg: 'var(--notion-yellow-bg)', color: 'var(--notion-yellow)', glow: 'rgba(226, 194, 74, 0.4)' },
            error: { bg: 'var(--notion-red-bg)', color: 'var(--notion-red)', glow: 'rgba(226, 74, 74, 0.4)' },
            info: { bg: 'var(--notion-blue-bg)', color: 'var(--notion-blue)', glow: 'rgba(74, 144, 226, 0.4)' },
            purple: { bg: 'rgba(154, 109, 215, 0.2)', color: 'var(--notion-purple)', glow: 'rgba(178, 74, 226, 0.4)' },
            pink: { bg: 'rgba(218, 103, 154, 0.2)', color: 'var(--notion-pink)', glow: 'rgba(226, 74, 169, 0.4)' },
            blue: { bg: 'rgba(37, 99, 235, 0.2)', color: 'var(--notion-blue)', glow: 'rgba(37, 99, 235, 0.4)' },
        };

        const v = variantStyles[variant] || variantStyles.default;

        const glowClass = glow ? 'animate-pulse-slow' : '';
        const glowStyle = glow ? { boxShadow: `0 0 12px ${v.glow}` } : {};

        return (
            <span
                ref={ref}
                className={`transition-all duration-300 ${glowClass} ${className}`}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: size === 'sm' ? '0px 6px' : '2px 8px',
                    borderRadius: '4px',
                    fontSize: size === 'sm' ? '11px' : '12px',
                    fontWeight: '500',
                    backgroundColor: v.bg,
                    color: v.color,
                    whiteSpace: 'nowrap',
                    ...glowStyle,
                    ...style
                }}
                {...props}
            >
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';

export default Badge;
