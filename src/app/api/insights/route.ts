import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/insights - Get AI-powered productivity insights
export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Gather user productivity data
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [tasks, completedTasks, recentActivity] = await Promise.all([
            prisma.task.count({ where: { assigneeId: userId } }),
            prisma.task.count({ where: { assigneeId: userId, status: "COMPLETED" } }),
            prisma.task.findMany({
                where: {
                    assigneeId: userId,
                    updatedAt: { gte: weekAgo }
                },
                select: { status: true, priority: true, updatedAt: true },
                orderBy: { updatedAt: "desc" },
                take: 20
            })
        ]);

        const pendingTasks = tasks - completedTasks;
        const completionRate = tasks > 0 ? Math.round((completedTasks / tasks) * 100) : 0;

        // Calculate productivity metrics
        const highPriorityPending = recentActivity.filter(
            t => t.status !== "COMPLETED" && t.priority === "HIGH"
        ).length;

        // Generate context for AI
        const context = `
User Productivity Data:
- Total tasks: ${tasks}
- Completed: ${completedTasks} (${completionRate}% completion rate)
- Pending: ${pendingTasks}
- High priority pending: ${highPriorityPending}
- Recent activity: ${recentActivity.length} task updates this week

Please provide 2-3 brief, actionable productivity insights based on this data. Be encouraging but practical. Keep each insight to 1-2 sentences max.
        `.trim();

        // Call Perplexity API
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
                        content: "You are a productivity coach. Give brief, actionable insights. No fluff. Use emojis sparingly. Format as bullet points."
                    },
                    {
                        role: "user",
                        content: context
                    }
                ],
                max_tokens: 200,
                temperature: 0.5
            })
        });

        if (!response.ok) {
            // Fallback to generated insights
            return NextResponse.json({
                insights: generateFallbackInsights(completionRate, pendingTasks, highPriorityPending),
                source: "local"
            });
        }

        const data = await response.json();
        const aiInsight = data.choices?.[0]?.message?.content || "";

        return NextResponse.json({
            insights: aiInsight,
            stats: {
                tasks,
                completedTasks,
                pendingTasks,
                completionRate,
                highPriorityPending
            },
            source: "ai"
        });

    } catch (error) {
        console.error("AI insights error:", error);
        return NextResponse.json({
            insights: "• Keep up the momentum! Focus on one task at a time.\n• Consider tackling high-priority items first.",
            source: "fallback"
        });
    }
}

function generateFallbackInsights(completionRate: number, pending: number, highPriority: number): string {
    const insights: string[] = [];

    if (completionRate >= 80) {
        insights.push("🎯 Excellent completion rate! You're crushing it.");
    } else if (completionRate >= 50) {
        insights.push("📈 Good progress! A little push and you'll hit your goals.");
    } else {
        insights.push("💪 Time to focus! Start with your highest priority task.");
    }

    if (highPriority > 0) {
        insights.push(`🔴 ${highPriority} high-priority ${highPriority === 1 ? 'task needs' : 'tasks need'} your attention.`);
    }

    if (pending === 0) {
        insights.push("✨ All caught up! Great time to plan ahead.");
    } else if (pending <= 3) {
        insights.push("Almost there! Just a few tasks left to close out.");
    }

    return insights.join("\n");
}
