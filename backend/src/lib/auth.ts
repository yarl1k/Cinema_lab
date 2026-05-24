import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';
import { prisma } from '../services/database/database.js';
import { notifierQueue } from '../services/queue.js';

export const auth = betterAuth({
    basePath: '/api/auth',
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',

    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }),

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url }) => {
            await notifierQueue.add("email.reset-password", {
                email: user.email,
                url,
                userName: user.name,
            });
        },
    },

    emailVerification: {
        sendOnSignUp: true,
        sendVerificationEmail: async ({ user, url }) => {
            await notifierQueue.add("email.verification", {
                email: user.email,
                url,
                userName: user.name,
            });
        },
    },

    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24,      // refresh every 24h
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 min cache
        },
    },
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    await notifierQueue.add("user.created", {
                        id: user.id,
                        email: user.email,
                    });
                },
            },
        },
    },

    plugins: [
        admin(),
    ],
});
