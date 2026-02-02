"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, TrendingUp, Zap } from "lucide-react";

interface InsightsData {
    insights: string;
    stats?: {
        completionRate: number;
        pendingTasks: number;
        highPriorityPending: number;
    };
    source: "ai" | "local" | "fallback";
}

export default function AIInsights() {
    const [data, setData] = useState<InsightsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/insights", { method: "POST" });
            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
        } catch (e) {
            console.error("Failed to fetch insights:", e);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div style={{
            background: "var(--notion-bg-secondary)",
            border: "1px solid var(--notion-border)",
            borderRadius: "6px",
            marginTop: "16px",
            marginBottom: "24px"
        }}>
            {/* Header - Notion Style */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderBottom: "1px solid var(--notion-divider)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Zap size={14} style={{ color: "var(--notion-text-muted)" }} />
                    <span style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "var(--notion-text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em"
                    }}>
                        AI Insights
                    </span>
                </div>
                <button
                    onClick={fetchInsights}
                    disabled={loading}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--notion-text-muted)",
                        cursor: loading ? "not-allowed" : "pointer",
                        padding: "4px",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center"
                    }}
                    className="hover-bg"
                >
                    <RefreshCw size={13} style={{
                        animation: loading ? "spin 1s linear infinite" : "none"
                    }} />
                </button>
            </div>

            {/* Insights Content - Notion Style */}
            <div style={{ padding: "14px" }}>
                {loading && !data ? (
                    <div style={{
                        color: "var(--notion-text-muted)",
                        fontSize: "13px"
                    }}>
                        Analyzing your productivity...
                    </div>
                ) : data ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            fontSize: "13px",
                            color: "var(--notion-text)",
                            lineHeight: 1.7,
                            whiteSpace: "pre-line"
                        }}
                    >
                        {data.insights}
                    </motion.div>
                ) : (
                    <div style={{
                        color: "var(--notion-text-muted)",
                        fontSize: "13px"
                    }}>
                        Click refresh to get AI insights
                    </div>
                )}

                {/* Stats Row - Notion Style */}
                {data?.stats && (
                    <div style={{
                        display: "flex",
                        gap: "20px",
                        marginTop: "14px",
                        paddingTop: "12px",
                        borderTop: "1px solid var(--notion-divider)"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <TrendingUp size={12} style={{ color: "var(--notion-green)" }} />
                            <span style={{
                                fontSize: "12px",
                                color: "var(--notion-text-muted)"
                            }}>
                                Completion
                            </span>
                            <span style={{
                                fontSize: "12px",
                                color: "var(--notion-green)",
                                fontWeight: 500
                            }}>
                                {data.stats.completionRate}%
                            </span>
                        </div>
                        {data.stats.highPriorityPending > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{
                                    fontSize: "12px",
                                    color: "var(--notion-text-muted)"
                                }}>
                                    Urgent
                                </span>
                                <span style={{
                                    fontSize: "12px",
                                    color: "var(--notion-red)",
                                    fontWeight: 500
                                }}>
                                    {data.stats.highPriorityPending}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
