import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/pages/[id]/analyze-title - AI-powered title generation
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Fetch page with blocks
        const page = await prisma.customPage.findFirst({
            where: {
                id,
                userId: session.user.id
            },
            include: {
                blocks: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!page) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Extract text content from blocks
        const textContent: string[] = [];

        for (const block of page.blocks) {
            const content = block.content as any;

            // Extract text from text-based blocks
            if (['text', 'heading1', 'heading2', 'sticky_note', 'code', 'hand_text'].includes(block.type)) {
                if (content?.text && content.text.trim().length > 0) {
                    textContent.push(`[${block.type}]: ${content.text.trim()}`);
                }
            }
        }

        // If no text content, use fallback
        if (textContent.length === 0) {
            return NextResponse.json({
                title: `Mood Board ${new Date().toLocaleDateString()}`,
                source: "fallback"
            });
        }

        // Build context for AI
        const contentSummary = textContent.slice(0, 10).join("\n"); // Limit to first 10 blocks

        const prompt = `Analyze this moodboard content and generate a SHORT, creative title (2-5 words max). 
The title should capture the main theme or mood. Be creative but concise.

Content:
${contentSummary}

Respond with ONLY the title, nothing else.`;

        // Call Perplexity AI
        const response = await fetch("https://api.perplexity.ai/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-sonar-small-128k-online",
                messages: [
                    {
                        role: "system",
                        content: "You are a creative naming assistant. Generate short, evocative titles for moodboards and creative projects. Respond with only the title, no quotes or extra text."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 30,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            // Fallback to heuristic
            const fallbackTitle = generateFallbackTitle(page.blocks);
            return NextResponse.json({
                title: fallbackTitle,
                source: "heuristic"
            });
        }

        const data = await response.json();
        let aiTitle = data.choices?.[0]?.message?.content || "";

        // Clean up AI response
        aiTitle = aiTitle.trim().replace(/^["']|["']$/g, ''); // Remove quotes
        aiTitle = aiTitle.split('\n')[0]; // Take first line only

        if (aiTitle.length > 50) {
            aiTitle = aiTitle.substring(0, 47) + "...";
        }

        if (!aiTitle) {
            const fallbackTitle = generateFallbackTitle(page.blocks);
            return NextResponse.json({
                title: fallbackTitle,
                source: "heuristic"
            });
        }

        return NextResponse.json({
            title: aiTitle,
            source: "ai"
        });

    } catch (error) {
        console.error("AI title generation error:", error);
        return NextResponse.json({
            title: `Mood Board ${new Date().toLocaleDateString()}`,
            source: "error"
        });
    }
}

// Fallback heuristic title generation
function generateFallbackTitle(blocks: any[]): string {
    // Look for heading1 first
    const h1 = blocks.find((b: any) => b.type === "heading1" && (b.content as any)?.text);
    if (h1) {
        return ((h1.content as any).text as string).substring(0, 40);
    }

    // Look for sticky note
    const sticky = blocks.find((b: any) => b.type === "sticky_note" && (b.content as any)?.text);
    if (sticky) {
        const text = (sticky.content as any).text as string;
        return text.length > 30 ? text.substring(0, 27) + "..." : text;
    }

    // Look for any text block
    const textBlock = blocks.find((b: any) =>
        b.type === "text" && (b.content as any)?.text?.length > 5
    );
    if (textBlock) {
        const text = (textBlock.content as any).text as string;
        return text.length > 30 ? text.substring(0, 27) + "..." : text;
    }

    return `Mood Board ${new Date().toLocaleDateString()}`;
}
