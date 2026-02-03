"use client";

import { useEffect, useState, useTransition } from "react";
import { getAttentionItems, processAction, type AttentionItem } from "@/app/actions/dashboard";
import { CheckCircle, XCircle, Clock, FileText, MessageSquare, AlertTriangle, ArrowRight, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function ActionStream() {
    const [items, setItems] = useState<AttentionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const data = await getAttentionItems();
                setItems(data);
            } catch (error) {
                console.error("Failed to fetch stream", error);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    const handleAction = async (itemId: string, action: string, type: string) => {
        // Optimistic Update
        setItems(prev => prev.filter(i => i.id !== itemId));

        // Server call
        const result = await processAction(itemId, action, type);
        if (!result.success) {
            // Revert if failed (in a real app, strict state management needed)
            alert("Action failed: " + result.message);
            router.refresh();
        } else {
            router.refresh(); // Refresh data to keep sync
        }
    };

    if (loading) {
        return (
            <div className="bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-xl p-6 h-[400px] flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-[var(--notion-text-muted)] border-t-transparent rounded-full" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-xl p-8 flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                <div className="w-12 h-12 bg-[var(--notion-green-bg)] rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="text-[var(--notion-green)]" size={24} />
                </div>
                <h3 className="text-[var(--notion-text)] font-semibold text-lg mb-2">All Caught Up!</h3>
                <p className="text-[var(--notion-text-muted)] text-sm max-w-xs">
                    You have cleared your decision inbox. No pending leaves, overdue invoices, or urgent tasks.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-xl overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="px-6 py-4 border-b border-[var(--notion-border)] flex items-center justify-between bg-[var(--notion-bg-secondary)]/30">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--notion-red)] animate-pulse" />
                    <h3 className="font-semibold text-[var(--notion-text)]">Decision Inbox</h3>
                </div>
                <span className="text-xs text-[var(--notion-text-muted)] bg-[var(--notion-bg-tertiary)] px-2 py-1 rounded-full">
                    {items.length} Actions
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 dashboard-scrollbar">
                <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`
                                group relative p-4 rounded-lg border transition-all duration-200
                                ${item.severity === 'high'
                                    ? 'bg-[var(--notion-red-bg)]/10 border-[var(--notion-red-bg)] hover:shadow-md'
                                    : 'bg-[var(--notion-bg)] border-[var(--notion-border)] hover:border-[var(--notion-text-muted)] hover:shadow-sm'
                                }
                            `}
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className={`
                                    p-2 rounded-lg shrink-0
                                    ${item.type === 'leave' ? 'bg-[var(--notion-orange-bg)] text-[var(--notion-orange)]' : ''}
                                    ${item.type === 'task' ? 'bg-[var(--notion-blue-bg)] text-[var(--notion-blue)]' : ''}
                                    ${item.type === 'invoice' ? 'bg-[var(--notion-green-bg)] text-[var(--notion-green)]' : ''}
                                    ${item.type === 'message' ? 'bg-[var(--notion-purple-bg)] text-[var(--notion-purple)]' : ''}
                                `}>
                                    {item.type === 'leave' && <Clock size={20} />}
                                    {item.type === 'task' && <CheckCircle size={20} />}
                                    {item.type === 'invoice' && <FileText size={20} />}
                                    {item.type === 'message' && <MessageSquare size={20} />}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-medium text-[var(--notion-text)] truncate pr-4">
                                            {item.title}
                                        </h4>
                                        <span className="text-[10px] text-[var(--notion-text-muted)] shrink-0 opacity-60">
                                            {new Date(item.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[var(--notion-text-muted)] mb-3 line-clamp-1">
                                        {item.subtitle}
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        {item.actions.includes('approve') && (
                                            <button
                                                onClick={() => handleAction(item.id, 'approve', item.type)}
                                                disabled={isPending}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--notion-green)] text-white rounded hover:opacity-90 transition-opacity"
                                            >
                                                <Check size={12} strokeWidth={3} />
                                                Approve
                                            </button>
                                        )}
                                        {item.actions.includes('reject') && (
                                            <button
                                                onClick={() => handleAction(item.id, 'reject', item.type)}
                                                disabled={isPending}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--notion-red)]/10 text-[var(--notion-red)] border border-[var(--notion-red)]/20 rounded hover:bg-[var(--notion-red)]/20 transition-colors"
                                            >
                                                <X size={12} strokeWidth={3} />
                                                Reject
                                            </button>
                                        )}
                                        {item.actions.includes('complete') && (
                                            <button
                                                onClick={() => handleAction(item.id, 'complete', item.type)}
                                                disabled={isPending}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--notion-blue)] text-white rounded hover:opacity-90 transition-opacity"
                                            >
                                                <Check size={12} strokeWidth={3} />
                                                Complete
                                            </button>
                                        )}
                                        {item.actions.includes('view') && (
                                            <button
                                                onClick={() => router.push(item.type === 'invoice' ? `/dashboard/invoices/${item.id}` : `/dashboard/tasks?id=${item.id}`)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] transition-colors"
                                            >
                                                View Details
                                                <ArrowRight size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
