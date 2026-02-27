import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// --- Types ---

interface FullUserData {
    user: {
        id: string; // Added ID for logic
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
    credentialCount: number;
}

// --- Data Fetching ---

async function getFullUserData(userId: string): Promise<FullUserData | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
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
                id: user.id,
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
            credentialCount: user.assignedCredentials.length,
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
    }

    if (data.credentialCount > 0) {
        lines.push(`\nSHARED CREDENTIALS: ${data.credentialCount} credential(s) assigned (details hidden for security)`);
    }

    return lines.join("\n");
}

// --- Action Logic ---

async function handleAction(userId: string, actionType: string, actionData: any): Promise<string> {
    console.log(`[Action Mode] Executing ${actionType}`, actionData);

    try {
        const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
        if (!userExists) {
            return "❌ Action failed: authenticated user not found in database.";
        }
        if (actionType === "create_task") {
            const { title, priority = "MEDIUM" } = actionData;
            if (!title) return "❌ Failed: Task title is missing.";

            const task = await prisma.task.create({
                data: {
                    title,
                    status: "TODO",
                    priority: ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority) ? priority : "MEDIUM",
                    creatorId: userId,
                    assigneeId: userId, // Self-assign by default for now
                }
            });
            return `✅ Task created: "${task.title}" (Priority: ${task.priority})`;
        }

        if (actionType === "clock_action") {
            const { action } = actionData; // "IN" or "OUT"
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const existing = await prisma.attendance.findUnique({
                where: {
                    userId_date: { userId, date: today }
                }
            });

            if (action === "IN") {
                if (existing) return "⚠️ You are already clocked in for today.";
                await prisma.attendance.create({
                    data: {
                        userId,
                        date: today, // Fixed time 00:00:00 for uniqueness check
                        clockIn: new Date(),
                        status: "PRESENT"
                    }
                });
                return "✅ Clocked IN successfully.";
            } else if (action === "OUT") {
                if (!existing) return "⚠️ You haven't clocked in yet today.";
                if (existing.clockOut) return "⚠️ You are already clocked out.";
                await prisma.attendance.update({
                    where: { id: existing.id },
                    data: { clockOut: new Date() }
                });
                return "✅ Clocked OUT successfully.";
            }
            return "❌ Invalid attendance action.";
        }

        if (actionType === "create_invoice") {
            // RBAC: Only ADMIN/MANAGER/SUPER_ADMIN can create invoices
            const invoiceUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
            if (!invoiceUser || !["ADMIN", "MANAGER", "SUPER_ADMIN"].includes(invoiceUser.role)) {
                return " Action denied: Only admins/managers can create invoices.";
            }
            const { clientName, amount, description } = actionData;

            // 1. Find or Create Client
            let client = await prisma.client.findFirst({
                where: {
                    name: { equals: clientName, mode: 'insensitive' }
                }
            });

            // Auto-create if not found
            if (!client) {
                client = await prisma.client.create({
                    data: {
                        name: clientName,
                        email: "", // Optional, can be filled later
                        status: "ACTIVE",
                        creatorId: userId
                    }
                });
            }

            // 2. Generate unique Invoice Number
            const year = new Date().getFullYear();
            const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
            const ts = Date.now().toString().slice(-6);
            const invoiceNumber = `INV-${year}-${ts}-${rand}`;

            // 3. Create Invoice
            const invoice = await prisma.invoice.create({
                data: {
                    invoiceNumber,
                    clientId: client.id,
                    creatorId: userId,
                    status: "DRAFT",
                    subtotal: amount,
                    taxAmount: 0,
                    total: amount,
                    items: {
                        create: {
                            description: description || "Consulting Services",
                            quantity: 1,
                            unitPrice: amount,
                            total: amount
                        }
                    }
                }
            });

            return `✅ Invoice #${invoice.invoiceNumber} created for ${client.name} ($${amount}).`;
        }

        return "❌ Unknown action type.";
    } catch (e: any) {
        console.error("Action execution failed:", e);
        return `❌ Action failed: ${e.message}`;
    }
}

// --- Main Route ---

export async function POST(request: Request) {
    try {
        const session = await auth();
        const sessionUserId = session?.user?.id || null;
        const { prompt } = await request.json();

        if (!prompt || typeof prompt !== "string") {
            return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
        }

        let userData: FullUserData | null = null;
        let contextStr = "";
        let userId: string | null = null;

        if (sessionUserId) {
            const userExists = await prisma.user.findUnique({ where: { id: sessionUserId }, select: { id: true } });
            if (userExists) {
                userId = sessionUserId;
            }
        }

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
1. Identity: You are Kurly AI, the "Brain" of this dashboard.
2. Tone: Professional, direct, and helpful. Be conversational but concise.
3. Capabilities: You can READ data (provided above) and PERFORM ACTIONS.
4. **LANGUAGE & TRANSLATION**:
   - You are a POLYGLOT assistant (English, Hindi, Nepali).
   - If the user speaks/types in HINDI or NEPALI:
     a. **INTERNALLY TRANSLATE** the request to English to understand the intent.
     b. Execute the logic/action based on the English meaning.
     c. **REPLY IN ENGLISH ONLY**, regardless of user language.
   - Example (Hindi): User "Mera attendance laga do" -> You understand "Clock me in" -> You perform action -> You reply "✅ You have been clocked in."

*** ACTION MODE ***
If the user asks to perform an action (create task, invoice, attendance), you MUST output a special JSON string at the end of your response.
Format: [[ACTION:{"type":"...", "data":{...}}]]

Supported Actions:
A. Create Task:
   User: "Remind me to check servers tomorrow"
   Output: [[ACTION:{"type":"create_task", "data":{"title":"Check servers", "priority":"MEDIUM"}}]]

B. Clock In/Out:
   User: "Clock me in"
   Output: [[ACTION:{"type":"clock_action", "data":{"action":"IN"}}]]
   (Use "OUT" to clock out)

C. Create Invoice:
   User: "Draft invoice for Acme Corp for $500"
   Output: [[ACTION:{"type":"create_invoice", "data":{"clientName":"Acme Corp", "amount":500, "description":"Services"}}]]

RULES:
- Only output ONE action per response.
- If data is missing (e.g. client name), ask the user for it instead of acting.
- Continue to be chatty. Example: "I'll create that task for you. [[ACTION:...]]"
- IMPORTANT: The ACTION JSON must always be in ENGLISH keys/values as specified above, even if the user speaks another language.
`;

                const response = await fetch("https://api.perplexity.ai/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "sonar", // Using 'sonar' (formerly llama-3-sonar-large-32k-online)
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: prompt }
                        ],
                        max_tokens: 1024,
                        temperature: 0.1, // Lower temperature for reliable actions
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    let aiResponse = data.choices?.[0]?.message?.content;

                    if (aiResponse) {
                        // Check for ACTION token
                        const actionMatch = aiResponse.match(/\[\[ACTION:(.*?)\]\]/);

                        // Clean response for the user (remove the raw JSON token)
                        let textResponse = aiResponse.replace(/\[\[ACTION:.*?\]\]/, "").trim();

                        if (actionMatch && userId) {
                            try {
                                const actionJson = JSON.parse(actionMatch[1]);
                                const actionResult = await handleAction(userId, actionJson.type, actionJson.data);

                                // Append result to the AI's text response
                                textResponse += `\n\n${actionResult}`;
                            } catch (e) {
                                console.error("Failed to parse/execute AI action:", e);
                                textResponse += "\n\n(I tried to perform the action, but something went wrong.)";
                            }
                        }

                        // Remove citations if any
                        textResponse = textResponse.replace(/\[\d+\]/g, "").replace(/\*\*/g, "");

                        return NextResponse.json({ response: textResponse });
                    }
                }
            } catch (apiError) {
                console.error("Perplexity API exception:", apiError);
            }
        }

        // Fallback for no API key or non-action requests in local dev without key
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
