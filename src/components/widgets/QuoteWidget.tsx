import { Quote } from "lucide-react";
import { useEffect, useState } from "react";
import { QUOTES } from "@/data/quotes";

export default function QuoteWidget() {
    const [quote, setQuote] = useState(QUOTES[0]);

    useEffect(() => {
        // Random quote on mount
        const randomIndex = Math.floor(Math.random() * QUOTES.length);
        setQuote(QUOTES[randomIndex]);
    }, []);

    return (
        <div className="bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-xl p-6 h-[180px] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-3 left-3 text-[var(--notion-text-muted)]">
                <Quote size={14} />
            </div>

            <div className="flex-1 flex items-center justify-center text-center px-2">
                <p className="text-[var(--notion-text)] font-medium text-lg italic leading-relaxed">
                    "{quote.text}"
                </p>
            </div>

            <div className="text-center">
                <span className="text-xs text-[var(--notion-text-muted)] font-semibold uppercase tracking-wider">
                    — {quote.author}
                </span>
            </div>
        </div>
    );
}
