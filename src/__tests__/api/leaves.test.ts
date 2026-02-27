import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const { GET, POST } = await import("@/app/api/leaves/route");

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

function makeRequest(url = "http://localhost/api/leaves", init?: RequestInit) {
    return new Request(url, init);
}

describe("GET /api/leaves", () => {
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

    it("should return all leaves for ADMIN", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "admin-1", role: "ADMIN" },
        } as any);

        const mockLeaves = [
            { id: "l1", type: "ANNUAL", status: "PENDING", requester: { id: "u1", firstName: "John", lastName: "Doe" } },
            { id: "l2", type: "SICK", status: "APPROVED", requester: { id: "u2", firstName: "Jane", lastName: "Smith" } },
        ];

        mockPrisma.leaveRequest.findMany.mockResolvedValue(mockLeaves as any);

        const res = await GET(makeRequest());
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toHaveLength(2);
        // Admin should NOT have requesterId filter
        expect(mockPrisma.leaveRequest.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.not.objectContaining({ requesterId: expect.anything() }),
            })
        );
    });

    it("should filter by requesterId for STAFF", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "staff-1", role: "STAFF" },
        } as any);

        mockPrisma.leaveRequest.findMany.mockResolvedValue([]);

        await GET(makeRequest());

        // Staff should only see their own leaves
        expect(mockPrisma.leaveRequest.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ requesterId: "staff-1" }),
            })
        );
    });

    it("should filter by status query param", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "admin-1", role: "ADMIN" },
        } as any);

        mockPrisma.leaveRequest.findMany.mockResolvedValue([]);

        await GET(makeRequest("http://localhost/api/leaves?status=PENDING"));

        expect(mockPrisma.leaveRequest.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ status: "PENDING" }),
            })
        );
    });
});

describe("POST /api/leaves", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return 401 when not authenticated", async () => {
        mockAuth.mockResolvedValue(null as any);

        const res = await POST(
            makeRequest("http://localhost/api/leaves", {
                method: "POST",
                body: JSON.stringify({ type: "ANNUAL", startDate: "2024-06-01", endDate: "2024-06-05", reason: "Vacation" }),
            })
        );

        expect(res.status).toBe(401);
    });

    it("should return 400 when required fields are missing", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "user-1", role: "STAFF" },
        } as any);

        const res = await POST(
            makeRequest("http://localhost/api/leaves", {
                method: "POST",
                body: JSON.stringify({ type: "ANNUAL", startDate: "2024-06-01" }),
                // Missing endDate and reason
            })
        );
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBe("All fields required");
    });

    it("should create a leave request successfully", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "user-1", role: "STAFF" },
        } as any);

        const mockLeave = {
            id: "leave-1",
            type: "ANNUAL",
            startDate: new Date("2024-06-01"),
            endDate: new Date("2024-06-05"),
            reason: "Vacation",
            status: "PENDING",
            requesterId: "user-1",
            requester: { id: "user-1", firstName: "John", lastName: "Doe" },
        };

        mockPrisma.leaveRequest.create.mockResolvedValue(mockLeave as any);

        const res = await POST(
            makeRequest("http://localhost/api/leaves", {
                method: "POST",
                body: JSON.stringify({
                    type: "ANNUAL",
                    startDate: "2024-06-01",
                    endDate: "2024-06-05",
                    reason: "Vacation",
                }),
            })
        );
        const body = await res.json();

        expect(res.status).toBe(201);
        expect(body.type).toBe("ANNUAL");
        expect(mockPrisma.leaveRequest.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    type: "ANNUAL",
                    requesterId: "user-1",
                }),
            })
        );
    });
});
