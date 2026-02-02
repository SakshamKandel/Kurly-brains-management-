"use client";

import { useState, useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import BlockEditor from "@/components/editor/BlockEditor";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CustomPageView() {
    const params = useParams();
    const [page, setPage] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchPage(params.id as string);
        }
    }, [params.id]);

    const fetchPage = async (id: string) => {
        try {
            console.log("Fetching page:", id);
            const res = await fetch(`/api/pages/${id}`);
            if (res.ok) {
                const data = await res.json();
                console.log("Page data received:", data);
                setPage(data);

                // Auto-generate title if page is still "Untitled Page" and has content
                if (data.title === "Untitled Page" && data.blocks?.length > 1) {
                    autoGenerateTitle(data.id);
                }
            } else {
                console.error("Page fetch failed:", res.status, res.statusText);
                const err = await res.text();
                console.error("Error body:", err);
            }
        } catch (e) {
            console.error("Failed to load page", e);
        } finally {
            setLoading(false);
        }
    };

    const autoGenerateTitle = async (pageId: string) => {
        try {
            const res = await fetch(`/api/pages/${pageId}/analyze-title`, {
                method: "POST"
            });
            if (res.ok) {
                const data = await res.json();
                if (data.title) {
                    setPage((prev: any) => ({ ...prev, title: data.title }));
                    await fetch(`/api/pages/${pageId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ title: data.title })
                    });
                    window.dispatchEvent(new CustomEvent('page-title-updated', {
                        detail: { pageId, title: data.title }
                    }));
                }
            }
        } catch (e) {
            console.error("Auto title generation failed:", e);
        }
    };

    const updateTitle = async (title: string) => {
        setPage({ ...page, title });
        await fetch(`/api/pages/${page.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title })
        });
        // Trigger sidebar refresh
        window.dispatchEvent(new CustomEvent('page-title-updated', {
            detail: { pageId: page.id, title }
        }));
    };

    const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

    const handleMagicRename = async () => {
        if (isGeneratingTitle) return;

        setIsGeneratingTitle(true);

        try {
            // Call AI-powered title generation API
            const res = await fetch(`/api/pages/${page.id}/analyze-title`, {
                method: "POST"
            });

            if (res.ok) {
                const data = await res.json();
                if (data.title) {
                    updateTitle(data.title);
                }
            } else {
                // Fallback to simple heuristic if API fails
                fallbackRename();
            }
        } catch (error) {
            console.error("AI title generation failed:", error);
            fallbackRename();
        } finally {
            setIsGeneratingTitle(false);
        }
    };

    const fallbackRename = () => {
        if (!page?.blocks || page.blocks.length === 0) {
            updateTitle(`Mood Board ${new Date().toLocaleDateString()}`);
            return;
        }

        let newTitle = "";

        const h1 = page.blocks.find((b: any) => b.type === "heading1" && b.content?.text);
        if (h1) {
            newTitle = h1.content.text;
        } else {
            const sticky = page.blocks.find((b: any) => b.type === "sticky_note" && b.content?.text);
            if (sticky) {
                newTitle = sticky.content.text.substring(0, 30);
                if (sticky.content.text.length > 30) newTitle += "...";
            } else {
                const text = page.blocks.find((b: any) => b.type === "text" && b.content?.text?.length > 5);
                if (text) {
                    newTitle = text.content.text.substring(0, 30);
                }
            }
        }

        if (newTitle) {
            updateTitle(newTitle);
        } else {
            updateTitle(`Mood Board ${new Date().toLocaleDateString()}`);
        }
    };

    if (loading) {
        return (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Loader2 className="animate-spin text-gray-400" />
            </div>
        );
    }

    if (!page) {
        return (
            <div style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--notion-text-muted)",
                gap: "16px"
            }}>
                <div style={{ fontSize: "16px" }}>Page not found or deleted</div>
                <button
                    onClick={() => window.location.href = "/dashboard"}
                    style={{
                        padding: "6px 12px",
                        borderRadius: "4px",
                        border: "1px solid var(--notion-border)",
                        background: "var(--notion-bg)",
                        cursor: "pointer",
                        fontSize: "14px"
                    }}
                >
                    Go to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div style={{
            position: "relative",
            width: "100%",
            height: "100vh",
            overflow: "hidden",
            background: "#191919",
            display: "flex",
            flexDirection: "column"
        }}>

            {/* Header Overlay */}
            <div style={{
                position: "absolute",
                top: "20px",
                left: "100px", // Space for Toolbox 
                zIndex: 50,
                display: "flex",
                alignItems: "center",
                gap: "12px",
                pointerEvents: "auto"
            }}>
                <input
                    value={page.title}
                    onChange={(e) => updateTitle(e.target.value)}
                    placeholder="Untitled"
                    style={{
                        fontSize: "24px",
                        fontWeight: 600,
                        color: "var(--notion-text)",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        fontFamily: "inherit",
                        minWidth: "200px"
                    }}
                />
                <button
                    onClick={handleMagicRename}
                    disabled={isGeneratingTitle}
                    title="AI-powered auto-rename based on content"
                    style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: isGeneratingTitle ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                        color: "var(--notion-text-muted)",
                        cursor: isGeneratingTitle ? "wait" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.2s ease"
                    }}
                >
                    {isGeneratingTitle ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        "✨"
                    )}
                    <span style={{ fontSize: "12px" }}>
                        {isGeneratingTitle ? "Thinking..." : "AI Title"}
                    </span>
                </button>
            </div>

            {/* Canvas Area */}
            <div style={{ flex: 1, position: "relative" }}>
                <BlockEditor pageId={page.id} initialBlocks={page.blocks || []} />
            </div>

            <style jsx global>{`
                /* Hide sidebar if needed or adjust z-index */
            `}</style>
        </div>
    );
}
