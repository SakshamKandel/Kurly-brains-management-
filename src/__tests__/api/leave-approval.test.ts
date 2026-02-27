import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const { PUT } = await import("@/app/api/leaves/[id]/route");

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

function makeRequest(url = "http://localhost/api/leaves/leave-1", init?: RequestInit) {
    return new Request(url, init);
}

describe("PUT /api/leaves/[id] — Approval workflow", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return 401 when not authenticated", async () => {
        mockAuth.mockResolvedValue(null as any);

        const res = await PUT(
            makeRequest("http://localhost/api/leaves/leave-1", {
                method: "PUT",
                body: JSON.stringify({ status: "APPROVED" }),
            }),
            { params: Promise.resolve({ id: "leave-1" }) }
        );

        expect(res.status).toBe(401);
    });

    it("should return 403 when STAFF tries to approve", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "staff-1", role: "STAFF" },
        } as any);

        const res = await PUT(
            makeRequest("http://localhost/api/leaves/leave-1", {
                method: "PUT",
                body: JSON.stringify({ status: "APPROVED" }),
            }),
            { params: Promise.resolve({ id: "leave-1" }) }
        );
        const body = await res.json();

        expect(res.status).toBe(403);
        expect(body.error).toBe("Forbidden");
    });

    it("should return 400 for invalid status", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "admin-1", role: "ADMIN" },
        } as any);

        const res = await PUT(
            makeRequest("http://localhost/api/leaves/leave-1", {
                method: "PUT",
                body: JSON.stringify({ status: "INVALID_STATUS" }),
            }),
            { params: Promise.resolve({ id: "leave-1" }) }
        );
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBe("Invalid status");
    });

    it("should allow ADMIN to approve a leave", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "admin-1", role: "ADMIN" },
        } as any);

        mockPrisma.leaveRequest.update.mockResolvedValue({
            id: "leave-1",
            status: "APPROVED",
            approverId: "admin-1",
            requester: { id: "user-1", firstName: "John", lastName: "Doe" },
            approver: { id: "admin-1", firstName: "Admin", lastName: "User" },
        } as any);

        const res = await PUT(
            makeRequest("http://localhost/api/leaves/leave-1", {
                method: "PUT",
                body: JSON.stringify({ status: "APPROVED" }),
            }),
            { params: Promise.resolve({ id: "leave-1" }) }
        );
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.status).toBe("APPROVED");
        expect(mockPrisma.leaveRequest.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    status: "APPROVED",
                    approverId: "admin-1",
                }),
            })
        );
    });

    it("should allow MANAGER to reject a leave", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "mgr-1", role: "MANAGER" },
        } as any);

        mockPrisma.leaveRequest.update.mockResolvedValue({
            id: "leave-1",
            status: "REJECTED",
            approverId: "mgr-1",
        } as any);

        const res = await PUT(
            makeRequest("http://localhost/api/leaves/leave-1", {
                method: "PUT",
                body: JSON.stringify({ status: "REJECTED" }),
            }),
            { params: Promise.resolve({ id: "leave-1" }) }
        );
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.status).toBe("REJECTED");
    });

    it("should allow SUPER_ADMIN to approve a leave", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "sa-1", role: "SUPER_ADMIN" },
        } as any);

        mockPrisma.leaveRequest.update.mockResolvedValue({
            id: "leave-1",
            status: "APPROVED",
        } as any);

        const res = await PUT(
            makeRequest("http://localhost/api/leaves/leave-1", {
                method: "PUT",
                body: JSON.stringify({ status: "APPROVED" }),
            }),
            { params: Promise.resolve({ id: "leave-1" }) }
        );

        expect(res.status).toBe(200);
    });
});
