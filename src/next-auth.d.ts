
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: "ADMIN" | "STAFF" | "SUPER_ADMIN" | "MANAGER";
            mustChangePassword?: boolean;
            image?: string | null;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        role: "ADMIN" | "STAFF" | "SUPER_ADMIN" | "MANAGER";
        mustChangePassword?: boolean;
        avatar?: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: "ADMIN" | "STAFF" | "SUPER_ADMIN" | "MANAGER";
        mustChangePassword?: boolean;
    }
}
