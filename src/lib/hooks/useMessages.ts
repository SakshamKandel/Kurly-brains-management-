"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

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
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMessages = useCallback(async () => {
        if (!otherUserId) return;

        setLoading(true);
        setError(null);

        try {
            console.log('[useMessages] Fetching messages for userId:', otherUserId);
            const res = await fetch(`/api/messages?userId=${otherUserId}`);
            console.log('[useMessages] Response status:', res.status);
            if (res.ok) {
                const data = await res.json();
                setMessages(prev => {
                    const pendingMessages = prev.filter(m => m.id.startsWith('temp-'));
                    return [...data, ...pendingMessages];
                });

                // Mark messages as read
                if (data.length > 0) {
                    const conversationId = data[0]?.conversationId;
                    if (conversationId) {
                        await fetch('/api/messages/read', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ conversationId })
                        });
                    }
                }
            } else {
                setError("Failed to fetch messages");
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }, [otherUserId]);

    // Initial fetch and polling
    useEffect(() => {
        fetchMessages();

        // Poll for new messages every 3 seconds
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    const sendMessage = async (content: string, attachments?: string[]) => {
        if (!otherUserId || (!content.trim() && (!attachments || attachments.length === 0))) return;

        // Optimistic update
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

        setMessages(prev => [...prev, tempMessage]);

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: otherUserId, content, attachments })
            });

            if (res.ok) {
                const newMessage = await res.json();
                setMessages(prev => {
                    // Check if message already exists (from polling)
                    const exists = prev.some(m => m.id === newMessage.id);
                    if (exists) {
                        // Just remove the temp message since the real one is there
                        return prev.filter(m => m.id !== tempMessage.id);
                    }
                    // Replace temp with real
                    return prev.map(msg => msg.id === tempMessage.id ? newMessage : msg);
                });
            } else {
                setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
                console.error("Failed to send message");
            }
        } catch (error) {
            setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
            console.error("Error sending message:", error);
        }
    };

    return {
        messages,
        loading,
        error,
        sendMessage,
        refreshMessages: fetchMessages
    };
}

// Hook for fetching conversations list
export function useConversations(): UseConversationsResult {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalUnread, setTotalUnread] = useState(0);

    const fetchConversations = useCallback(async () => {
        try {
            const res = await fetch('/api/conversations');
            if (res.ok) {
                const data = await res.json();
                setConversations(data);

                // Calculate total unread
                const total = data.reduce((sum: number, c: Conversation) => sum + c.unreadCount, 0);
                setTotalUnread(total);
            } else {
                setError("Failed to fetch conversations");
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConversations();

        // Poll for updates every 5 seconds
        const interval = setInterval(fetchConversations, 5000);
        return () => clearInterval(interval);
    }, [fetchConversations]);

    return {
        conversations,
        loading,
        error,
        totalUnread,
        refreshConversations: fetchConversations
    };
}

// Hook for total unread count (for sidebar badge)
export function useUnreadCount(): number {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await fetch('/api/messages/unread');
                if (res.ok) {
                    const data = await res.json();
                    setCount(data.unreadCount || 0);
                }
            } catch (err) {
                // Silent fail
            }
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 10000);
        return () => clearInterval(interval);
    }, []);

    return count;
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

