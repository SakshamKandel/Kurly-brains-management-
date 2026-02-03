import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface FullUserData {
    user: {
        name: string;
        email: string;
        role: string;
        department: string | null;
        position: string | null;
    };
    tasks: Array<{
        title: string;
        status: string;
        priority: string;
        dueDate: Date | null;
        assignee?: {
            firstName: string;
            lastName: string;
        } | null;
    }>;
    leaves: Array<{
        type: string;
        status: string;
        startDate: Date;
        endDate: Date;
    }>;
    attendance: Array<{
        date: Date;
        status: string;
        clockIn: Date;
        clockOut: Date | null;
    }>;
    unreadMessages: number;
    pages: Array<{
        title: string;
        icon: string | null;
    }>;
    credentials: Array<{
        clientName: string;
        serviceName: string;
        username: string | null;
        password: string;
    }>;
}

async function getFullUserData(userId: string): Promise<FullUserData | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                department: true,
                position: true,
                assignedCredentials: {
                    select: { clientName: true, serviceName: true, username: true, password: true }
                },
                leaveRequests: {
                    take: 10,
                    orderBy: { createdAt: "desc" },
                    select: { type: true, status: true, startDate: true, endDate: true }
                },
                attendance: {
                    take: 14,
                    orderBy: { date: "desc" },
                    select: { date: true, status: true, clockIn: true, clockOut: true }
                },
                messagesReceived: {
                    where: { isRead: false },
                    select: { id: true }
                },
                customPages: {
                    take: 10,
                    orderBy: { updatedAt: "desc" },
                    select: { title: true, icon: true }
                }
            }
        });

        if (!user) return null;

        let tasks;
        if (user.role === "SUPER_ADMIN") {
            tasks = await prisma.task.findMany({
                take: 50,
                orderBy: { createdAt: "desc" },
                select: {
                    title: true,
                    status: true,
                    priority: true,
                    dueDate: true,
                    assignee: { select: { firstName: true, lastName: true } }
                }
            });
        } else {
            tasks = await prisma.task.findMany({
                where: {
                    OR: [
                        { assigneeId: userId },
                        { creatorId: userId }
                    ]
                },
                take: 50,
                orderBy: { createdAt: "desc" },
                select: {
                    title: true,
                    status: true,
                    priority: true,
                    dueDate: true,
                    assignee: { select: { firstName: true, lastName: true } }
                }
            });
        }

        return {
            user: {
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                role: user.role,
                department: user.department,
                position: user.position,
            },
            tasks,
            leaves: user.leaveRequests,
            attendance: user.attendance,
            unreadMessages: user.messagesReceived.length,
            pages: user.customPages,
            credentials: user.assignedCredentials,
        };
    } catch (error) {
        console.error("Database error:", error);
        return null;
    }
}

function buildContextString(data: FullUserData): string {
    const lines: string[] = [];
    lines.push(`User: ${data.user.name} (${data.user.role})`);
    if (data.user.department) lines.push(`Department: ${data.user.department}`);
    if (data.user.position) lines.push(`Position: ${data.user.position}`);

    const taskCounts = {
        total: data.tasks.length,
        todo: data.tasks.filter(t => t.status === "TODO").length,
        inProgress: data.tasks.filter(t => t.status === "IN_PROGRESS").length,
        review: data.tasks.filter(t => t.status === "REVIEW").length,
        completed: data.tasks.filter(t => t.status === "COMPLETED").length,
        urgent: data.tasks.filter(t => t.priority === "URGENT").length,
        high: data.tasks.filter(t => t.priority === "HIGH").length,
    };
    lines.push(`\nTASKS (${taskCounts.total} total):`);
    lines.push(`- TODO: ${taskCounts.todo}, In Progress: ${taskCounts.inProgress}, Review: ${taskCounts.review}, Completed: ${taskCounts.completed}`);
    lines.push(`- Priority: ${taskCounts.urgent} urgent, ${taskCounts.high} high`);

    const activeTasks = data.tasks.filter(t => t.status !== "COMPLETED" && t.status !== "CANCELLED");
    if (activeTasks.length > 0) {
        lines.push("Active tasks:");
        activeTasks.slice(0, 8).forEach(t => {
            const due = t.dueDate ? ` (due: ${new Date(t.dueDate).toLocaleDateString()})` : "";
            const assignee = t.assignee ? ` -> Assigned to ${t.assignee.firstName}` : "";
            lines.push(`  * ${t.title} [${t.status}] ${t.priority}${assignee}${due}`);
        });
    }

    const pendingLeaves = data.leaves.filter(l => l.status === "PENDING");
    const approvedLeaves = data.leaves.filter(l => l.status === "APPROVED");
    lines.push(`\nLEAVES: ${pendingLeaves.length} pending, ${approvedLeaves.length} approved`);
    if (pendingLeaves.length > 0) {
        lines.push("Pending requests:");
        pendingLeaves.forEach(l => {
            lines.push(`  * ${l.type}: ${new Date(l.startDate).toLocaleDateString()} - ${new Date(l.endDate).toLocaleDateString()}`);
        });
    }

    const presentDays = data.attendance.filter(a => a.status === "PRESENT").length;
    const lateDays = data.attendance.filter(a => a.status === "LATE").length;
    const absentDays = data.attendance.filter(a => a.status === "ABSENT").length;
    lines.push(`\nATTENDANCE (last ${data.attendance.length} days): ${presentDays} present, ${lateDays} late, ${absentDays} absent`);
    lines.push(`\nMESSAGES: ${data.unreadMessages} unread`);

    if (data.pages.length > 0) {
        lines.push(`\nPAGES: ${data.pages.length} custom pages`);
        data.pages.slice(0, 3).forEach(p => {
            lines.push(`  * [Page] ${p.title}`);
        });
    }

    if (data.credentials.length > 0) {
        lines.push(`\nSHARED CREDENTIALS (${data.credentials.length}):`);
        data.credentials.forEach(c => {
            lines.push(`  * ${c.clientName} - ${c.serviceName}: user="${c.username || 'N/A'}", pass="${c.password}"`);
        });
    }

    return lines.join("\n");
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        const { prompt } = await request.json();

        if (!prompt || typeof prompt !== "string") {
            return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
        }

        let userData: FullUserData | null = null;
        let contextStr = "";

        if (userId) {
            userData = await getFullUserData(userId);
            if (userData) {
                contextStr = buildContextString(userData);
            }
        }

        const apiKey = process.env.PERPLEXITY_API_KEY;

        if (apiKey && apiKey.startsWith("pplx-")) {
            try {
                const systemPrompt = `You are Kurly AI, a smart and capable assistant for the Kurly Brains team.

${contextStr ? `=== CURRENT USER CONTEXT & DASHBOARD DATA ===\n${contextStr}\n=== END DATA ===` : "No specific dashboard data available."}

INSTRUCTIONS:
1. Identity: You are Kurly AI, an intelligent assistant built exclusively for Kurly Brains.
2. Strict Rule: NEVER mention Perplexity, Llama, or being an AI model. If asked who you are, say "I am Kurly AI, your dashboard assistant."
3. Format: Use clean, Notion-style formatting (bullet points, bold text). DO NOT use citations or reference numbers.
4. Tone: Be conversational and direct.
5. Greetings: Reply to "Hey/Hi" with "Hey! How can I help you be productive today?"
6. Dashboard Data: Use the provided data for tasks/leaves/stats.
7. Credentials: Share client passwords ONLY if explicitly asked.`;

                const response = await fetch("https://api.perplexity.ai/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "sonar",
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: prompt }
                        ],
                        max_tokens: 1024,
                        temperature: 0.7,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    let aiResponse = data.choices?.[0]?.message?.content;
                    if (aiResponse) {
                        aiResponse = aiResponse.replace(/\[\d+\]/g, "").replace(/\*\*/g, "");
                        return NextResponse.json({ response: aiResponse });
                    }
                }
            } catch (apiError) {
                console.error("Perplexity API exception:", apiError);
            }
        }

        const lowerPrompt = prompt.toLowerCase();
        let fallback = "";

        if (userData) {
            const isTaskQuery = lowerPrompt.includes("task") || lowerPrompt.includes("how many");
            const isLeaveQuery = lowerPrompt.includes("leave") || lowerPrompt.includes("vacation");
            const isAttendanceQuery = lowerPrompt.includes("attendance") || lowerPrompt.includes("clock");
            const isSummaryQuery = lowerPrompt.includes("summary") || lowerPrompt.includes("overview");
            const isGreeting = lowerPrompt.includes("hello") || lowerPrompt.includes("hi") || lowerPrompt.includes("hey");

            if (isTaskQuery) {
                const todoCount = userData.tasks.filter(t => t.status === "TODO").length;
                const inProgressCount = userData.tasks.filter(t => t.status === "IN_PROGRESS").length;
                const urgentCount = userData.tasks.filter(t => t.priority === "URGENT" || t.priority === "HIGH").length;

                let taskText = `You have ** ${userData.tasks.length} tasks ** total: ${todoCount} to do, ${inProgressCount} in progress.`;
                if (urgentCount > 0) taskText += `\n\n**Attention:** You have ${urgentCount} high priority tasks!`;

                if (userData.tasks.length > 0) {
                    taskText += "\n\nRecent tasks:";
                    userData.tasks.slice(0, 3).forEach(t => {
                        taskText += `\n* ${t.title} (${t.status.replace("_", " ")})`;
                    });
                }
                fallback = taskText + `\n\nCheck the Tasks page for full details.`;
            } else if (isLeaveQuery) {
                const pendingCount = userData.leaves.filter(l => l.status === "PENDING").length;
                const approvedCount = userData.leaves.filter(l => l.status === "APPROVED").length;
                fallback = `Leaves: ${pendingCount} pending, ${approvedCount} approved.\n\nVisit the Leaves page to request time off or check status.`;
            } else if (isAttendanceQuery) {
                const presentDays = userData.attendance.filter(a => a.status === "PRESENT").length;
                const lateDays = userData.attendance.filter(a => a.status === "LATE").length;
                fallback = `Attendance (last ${userData.attendance.length} days): ${presentDays} present, ${lateDays} late.\n\nGo to Attendance to clock in/out.`;
            } else if (isGreeting) {
                const urgentTasks = userData.tasks.filter(t => t.priority === "URGENT" && t.status !== "COMPLETED").length;
                fallback = `Hi ${userData.user.name.split(" ")[0]}! I'm active and ready to help.\n\nQuick Status:\n- Tasks: ${userData.tasks.length} (${urgentTasks} urgent)\n- Messages: ${userData.unreadMessages} unread\n\nAsk me anything!`;
            } else if (isSummaryQuery) {
                fallback = `Your Dashboard Summary\n\n- Tasks: ${userData.tasks.length} total\n- Leaves: ${userData.leaves.filter(l => l.status === "PENDING").length} pending\n- Attendance: ${userData.attendance.filter(a => a.status === "PRESENT").length} present\n- Messages: ${userData.unreadMessages} unread`;
            } else {
                fallback = `I can help you with your dashboard data.\n\nTry asking about:\n- "How many tasks?"\n- "My leave status"\n- "Unread messages"`;
            }
        } else {
            fallback = `Hi! I can help you with:\n- Tasks & priorities\n- Leave requests\n- Attendance records\n- Messages\n\nI encountered a connection issue, but I can still help with basic dashboard questions!`;
        }

        return NextResponse.json({ response: fallback });
    } catch (error) {
        console.error("AI Chat error:", error);
        return NextResponse.json({
            response: "I'm having a moment. Please try again!"
        });
    }
}
