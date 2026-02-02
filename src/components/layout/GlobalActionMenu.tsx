"use client";

import { useState } from "react";
import { Plus, CheckSquare, Calendar, Key, UserPlus } from "lucide-react";
import { useSession } from "next-auth/react";
import Dropdown from "@/components/ui/Dropdown";

// Using a custom dropdown implementation for the menu to have full control
interface ActionMenuItem {
    label: string;
    icon: any;
    onClick: () => void;
    color?: string;
    roleLimit?: string[];
}

export default function GlobalActionMenu() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);

    // We will need to trigger modals. Ideally these modals are provided by a Context,
    // but for "One Shot" implementation without refactoring the whole app to Context,
    // we might need to emit custom events or use a temporary approach.
    //
    // For the purpose of this implementation, we will dispatch CustomEvents that 
    // the respective pages or a Layout-level listener can pick up.
    // BETTER YET: We can make this component handle the "Task" modal state itself if we import it,
    // but Modal code is often page-specific. 
    //
    // Let's us CustomEvents as a lightweight bus for this "One Shot".

    const handleAction = (action: string) => {
        setIsOpen(false);
        window.dispatchEvent(new CustomEvent(`open-${action}-modal`));
    };

    const userRole = session?.user?.role;
    const isAdminOrManager = userRole === "ADMIN" || userRole === "MANAGER" || userRole === "SUPER_ADMIN";

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--notion-blue)] text-white rounded-[var(--radius-sm)] text-sm font-medium hover:bg-opacity-90 transition-colors"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: 'var(--notion-blue)',
                    color: 'white',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500
                }}
            >
                <Plus size={16} />
                <span className="hidden sm:inline">New</span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    />
                    <div
                        className="absolute right-0 top-full mt-2 w-56 bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-[var(--radius-md)] shadow-lg z-50 overflow-hidden"
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            marginTop: '8px',
                            width: '220px',
                            backgroundColor: 'var(--notion-bg)',
                            border: '1px solid var(--notion-border)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 50,
                            overflow: 'hidden',
                            animation: 'slideDown 0.1s ease-out'
                        }}
                    >
                        <div className="py-1">
                            <div
                                style={{
                                    padding: '8px 12px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: 'var(--notion-text-muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}
                            >
                                Create New
                            </div>

                            <button
                                onClick={() => handleAction('task')}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '14px',
                                    color: 'var(--notion-text)',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                                className="hover:bg-[var(--notion-bg-secondary)]"
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--notion-bg-secondary)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <div style={{ padding: '4px', borderRadius: '4px', background: 'var(--notion-blue-bg)', color: 'var(--notion-blue)' }}>
                                    <CheckSquare size={16} />
                                </div>
                                Task
                            </button>

                            <button
                                onClick={() => handleAction('leave')}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '14px',
                                    color: 'var(--notion-text)',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--notion-bg-secondary)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <div style={{ padding: '4px', borderRadius: '4px', background: 'var(--notion-yellow-bg)', color: 'var(--notion-yellow)' }}>
                                    <Calendar size={16} />
                                </div>
                                Leave Request
                            </button>

                            {isAdminOrManager && (
                                <button
                                    onClick={() => handleAction('credential')}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '14px',
                                        color: 'var(--notion-text)',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--notion-bg-secondary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <div style={{ padding: '4px', borderRadius: '4px', background: 'var(--notion-red-bg)', color: 'var(--notion-red)' }}>
                                        <Key size={16} />
                                    </div>
                                    Client Credential
                                </button>
                            )}

                            {isAdminOrManager && (
                                <button
                                    onClick={() => handleAction('staff')}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '14px',
                                        color: 'var(--notion-text)',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--notion-bg-secondary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <div style={{ padding: '4px', borderRadius: '4px', background: 'var(--notion-green-bg)', color: 'var(--notion-green)' }}>
                                        <UserPlus size={16} />
                                    </div>
                                    Staff Member
                                </button>
                            )}

                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
