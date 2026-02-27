'use client';

import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { MagneticEffect } from './MagneticEffect';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  magnetic?: boolean;
  children?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary', // Notion defaults to secondary/ghost often
      size = 'md',
      icon,
      iconPosition = 'left',
      loading = false,
      fullWidth = false,
      magnetic = false,
      children,
      className = '',
      style = {},
      disabled,
      ...props
    },
    ref
  ) => {
    // Notion-style Styles
    const baseStyle: React.CSSProperties = {
      display: fullWidth ? 'flex' : 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      borderRadius: 'var(--radius-sm)',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 200ms ease, color 200ms ease, transform 150ms ease, box-shadow 200ms ease',
      fontFamily: 'var(--font-body)',
      fontWeight: '500',
      userSelect: 'none',
      width: fullWidth ? '100%' : 'auto',
      whiteSpace: 'nowrap',
      ...style,
    };

    const sizeStyles = {
      sm: { fontSize: '12px', padding: '2px 8px', height: '24px' },
      md: { fontSize: '14px', padding: '4px 12px', height: '32px' },
      lg: { fontSize: '15px', padding: '6px 16px', height: '36px' },
    };

    const variantStyles = {
      primary: {
        backgroundColor: 'var(--brand-blue)',
        color: 'white',
        boxShadow: '0 0 0 rgba(37, 99, 235, 0)',
      },
      secondary: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        color: 'var(--notion-text)',
        border: '1px solid rgba(255,255,255,0.06)',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: 'var(--notion-text-secondary)',
      },
      danger: {
        backgroundColor: 'var(--notion-red)',
        color: 'white',
      },
    };

    const disabledStyle = disabled || loading ? {
      opacity: 0.5,
      cursor: 'not-allowed',
      pointerEvents: 'none' as const,
    } : {};

    const combinedStyle = {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...disabledStyle,
    };

    const hoverStyle = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;
      if (variant === 'primary') {
        e.currentTarget.style.backgroundColor = 'var(--notion-text)'; // Changes to white on hover in dark mode
        e.currentTarget.style.boxShadow = '0 0 20px var(--brand-blue-glow)';
        e.currentTarget.style.color = 'var(--notion-inverse)';
      }
      if (variant === 'secondary') {
        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
      }
      if (variant === 'ghost') {
        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.color = 'var(--notion-text)';
      }
      if (variant === 'danger') {
        e.currentTarget.style.backgroundColor = 'rgba(224, 108, 108, 0.9)';
        e.currentTarget.style.boxShadow = '0 0 20px rgba(226, 74, 74, 0.3)';
      }

      e.currentTarget.style.transform = 'translateY(-1px)';
    };

    const leaveStyle = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;
      // Reset to original (simplified for inline styles)
      Object.assign(e.currentTarget.style, variantStyles[variant]);
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
      if (variant === 'secondary') {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
      }
    };

    const ButtonContent = (
      <button
        ref={ref}
        className={`active-scale ${className}`}
        style={combinedStyle}
        onMouseEnter={hoverStyle}
        onMouseLeave={leaveStyle}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="animate-spin" style={{ width: 14, height: 14 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          </span>
        ) : (
          <>
            {icon && iconPosition === 'left' && <span>{icon}</span>}
            {children && <span>{children}</span>}
            {icon && iconPosition === 'right' && <span>{icon}</span>}
          </>
        )}
      </button>
    );

    if (magnetic && !disabled && !loading) {
      return (
        <MagneticEffect strength={20}>
          {ButtonContent}
        </MagneticEffect>
      );
    }

    return ButtonContent;
  }
);

Button.displayName = 'Button';

export default Button;
