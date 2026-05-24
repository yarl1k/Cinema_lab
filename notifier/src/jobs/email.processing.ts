import { Worker, Job } from "bullmq";
import { prisma } from "../services/prisma_setup/database.js";
import { redisConnection } from "../services/redis/redis.setup.js";
import { sendMail } from "../services/resend/email.service.js";
import {
    renderVerificationEmail,
    renderResetPasswordEmail,
    renderTicketsEmail,
    renderSessionReminder,
} from "../services/templates/template-renderer.js";

const processJob = async (job: Job) => {
    const { name, data } = job;
    console.log(`[BULLMQ: EMAIL WORKER] Processing job ${job.id}, type: ${name}`);

    try {
        // ── Subscriber Management ───────────────────────────────

        if (name === "user.created") {
            const { id, email } = data;
            await prisma.subscriber.create({
                data: {
                    id,
                    email,
                    Settings: {
                        create: {
                            receiveDigests: true,
                            receiveReminders: true,
                        },
                    },
                },
            });
            console.log(`[BULLMQ: EMAIL WORKER] Created subscriber for ${email}`);
        }

        else if (name === "user.preferences.updated") {
            const { userId, receiveDigests, receiveReminders, favoriteGenres } = data;

            await prisma.genrePreference.deleteMany({
                where: { subscriberId: userId },
            });

            await prisma.notificationSetting.upsert({
                where: { subscriberId: userId },
                update: { receiveDigests, receiveReminders },
                create: { subscriberId: userId, receiveDigests, receiveReminders },
            });

            if (favoriteGenres && favoriteGenres.length > 0) {
                await prisma.genrePreference.createMany({
                    data: favoriteGenres.map((genre: string) => ({
                        subscriberId: userId,
                        genre,
                    })),
                });
            }
            console.log(`[BULLMQ: EMAIL WORKER] Updated preferences for ${userId}`);
        }

        // ── Auth Emails ─────────────────────────────────────────

        else if (name === "email.verification") {
            const { email, url, userName } = data;
            const html = renderVerificationEmail(url, userName);
            await sendMail(email, "Підтвердіть email — CinemaLab", html);
            console.log(`[BULLMQ: EMAIL WORKER] Sent verification email to ${email}`);
        }

        else if (name === "email.reset-password") {
            const { email, url, userName } = data;
            const html = renderResetPasswordEmail(url, userName);
            await sendMail(email, "Скидання паролю — CinemaLab", html);
            console.log(`[BULLMQ: EMAIL WORKER] Sent reset-password email to ${email}`);
        }

        // ── Ticket Emails ───────────────────────────────────────

        else if (name === "email.tickets") {
            const { email, userName, movieTitle, startTime, hallName, tickets, orderNumber } = data;
            const html = renderTicketsEmail(userName, movieTitle, startTime, hallName, tickets, orderNumber);
            await sendMail(email, `Ваші квитки на: ${movieTitle}`, html);
            console.log(`[BULLMQ: EMAIL WORKER] Sent tickets email to ${email}`);
        }

        // ── Session Reminder ────────────────────────────────────

        else if (name === "session.reminder") {
            const { userId, email, movieTitle, startTime, hallName } = data;

            const subscriber = await prisma.subscriber.findUnique({
                where: { id: userId },
                include: { Settings: true },
            });

            if (subscriber?.Settings?.receiveReminders !== false) {
                const userName = email.split("@")[0];
                const formattedTime = new Date(startTime).toLocaleString("uk-UA", {
                    timeZone: "Europe/Kyiv",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                });

                const html = renderSessionReminder(userName, movieTitle, formattedTime, hallName);
                await sendMail(email, `Нагадування: сеанс "${movieTitle}" вже скоро!`, html);

                await prisma.emailLog.create({
                    data: {
                        subscriberId: userId,
                        eventType: "SESSION_REMINDER",
                        status: "SENT",
                    },
                });
                console.log(`[BULLMQ: EMAIL WORKER] Sent session reminder to ${email}`);
            } else {
                console.log(`[BULLMQ: EMAIL WORKER] Skipped session reminder for ${email} due to preferences`);
            }
        }
    } catch (error: any) {
        console.error(`[BULLMQ: EMAIL WORKER] Failed to process job ${job.id}: ${error.message}`);
        throw error;
    }
};

export const emailWorker = new Worker("notifierQueue", processJob, {
    connection: redisConnection,
});
