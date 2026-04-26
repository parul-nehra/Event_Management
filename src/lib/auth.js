import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../db/index.js";

const isProd = process.env.NODE_ENV === "production";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    basePath: "/api/auth",
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_SECRET || "",
            enabled: true,
        },
    },
    secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,
    trustedOrigins: [
        "http://localhost:5000",
        "http://localhost:5173",
        "http://localhost:3000",
        "https://event-management-frontend-delta-five.vercel.app",
        "https://event-management-ebon-phi.vercel.app",
        ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ],
    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5,
        },
    },
    advanced: {
        crossSubDomainCookies: {
            enabled: false,
        },
        defaultCookieAttributes: {
            sameSite: isProd ? "none" : "lax",
            secure: isProd,
            httpOnly: true,
            path: "/",
        },
        useSecureCookies: isProd,
        disableCSRFCheck: true,
    },
});
