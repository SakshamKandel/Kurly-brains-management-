import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock next-auth
vi.mock("next-auth", () => ({
    default: vi.fn(),
}));

// Mock NextResponse for API route tests
vi.mock("next/server", async () => {
    const actual = await vi.importActual("next/server");
    return {
        ...actual,
        NextResponse: {
            json: (body: unknown, init?: { status?: number }) => {
                const response = new Response(JSON.stringify(body), {
                    status: init?.status || 200,
                    headers: { "Content-Type": "application/json" },
                });
                return response;
            },
        },
    };
});

// Mock prisma
vi.mock("@/lib/prisma", () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        task: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        taskComment: {
            findMany: vi.fn(),
            create: vi.fn(),
        },
        leaveRequest: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        invoice: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    },
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
    auth: vi.fn(),
}));
