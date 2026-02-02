"use client";

import { useState, useRef } from "react";
import { Send, Paperclip, X, Loader2 } from "lucide-react";

interface Attachment {
    url: string;
    filename: string;
    type: string;
}

interface Props {
    onSend: (content: string, attachments?: string[]) => void;
    onTyping?: (isTyping: boolean) => void;
    disabled?: boolean;
    placeholder?: string;
}

export default function MessageInput({ onSend, onTyping, disabled, placeholder = "Type a message..." }: Props) {
    const [message, setMessage] = useState("");
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        if (onTyping) {
            onTyping(e.target.value.length > 0);
        }
        // Auto-resize
        e.target.style.height = "auto";
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!message.trim() && attachments.length === 0) || disabled || uploading) return;

        const attachmentUrls = attachments.map(a => a.url);
        onSend(message.trim(), attachmentUrls.length > 0 ? attachmentUrls : undefined);
        setMessage("");
        setAttachments([]);
        if (onTyping) onTyping(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);

        for (const file of Array.from(files)) {
            try {
                const formData = new FormData();
                formData.append("file", file);

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (res.ok) {
                    const data = await res.json();
                    setAttachments(prev => [...prev, {
                        url: data.url,
                        filename: data.filename,
                        type: data.type,
                    }]);
                } else {
                    const errorData = await res.json();
                    alert(`Failed to upload ${file.name}: ${errorData.error}`);
                }
            } catch (err) {
                console.error("Failed to upload file");
                alert(`Failed to upload ${file.name}: Network error`);
            }
        }

        setUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const isImage = (type: string) => type.startsWith("image/");
    const canSend = (message.trim() || attachments.length > 0) && !disabled && !uploading;

    return (
        <div style={{
            padding: "var(--space-4)",
            backgroundColor: "var(--notion-bg-secondary)",
            borderTop: "1px solid var(--notion-divider)",
        }}>
            {/* Attachment preview */}
            {attachments.length > 0 && (
                <div style={{
                    display: "flex",
                    gap: "var(--space-2)",
                    marginBottom: "var(--space-3)",
                    flexWrap: "wrap",
                }}>
                    {attachments.map((attachment, index) => (
                        <div
                            key={index}
                            style={{
                                position: "relative",
                                borderRadius: "var(--radius-md)",
                                overflow: "hidden",
                                backgroundColor: "var(--notion-bg-tertiary)",
                                border: "1px solid var(--notion-border)",
                            }}
                        >
                            {isImage(attachment.type) ? (
                                <img
                                    src={attachment.url}
                                    alt={attachment.filename}
                                    style={{
                                        width: "64px",
                                        height: "64px",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: "64px",
                                    height: "64px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "var(--space-2)",
                                }}>
                                    <Paperclip size={16} style={{ color: "var(--notion-text-muted)" }} />
                                    <span style={{
                                        fontSize: "10px",
                                        color: "var(--notion-text-secondary)",
                                        textAlign: "center",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        width: "100%",
                                        whiteSpace: "nowrap",
                                        marginTop: "4px",
                                    }}>
                                        {attachment.filename}
                                    </span>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                style={{
                                    position: "absolute",
                                    top: "2px",
                                    right: "2px",
                                    width: "16px",
                                    height: "16px",
                                    borderRadius: "var(--radius-full)",
                                    backgroundColor: "var(--notion-bg)",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "var(--notion-text-secondary)",
                                }}
                            >
                                <X size={10} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input container */}
            <div style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "var(--space-2)",
                backgroundColor: "var(--notion-bg)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-2) var(--space-3)",
                border: "1px solid var(--notion-border)",
            }}>
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                {/* Attachment button */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="hover-bg"
                    style={{
                        background: "transparent",
                        border: "none",
                        color: uploading ? "var(--notion-text-muted)" : "var(--notion-text-secondary)",
                        cursor: uploading ? "wait" : "pointer",
                        padding: "var(--space-1-5)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                    title="Attach file"
                >
                    {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                </button>

                {/* Textarea */}
                <textarea
                    value={message}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={uploading ? "Uploading..." : placeholder}
                    disabled={disabled || uploading}
                    rows={1}
                    style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        fontSize: "14px",
                        color: "var(--notion-text)",
                        outline: "none",
                        resize: "none",
                        padding: "var(--space-1) 0",
                        lineHeight: "1.5",
                        maxHeight: "120px",
                        minHeight: "24px",
                    }}
                />

                {/* Send button */}
                <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={!canSend}
                    style={{
                        backgroundColor: canSend ? "var(--notion-blue)" : "var(--notion-bg-tertiary)",
                        border: "none",
                        color: canSend ? "white" : "var(--notion-text-muted)",
                        cursor: canSend ? "pointer" : "not-allowed",
                        padding: "var(--space-1-5)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "background-color 0.1s ease",
                    }}
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
}
