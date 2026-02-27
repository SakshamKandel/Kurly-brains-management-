import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const { GET, POST } = await import("@/app/api/tasks/[id]/comments/route");

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

function makeRequest(url = "http://localhost/api/tasks/task-1/comments", init?: RequestInit) {
    return new Request(url, init);
}

const mockParams = { params: Promise.resolve({ id: "task-1" }) };

describe("GET /api/tasks/[id]/comments", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return 401 when not authenticated", async () => {
        mockAuth.mockResolvedValue(null as any);

        const res = await GET(makeRequest(), mockParams);
        const body = await res.json();

        expect(res.status).toBe(401);
        expect(body.error).toBe("Unauthorized");
    });

    it("should return comments sorted by createdAt asc", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "user-1", role: "STAFF" },
        } as any);

        const mockComments = [
            {
                id: "c1",
                content: "First comment",
                createdAt: "2024-01-01",
                user: { id: "user-1", firstName: "John", lastName: "Doe", avatar: null },
            },
            {
                id: "c2",
                content: "Second comment",
                createdAt: "2024-01-02",
                user: { id: "user-2", firstName: "Jane", lastName: "Smith", avatar: null },
            },
        ];

        mockPrisma.taskComment.findMany.mockResolvedValue(mockComments as any);

        const res = await GET(makeRequest(), mockParams);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toHaveLength(2);
        expect(mockPrisma.taskComment.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { taskId: "task-1" },
                orderBy: { createdAt: "asc" },
            })
        );
    });
});

describe("POST /api/tasks/[id]/comments", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return 401 when not authenticated", async () => {
        mockAuth.mockResolvedValue(null as any);

        const res = await POST(
            makeRequest("http://localhost/api/tasks/task-1/comments", {
                method: "POST",
                body: JSON.stringify({ content: "Hello" }),
            }),
            mockParams
        );

        expect(res.status).toBe(401);
    });

    it("should return 400 when content is empty", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "user-1", role: "STAFF" },
        } as any);

        const res = await POST(
            makeRequest("http://localhost/api/tasks/task-1/comments", {
                method: "POST",
                body: JSON.stringify({ content: "   " }),
            }),
            mockParams
        );
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBe("Content is required");
    });

    it("should return 404 when task does not exist", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "user-1", role: "STAFF" },
        } as any);

        mockPrisma.task.findUnique.mockResolvedValue(null);

        const res = await POST(
            makeRequest("http://localhost/api/tasks/task-999/comments", {
                method: "POST",
                body: JSON.stringify({ content: "Hello" }),
            }),
            { params: Promise.resolve({ id: "task-999" }) }
        );
        const body = await res.json();

        expect(res.status).toBe(404);
        expect(body.error).toBe("Task not found");
    });

    it("should create a comment successfully", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "user-1", role: "STAFF" },
        } as any);

        mockPrisma.task.findUnique.mockResolvedValue({ id: "task-1" } as any);
        mockPrisma.taskComment.create.mockResolvedValue({
            id: "comment-1",
            content: "Great progress!",
            taskId: "task-1",
            userId: "user-1",
            user: { id: "user-1", firstName: "John", lastName: "Doe", avatar: null },
        } as any);

        const res = await POST(
            makeRequest("http://localhost/api/tasks/task-1/comments", {
                method: "POST",
                body: JSON.stringify({ content: "  Great progress!  " }),
            }),
            mockParams
        );
        const body = await res.json();

        expect(res.status).toBe(201);
        expect(body.content).toBe("Great progress!");
        // Should trim whitespace
        expect(mockPrisma.taskComment.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    content: "Great progress!",
                    taskId: "task-1",
                    userId: "user-1",
                }),
            })
        );
    });
});
