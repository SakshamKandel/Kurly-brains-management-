import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const { GET, POST } = await import("@/app/api/users/route");

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

function makeRequest(url = "http://localhost/api/users", init?: RequestInit) {
    return new Request(url, init);
}

describe("GET /api/users", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return 401 when not authenticated", async () => {
        mockAuth.mockResolvedValue(null as any);

        const res = await GET();
        const body = await res.json();

        expect(res.status).toBe(401);
        expect(body.error).toBe("Unauthorized");
    });

    it("should return users list when authenticated", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "user-1", role: "ADMIN" },
        } as any);

        const mockUsers = [
            { id: "u1", email: "admin@test.com", firstName: "Admin", lastName: "User", role: "ADMIN" },
            { id: "u2", email: "staff@test.com", firstName: "Staff", lastName: "User", role: "STAFF" },
        ];

        mockPrisma.user.findMany.mockResolvedValue(mockUsers as any);

        const res = await GET();
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toHaveLength(2);
    });
});

describe("POST /api/users", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return 401 when not authenticated", async () => {
        mockAuth.mockResolvedValue(null as any);

        const res = await POST(
            makeRequest("http://localhost/api/users", {
                method: "POST",
                body: JSON.stringify({ email: "new@test.com", password: "Pass123!", firstName: "New", lastName: "User" }),
            })
        );

        expect(res.status).toBe(401);
    });

    it("should return 403 when STAFF tries to create user", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "staff-1", role: "STAFF" },
        } as any);

        const res = await POST(
            makeRequest("http://localhost/api/users", {
                method: "POST",
                body: JSON.stringify({ email: "new@test.com", password: "Pass123!", firstName: "New", lastName: "User" }),
            })
        );
        const body = await res.json();

        expect(res.status).toBe(403);
        expect(body.error).toBe("Forbidden");
    });

    it("should return 403 when MANAGER tries to create user", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "mgr-1", role: "MANAGER" },
        } as any);

        const res = await POST(
            makeRequest("http://localhost/api/users", {
                method: "POST",
                body: JSON.stringify({ email: "new@test.com", password: "Pass123!", firstName: "New", lastName: "User" }),
            })
        );

        expect(res.status).toBe(403);
    });

    it("should return 400 when email already exists", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "admin-1", role: "ADMIN" },
        } as any);

        mockPrisma.user.findUnique.mockResolvedValue({ id: "existing-user" } as any);

        const res = await POST(
            makeRequest("http://localhost/api/users", {
                method: "POST",
                body: JSON.stringify({ email: "existing@test.com", password: "Pass123!", firstName: "Dup", lastName: "User" }),
            })
        );
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBe("Email already exists");
    });

    it("should create user with mustChangePassword=true", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "admin-1", role: "ADMIN" },
        } as any);

        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({
            id: "new-user",
            email: "new@test.com",
            firstName: "New",
            lastName: "User",
            role: "STAFF",
            mustChangePassword: true,
        } as any);

        const res = await POST(
            makeRequest("http://localhost/api/users", {
                method: "POST",
                body: JSON.stringify({
                    email: "new@test.com",
                    password: "Pass123!",
                    firstName: "New",
                    lastName: "User",
                }),
            })
        );
        const body = await res.json();

        expect(res.status).toBe(201);
        expect(body.mustChangePassword).toBe(true);
        // Verify mustChangePassword is always set to true for new users
        expect(mockPrisma.user.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    mustChangePassword: true,
                }),
            })
        );
    });

    it("should allow SUPER_ADMIN to create users", async () => {
        mockAuth.mockResolvedValue({
            user: { id: "sa-1", role: "SUPER_ADMIN" },
        } as any);

        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({
            id: "new-user",
            email: "new@test.com",
            firstName: "New",
            lastName: "User",
            role: "ADMIN",
        } as any);

        const res = await POST(
            makeRequest("http://localhost/api/users", {
                method: "POST",
                body: JSON.stringify({
                    email: "new@test.com",
                    password: "Pass123!",
                    firstName: "New",
                    lastName: "User",
                    role: "ADMIN",
                }),
            })
        );

        expect(res.status).toBe(201);
    });
});
