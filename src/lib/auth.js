import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../db/index.js";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    basePath: "/api/auth",
    baseURL: process.env.BETTER_AUTH_URL || "https://event-management-ebon-phi.vercel.app",
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
        process.env.FRONTEND_URL || "http://localhost:5173",
        "http://localhost:5173",
        "http://localhost:5000",
        "http://localhost:3000",
        "https://event-management-frontend-delta-five.vercel.app",
        "https://event-management-ebon-phi.vercel.app",
    ],
    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
    },
    advanced: {
        crossSubDomainCookies: {
            enabled: false,
        },
        defaultCookieAttributes: {
            sameSite: "lax",
            secure: true,
            httpOnly: true,
            path: "/",
        },
        useSecureCookies: true,
    },
});
