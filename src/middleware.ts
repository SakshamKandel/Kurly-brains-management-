import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login") ||
        req.nextUrl.pathname.startsWith("/register");
    const isApiRoute = req.nextUrl.pathname.startsWith("/api");
    const isPublicRoute = req.nextUrl.pathname === "/";

    // Whitelist: NextAuth endpoints must always be accessible
    const isAuthApi = req.nextUrl.pathname.startsWith("/api/auth");

    if (isAuthApi) {
        return NextResponse.next();
    }

    // Block unauthenticated API requests (safety net for all routes)
    if (isApiRoute && !isLoggedIn) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Allow authenticated API requests through (routes handle role checks)
    if (isApiRoute) {
        return NextResponse.next();
    }

    // Redirect logged-in users away from auth pages
    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect dashboard routes
    if (!isLoggedIn && !isAuthPage && !isPublicRoute) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

