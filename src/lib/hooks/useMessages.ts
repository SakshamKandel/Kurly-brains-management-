"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";

interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    attachments: string[];
    isRead: boolean;
    createdAt: string;
    sender: { id: string; firstName: string; lastName: string };
    receiver: { id: string; firstName: string; lastName: string } | null;
    conversationId?: string;
}

interface Conversation {
    id: string;
    isGroup: boolean;
    name: string | null;
    otherUser: { id: string; firstName: string; lastName: string } | null;
    lastMessage: {
        content: string;
        createdAt: string;
        senderId: string;
        senderName: string;
    } | null;
    unreadCount: number;
    updatedAt: string;
}

interface UseMessagesResult {
    messages: Message[];
    loading: boolean;
    error: string | null;
    sendMessage: (content: string, attachments?: string[]) => Promise<void>;
    refreshMessages: () => Promise<void>;
}

interface UseConversationsResult {
    conversations: Conversation[];
    loading: boolean;
    error: string | null;
    totalUnread: number;
    refreshConversations: () => Promise<void>;
}

// Hook for fetching messages in a conversation
export function useMessages(otherUserId: string | null): UseMessagesResult {
    const { data: session } = useSession();
    const fetcher = (url: string) => fetch(url).then(res => res.json());

    // Use SWR for polling (3s)
    const { data: messagesData, error, mutate } = useSWR<Message[]>(
        otherUserId ? `/api/messages?userId=${otherUserId}` : null,
        fetcher,
        {
            refreshInterval: 3000,
            revalidateOnFocus: true, // Fetch when window gets focus
            dedupingInterval: 1000,
        }
    );

    const messages = messagesData || [];
    const loading = !messagesData && !error && !!otherUserId;

    // Mark as read when messages load
    useEffect(() => {
        if (messages.length > 0) {
            const conversationId = messagesData?.[0]?.conversationId;
            const hasUnread = messages.some(m => !m.isRead && m.receiverId === session?.user?.id);

            if (conversationId && hasUnread) {
                // Determine if we need to mark read (check if latest is unread for us)
                fetch('/api/messages/read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ conversationId })
                }).then(() => {
                    // Start a revalidation to update unread counts globally?
                    // Actually, useConversations will pick it up on next poll.
                });
            }
        }
    }, [messagesData, session]);

    const sendMessage = async (content: string, attachments?: string[]) => {
        if (!otherUserId || (!content.trim() && (!attachments || attachments.length === 0))) return;

        const tempMessage: Message = {
            id: 'temp-' + Date.now(),
            senderId: session?.user?.id || '',
            receiverId: otherUserId,
            content,
            attachments: attachments || [],
            isRead: false,
            createdAt: new Date().toISOString(),
            sender: { id: session?.user?.id || '', firstName: 'You', lastName: '' },
            receiver: null
        };

        // Optimistic update
        mutate([...messages, tempMessage], false);

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: otherUserId, content, attachments })
            });

            if (res.ok) {
                mutate(); // Revalidate with server data
            } else {
                // Revert
                mutate(messages.filter(m => m.id !== tempMessage.id), false);
            }
        } catch (error) {
            mutate(messages.filter(m => m.id !== tempMessage.id), false);
        }
    };

    return {
        messages,
        loading,
        error: error ? "Failed to load" : null,
        sendMessage,
        refreshMessages: async () => { await mutate(); }
    };
}

// Hook for fetching conversations list
export function useConversations(): UseConversationsResult {
    const fetcher = (url: string) => fetch(url).then(res => res.json());

    // Poll every 5s
    const { data: conversationsData, error, mutate } = useSWR<Conversation[]>('/api/conversations', fetcher, {
        refreshInterval: 5000
    });

    const conversations = conversationsData || [];
    const loading = !conversationsData && !error;
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    return {
        conversations,
        loading,
        error: error ? "Failed to load" : null,
        totalUnread,
        refreshConversations: async () => { await mutate(); }
    };
}

// Hook for total unread count (for sidebar badge)
export function useUnreadCount(): number {
    const fetcher = (url: string) => fetch(url).then(res => res.json());

    // Poll every 10s
    const { data } = useSWR<{ unreadCount: number }>('/api/messages/unread', fetcher, {
        refreshInterval: 10000
    });

    return data?.unreadCount || 0;
}

// Hook for typing indicators
interface TypingState {
    isTyping: boolean;
    userName?: string;
}

export function useTypingIndicator(otherUserId: string | null): {
    otherUserTyping: TypingState;
    sendTypingStatus: (isTyping: boolean) => void;
} {
    const [otherUserTyping, setOtherUserTyping] = useState<TypingState>({ isTyping: false });
    const lastSentRef = useRef<number>(0);

    // Poll for other user's typing status
    useEffect(() => {
        if (!otherUserId) {
            setOtherUserTyping({ isTyping: false });
            return;
        }

        const checkTyping = async () => {
            try {
                const res = await fetch(`/api/messages/typing?otherUserId=${otherUserId}`);
                if (res.ok) {
                    const data = await res.json();
                    setOtherUserTyping({
                        isTyping: data.isTyping,
                        userName: data.userName,
                    });
                }
            } catch (err) {
                // Silent fail
            }
        };

        checkTyping();
        const interval = setInterval(checkTyping, 2000);
        return () => clearInterval(interval);
    }, [otherUserId]);

    // Send typing status (debounced)
    const sendTypingStatus = useCallback((isTyping: boolean) => {
        if (!otherUserId) return;

        const now = Date.now();
        // Only send if 2 seconds have passed since last send (for isTyping=true)
        if (isTyping && now - lastSentRef.current < 2000) return;

        lastSentRef.current = now;

        fetch('/api/messages/typing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otherUserId, isTyping }),
        }).catch(() => {
            // Silent fail
        });
    }, [otherUserId]);

    return { otherUserTyping, sendTypingStatus };
}

