"use client";

interface Props {
    userName?: string;
}

export default function TypingIndicator({ userName }: Props) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            color: 'var(--notion-text-muted)',
            fontStyle: 'italic',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
            }}>
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        style={{
                            width: '6px',
                            height: '6px',
                            backgroundColor: 'var(--notion-text-muted)',
                            borderRadius: '50%',
                            animation: `typingBounce 1.4s ease-in-out ${i * 0.2}s infinite`,
                        }}
                    />
                ))}
            </div>
            <span>{userName || 'Someone'} is typing...</span>

            <style>{`
                @keyframes typingBounce {
                    0%, 60%, 100% {
                        transform: translateY(0);
                        opacity: 0.4;
                    }
                    30% {
                        transform: translateY(-4px);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
