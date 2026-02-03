"use client";

import { Users } from "lucide-react";
import Avatar from "@/components/ui/Avatar";

interface Conversation {
    id: string;
    isGroup?: boolean;
    name?: string | null;
    otherUser: { id: string; firstName: string; lastName: string; lastActive?: string | null } | null;
    memberCount?: number;
    lastMessage: {
        content: string;
        createdAt: string;
        senderId: string;
    } | null;
    unreadCount: number;
}

interface Props {
    conversations: Conversation[];
    selectedUserId: string | null;
    onSelect: (userId: string) => void;
    searchQuery: string;
}

export default function ConversationList({
    conversations,
    selectedUserId,
    onSelect,
    searchQuery
}: Props) {
    const filteredConversations = conversations.filter((c) => {
        if (!c.otherUser) return false;
        const name = `${c.otherUser.firstName} ${c.otherUser.lastName}`.toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    });

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    if (filteredConversations.length === 0) {
        return (
            <div style={{
                padding: 'var(--space-8) var(--space-5)',
                textAlign: 'center',
                color: 'var(--notion-text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-3)',
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--notion-bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Users size={24} style={{ opacity: 0.5 }} />
                </div>
                <span style={{ fontSize: '14px' }}>
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </span>
            </div>
        );
    }

    return (
        <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConversations.map((conv) => {
                const user = conv.otherUser!;
                const isSelected = selectedUserId === user.id;
                const fullName = `${user.firstName} ${user.lastName}`;

                return (
                    <div
                        key={conv.id}
                        onClick={() => onSelect(user.id)}
                        className="hover-bg"
                        style={{
                            padding: 'var(--space-3) var(--space-4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            cursor: 'pointer',
                            transition: 'background-color 0.1s ease',
                            backgroundColor: isSelected ? 'var(--notion-bg-tertiary)' : 'transparent',
                            borderLeft: isSelected ? '2px solid var(--notion-blue)' : '2px solid transparent',
                        }}
                    >
                        {/* Avatar */}
                        <div style={{ position: 'relative' }}>
                            <Avatar name={fullName} size="md" />
                            {user.lastActive && new Date(user.lastActive).getTime() > Date.now() - 5 * 60 * 1000 && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: -2,
                                    right: -2,
                                    width: 10,
                                    height: 10,
                                    backgroundColor: 'var(--notion-green)',
                                    borderRadius: '50%',
                                    border: '2px solid var(--notion-bg)',
                                    zIndex: 10
                                }} />
                            )}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 'var(--space-0-5)',
                            }}>
                                <span style={{
                                    fontWeight: conv.unreadCount > 0 ? 600 : 500,
                                    fontSize: '14px',
                                    color: conv.unreadCount > 0 ? 'var(--notion-text)' : 'var(--notion-text)',
                                }}>
                                    {fullName}
                                </span>
                                {conv.lastMessage && (
                                    <span style={{
                                        fontSize: '11px',
                                        color: conv.unreadCount > 0 ? 'var(--notion-blue)' : 'var(--notion-text-muted)',
                                    }}>
                                        {formatTime(conv.lastMessage.createdAt)}
                                    </span>
                                )}
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 'var(--space-2)',
                            }}>
                                <span style={{
                                    fontSize: '13px',
                                    color: conv.unreadCount > 0 ? 'var(--notion-text-secondary)' : 'var(--notion-text-muted)',
                                    fontWeight: conv.unreadCount > 0 ? 500 : 400,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {conv.lastMessage?.content || 'No messages yet'}
                                </span>

                                {conv.unreadCount > 0 && (
                                    <span style={{
                                        minWidth: '18px',
                                        height: '18px',
                                        padding: '0 var(--space-1-5)',
                                        borderRadius: 'var(--radius-full)',
                                        backgroundColor: 'var(--notion-blue)',
                                        color: 'white',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
