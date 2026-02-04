import type { NextAuthConfig } from "next-auth";


type UserRole = "ADMIN" | "STAFF" | "SUPER_ADMIN" | "MANAGER";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
                // @ts-ignore
                token.mustChangePassword = user.mustChangePassword;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = (token.role as UserRole) || "STAFF";
                session.user.id = token.id as string;
                // @ts-ignore
                session.user.mustChangePassword = !!token.mustChangePassword;
            }
            return session;
        },
    },
    providers: [], // Providers configured in auth.ts
} satisfies NextAuthConfig;
