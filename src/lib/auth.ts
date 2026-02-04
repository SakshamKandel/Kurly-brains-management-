import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                });

                if (!user) {
                    return null;
                }

                const passwordMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!passwordMatch) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    role: user.role,
                    mustChangePassword: user.mustChangePassword,
                };
            },
        }),
    ],
    // Callbacks are inherited from authConfig (Edge safe defaults)
    // We override session here because this file runs in Node.js (Server)
    callbacks: {
        ...authConfig.callbacks,
        async session({ session, token }) {
            if (session.user && token.id) {
                // Ensure basics are always set from token first (reliable fallback)
                session.user.id = token.id as string;
                session.user.role = (token.role as string) || "STAFF";
                // @ts-ignore
                session.user.mustChangePassword = !!token.mustChangePassword;

                try {
                    // Try to fetch fresh user data for the latest role/flag
                    // This prevents stale session data when roles/flags are changed by admins
                    const user = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        select: { role: true, mustChangePassword: true, lastActive: true }
                    });

                    if (user) {
                        session.user.role = user.role;
                        // @ts-ignore
                        session.user.mustChangePassword = user.mustChangePassword;

                        // Update lastActive if it's been more than 1 minute
                        const now = new Date();
                        const lastActive = user.lastActive ? new Date(user.lastActive) : new Date(0);
                        if (now.getTime() - lastActive.getTime() > 60 * 1000) {
                            await prisma.user.update({
                                where: { id: token.id as string },
                                data: { lastActive: now },
                            }).catch((err) => {
                                console.error("Failed to update lastActive:", err);
                            });
                        }
                    }
                } catch (error) {
                    // Log error but keep session alive with token data
                    console.error("Session database sync error:", error);
                }
            }
            return session;
        },
    },
});
