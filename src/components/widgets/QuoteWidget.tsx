import { Quote } from "lucide-react";
import { useEffect, useState } from "react";
import { QUOTES } from "@/data/quotes";

export default function QuoteWidget() {
    const [quote, setQuote] = useState(QUOTES[0]);

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * QUOTES.length);
        setQuote(QUOTES[randomIndex]);
    }, []);

    return (
        <div className="h-full w-full flex flex-col justify-center relative overflow-hidden group p-8">
            {/* Massive background watermark */}
            <Quote
                size={140}
                className="absolute top-[-20px] left-[-20px] opacity-[0.02] text-white rotate-12 transition-transform duration-1000 group-hover:rotate-0 group-hover:scale-110 pointer-events-none"
            />

            <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-cyan)] opacity-70"></div>
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--notion-text-muted)]">Inspiration</span>
            </div>

            <div className="relative z-10 w-full">
                <p className="text-[var(--notion-text)] font-light text-xl italic leading-[1.6] tracking-wide mb-6">
                    "{quote.text}"
                </p>
                <div className="flex items-center gap-4">
                    <div className="flex-1 h-[1px] bg-[var(--notion-border)] opacity-50"></div>
                    <span className="text-[10px] text-[var(--notion-text-secondary)] font-bold uppercase tracking-[0.2em]">
                        {quote.author}
                    </span>
                    <div className="flex-1 h-[1px] bg-[var(--notion-border)] opacity-50"></div>
                </div>
            </div>
        </div>
    );
}
