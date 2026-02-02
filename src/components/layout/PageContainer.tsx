"use client";

import { ReactNode } from "react";

interface PageContainerProps {
    children: ReactNode;

    /** 
     * Notion-style large page title 
     */
    title?: ReactNode;

    /** 
     * Actions to show on hover (top right) 
     */
    action?: ReactNode;

    /** 
     * Use full width (e.g. for database views), defaults to 900px centered 
     */
    fullWidth?: boolean;

    /** 
     * Optional cover image URL (Notion style) 
     */
    coverImage?: string;

    /** 
     * Optional icon (Lucide or Emoji) displayed above title 
     */
    icon?: ReactNode;

    className?: string;
}

export default function PageContainer({
    children,
    title,
    action,
    fullWidth = false,
    coverImage,
    icon,
    className = "",
}: PageContainerProps) {

    return (
        <div
            className={`page-container ${className}`}
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center", // Center the column
            }}
        >
            {/* Optional Cover Image */}
            {coverImage && (
                <div
                    className="page-cover"
                    style={{
                        width: "100%",
                        height: "20vh",
                        minHeight: "180px",
                        backgroundImage: `url(${coverImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
            )}

            {/* Content Column */}
            <div
                className="notion-content-column"
                style={{
                    width: "100%",
                    maxWidth: fullWidth ? "100%" : "900px",
                    padding: fullWidth ? "24px 48px" : "32px 96px", // Notion-like generous side padding
                    paddingBottom: "120px", // Bottom spacing
                }}
            >
                {/* Page Header Area */}
                {(title || icon) && (
                    <div
                        className="page-header group"
                        style={{
                            marginBottom: "32px",
                            position: 'relative',
                        }}
                    >
                        {/* Hover Actions (Top Right of Content) */}
                        {action && (
                            <div
                                className="hover-reveal"
                                style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: 0,
                                    display: 'flex',
                                    gap: '8px'
                                }}
                            >
                                {action}
                            </div>
                        )}

                        {/* Icon */}
                        {icon && (
                            <div style={{
                                marginBottom: "16px",
                                fontSize: "78px",
                                lineHeight: 1,
                                marginLeft: "-4px" // Visual alignment
                            }}>
                                {icon}
                            </div>
                        )}

                        {/* Title */}
                        {title && (
                            <h1 style={{
                                fontSize: "var(--text-4xl)",
                                fontWeight: "700",
                                color: "var(--notion-text)",
                                margin: 0,
                                lineHeight: 1.2,
                            }}>
                                {title}
                            </h1>
                        )}
                    </div>
                )}

                {/* Main Content Children */}
                <div className="page-content">
                    {children}
                </div>
            </div>


        </div>
    );
}
