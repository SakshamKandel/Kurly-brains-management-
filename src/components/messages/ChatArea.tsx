"use client";

import { useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import MessageBubble from "./MessageBubble";
import { Sparkles } from "lucide-react";

interface Message {
    id: string;
    senderId: string;
    content: string;
    isRead: boolean;
    createdAt: string;
    attachments?: string[];
}

interface Props {
    messages: Message[];
    loading: boolean;
}

export default function ChatArea({ messages, loading }: Props) {
    const { data: session } = useSession();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (loading && messages.length === 0) {
        return (
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--notion-bg)',
            }}>
                <div style={{ padding: 'var(--space-5)' }}>
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className="skeleton"
                            style={{
                                width: i % 2 === 0 ? '180px' : '220px',
                                height: '40px',
                                marginBottom: 'var(--space-2)',
                                borderRadius: 'var(--radius-md)',
                                marginLeft: i % 2 === 0 ? 'auto' : '0',
                            }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--notion-bg)',
            }}>
                <div style={{ textAlign: 'center', maxWidth: '260px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: 'var(--notion-blue-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--space-4)',
                    }}>
                        <Sparkles size={28} style={{ color: 'var(--notion-blue)' }} />
                    </div>
                    <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: 'var(--notion-text)',
                        margin: '0 0 var(--space-2)',
                    }}>
                        Start the conversation
                    </h3>
                    <p style={{
                        fontSize: '14px',
                        color: 'var(--notion-text-secondary)',
                        margin: 0,
                        lineHeight: 1.5,
                    }}>
                        Send a message to begin chatting
                    </p>
                </div>
            </div>
        );
    }

    // Group messages by date
    const groupedMessages: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    messages.forEach((msg) => {
        const msgDate = new Date(msg.createdAt).toLocaleDateString([], {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        if (msgDate !== currentDate) {
            currentDate = msgDate;
            groupedMessages.push({ date: msgDate, messages: [msg] });
        } else {
            groupedMessages[groupedMessages.length - 1].messages.push(msg);
        }
    });

    return (
        <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
            backgroundColor: 'var(--notion-bg)',
        }}>
            {groupedMessages.map((group, groupIndex) => (
                <div key={groupIndex}>
                    {/* Date separator */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: 'var(--space-4) 0',
                    }}>
                        <div style={{
                            padding: 'var(--space-1) var(--space-3)',
                            backgroundColor: 'var(--notion-bg-secondary)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '12px',
                            color: 'var(--notion-text-secondary)',
                            fontWeight: 500,
                        }}>
                            {group.date}
                        </div>
                    </div>

                    {/* Messages */}
                    {group.messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            content={msg.content}
                            timestamp={msg.createdAt}
                            isOwn={msg.senderId === session?.user?.id}
                            isRead={msg.isRead}
                            attachments={msg.attachments}
                        />
                    ))}
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
}
