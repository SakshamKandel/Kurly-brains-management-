"use client";

import Image from "next/image";
import { FileText, Download, X } from "lucide-react";

interface Attachment {
    url: string;
    filename: string;
    type: string;
}

interface AttachmentPreviewProps {
    attachments: Attachment[];
    isEditable?: boolean;
    onRemove?: (index: number) => void;
}

function getFileIcon(type: string) {
    if (type.startsWith("image/")) return null; // Will show actual image
    if (type === "application/pdf") return "📄";
    if (type.includes("word")) return "📝";
    return "📎";
}

function isImageType(type: string) {
    return type.startsWith("image/");
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function AttachmentPreview({
    attachments,
    isEditable = false,
    onRemove,
}: AttachmentPreviewProps) {
    if (!attachments || attachments.length === 0) return null;

    return (
        <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginTop: "8px",
        }}>
            {attachments.map((attachment, index) => (
                <div
                    key={index}
                    style={{
                        position: "relative",
                        borderRadius: "8px",
                        overflow: "hidden",
                        backgroundColor: "var(--notion-bg-tertiary)",
                        border: "1px solid var(--notion-border)",
                    }}
                >
                    {isImageType(attachment.type) ? (
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                            <Image
                                src={attachment.url}
                                alt={attachment.filename}
                                width={200}
                                height={150}
                                style={{
                                    objectFit: "cover",
                                    display: "block",
                                    maxWidth: "200px",
                                    maxHeight: "150px",
                                }}
                            />
                        </a>
                    ) : (
                        <a
                            href={attachment.url}
                            download={attachment.filename}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "10px 14px",
                                textDecoration: "none",
                                color: "var(--notion-text)",
                            }}
                        >
                            <span style={{ fontSize: "20px" }}>
                                {getFileIcon(attachment.type) || <FileText size={20} />}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    maxWidth: "150px",
                                }}>
                                    {attachment.filename}
                                </div>
                            </div>
                            <Download
                                size={16}
                                style={{
                                    color: "var(--notion-text-muted)",
                                    flexShrink: 0,
                                }}
                            />
                        </a>
                    )}

                    {isEditable && onRemove && (
                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            style={{
                                position: "absolute",
                                top: "4px",
                                right: "4px",
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                backgroundColor: "rgba(0,0,0,0.6)",
                                color: "white",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                            }}
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
