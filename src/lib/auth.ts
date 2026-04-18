import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';
import { prisma } from '../services/database/database.js';
import { sendEmail, getVerificationEmailHtml, getResetPasswordEmailHtml } from './email.js';

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
            void sendEmail({
                to: user.email,
                subject: 'Скидання паролю — CinemaLab',
                html: getResetPasswordEmailHtml(url, user.name),
            });
        },
    },

    emailVerification: {
        sendOnSignUp: true,
        sendVerificationEmail: async ({ user, url }) => {
            void sendEmail({
                to: user.email,
                subject: 'Підтвердіть email — CinemaLab',
                html: getVerificationEmailHtml(url, user.name),
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

    plugins: [
        admin(),
    ],
});
