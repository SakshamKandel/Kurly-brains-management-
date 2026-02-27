import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Import the route handlers
// We need to dynamically import since they use NextResponse
const { GET, POST } = await import("@/app/api/tasks/route");

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

function makeRequest(url = "http://localhost/api/tasks", init?: RequestInit) {
    return new Request(url, init);
}

describe("GET /api/tasks", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return 401 when not authenticated", async () => {
        mockAuth.mockResolvedValue(null as any);

        const res = await GET(makeRequest());
        const body = await res.json();

        expect(res.status).toBe(401);
        expect(body.error).toBe("Unauthorized");
    });

    it("should return all tasks for SUPER_ADMIN", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "user-1", role: "SUPER_ADMIN" },
        } as any);

        mockPrisma.user.findUnique.mockResolvedValue({ role: "SUPER_ADMIN", email: "admin@test.com" } as any);
        mockPrisma.task.findMany.mockResolvedValue([
            { id: "task-1", title: "Test Task", status: "TODO", priority: "MEDIUM" },
        ] as any);

        const res = await GET(makeRequest());
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toHaveLength(1);
        expect(body[0].title).toBe("Test Task");
        // SUPER_ADMIN should NOT have OR clause (sees all tasks)
        expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.not.objectContaining({ OR: expect.anything() }),
            })
        );
    });

    it("should filter tasks by user for non-admin", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "user-2", role: "STAFF" },
        } as any);

        mockPrisma.user.findUnique.mockResolvedValue({ role: "STAFF", email: "staff@test.com" } as any);
        mockPrisma.task.findMany.mockResolvedValue([]);

        await GET(makeRequest());

        // Staff should have OR clause (only their tasks)
        expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    OR: [
                        { assigneeId: "user-2" },
                        { creatorId: "user-2" },
                    ],
                }),
            })
        );
    });

    it("should filter by status query param", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "user-1", role: "SUPER_ADMIN" },
        } as any);

        mockPrisma.user.findUnique.mockResolvedValue({ role: "SUPER_ADMIN" } as any);
        mockPrisma.task.findMany.mockResolvedValue([]);

        await GET(makeRequest("http://localhost/api/tasks?status=TODO"));

        expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ status: "TODO" }),
            })
        );
    });
});

describe("POST /api/tasks", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return 401 when not authenticated", async () => {
        mockAuth.mockResolvedValue(null as any);

        const res = await POST(
            makeRequest("http://localhost/api/tasks", {
                method: "POST",
                body: JSON.stringify({ title: "New Task" }),
            })
        );
        const body = await res.json();

        expect(res.status).toBe(401);
        expect(body.error).toBe("Unauthorized");
    });

    it("should return 400 when title is missing", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "user-1", role: "STAFF" },
        } as any);

        const res = await POST(
            makeRequest("http://localhost/api/tasks", {
                method: "POST",
                body: JSON.stringify({ description: "No title" }),
            })
        );
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBe("Title is required");
    });

    it("should create a task successfully", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "user-1", role: "STAFF" },
        } as any);

        const mockTask = {
            id: "new-task-1",
            title: "My Task",
            priority: "HIGH",
            status: "TODO",
            creatorId: "user-1",
            creator: { id: "user-1", firstName: "John", lastName: "Doe" },
            assignee: null,
        };

        mockPrisma.task.create.mockResolvedValue(mockTask as any);

        const res = await POST(
            makeRequest("http://localhost/api/tasks", {
                method: "POST",
                body: JSON.stringify({ title: "My Task", priority: "HIGH" }),
            })
        );
        const body = await res.json();

        expect(res.status).toBe(201);
        expect(body.title).toBe("My Task");
        expect(mockPrisma.task.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    title: "My Task",
                    priority: "HIGH",
                    creatorId: "user-1",
                }),
            })
        );
    });
});
