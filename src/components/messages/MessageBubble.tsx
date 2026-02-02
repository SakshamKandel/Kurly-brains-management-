"use client";

import { Check, CheckCheck, Download, FileText } from "lucide-react";

interface Props {
    content: string;
    timestamp: string;
    isOwn: boolean;
    isRead: boolean;
    attachments?: string[];
}

export default function MessageBubble({ content, timestamp, isOwn, isRead, attachments }: Props) {
    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isImage = (url: string) => {
        const ext = url.split('.').pop()?.toLowerCase() || '';
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    };

    const getFilename = (url: string) => {
        const filename = url.split('/').pop() || 'file';
        return filename.replace(/^\d+-/, '');
    };

    const hasContent = content && content.trim().length > 0;
    const hasAttachments = attachments && attachments.length > 0;

    return (
        <div style={{
            display: 'flex',
            justifyContent: isOwn ? 'flex-end' : 'flex-start',
            marginBottom: 'var(--space-0-5)',
        }}>
            <div style={{
                maxWidth: '70%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isOwn ? 'flex-end' : 'flex-start',
            }}>
                {/* Text content */}
                {hasContent && (
                    <div style={{
                        padding: 'var(--space-2) var(--space-3)',
                        backgroundColor: isOwn ? 'var(--notion-blue)' : 'var(--notion-bg-tertiary)',
                        color: isOwn ? 'white' : 'var(--notion-text)',
                        borderRadius: isOwn
                            ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)'
                            : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        wordBreak: 'break-word',
                    }}>
                        {content}
                    </div>
                )}

                {/* Attachments */}
                {hasAttachments && (
                    <div style={{
                        marginTop: hasContent ? 'var(--space-1-5)' : '0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-1-5)',
                        alignItems: isOwn ? 'flex-end' : 'flex-start',
                    }}>
                        {attachments.map((url, index) => (
                            isImage(url) ? (
                                <a
                                    key={index}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'block',
                                        borderRadius: 'var(--radius-md)',
                                        overflow: 'hidden',
                                        maxWidth: '240px',
                                        border: '1px solid var(--notion-border)',
                                    }}
                                >
                                    <img
                                        src={url}
                                        alt="Attachment"
                                        style={{
                                            display: 'block',
                                            maxWidth: '100%',
                                            height: 'auto',
                                            maxHeight: '240px',
                                            objectFit: 'cover',
                                        }}
                                    />
                                </a>
                            ) : (
                                <a
                                    key={index}
                                    href={url}
                                    download={getFilename(url)}
                                    className="hover-bg"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-2)',
                                        padding: 'var(--space-2) var(--space-3)',
                                        backgroundColor: 'var(--notion-bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--notion-border)',
                                        color: 'var(--notion-text)',
                                        textDecoration: 'none',
                                    }}
                                >
                                    <FileText size={18} style={{ color: 'var(--notion-blue)' }} />
                                    <span style={{
                                        fontSize: '13px',
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '160px',
                                    }}>
                                        {getFilename(url)}
                                    </span>
                                    <Download size={14} style={{ color: 'var(--notion-text-muted)', flexShrink: 0 }} />
                                </a>
                            )
                        ))}
                    </div>
                )}

                {/* Timestamp and read status */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    marginTop: 'var(--space-1)',
                    fontSize: '11px',
                    color: 'var(--notion-text-muted)',
                }}>
                    <span>{formatTime(timestamp)}</span>
                    {isOwn && (
                        isRead ? (
                            <CheckCheck size={14} style={{ color: 'var(--notion-blue)' }} />
                        ) : (
                            <Check size={14} />
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
