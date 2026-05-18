import { Worker, Job } from "bullmq";
import { prisma } from "../services/prisma_setup/database.js";
import { redisConnection } from "../services/redis/redis.setup.js";
import { sendSessionReminder } from "../services/resend/email.service.js";

const processJob = async (job: Job) => {
    const { name, data } = job;
    console.log(`[BULLMQ: EMAIL WORKER] Processing job ${job.id}, type: ${name}`);

    try {
        if (name === "user.created") {
            const { id, email } = data;
            await prisma.subscriber.create({
                data: {
                    id,
                    email,
                    Settings: {
                        create: {
                            receiveDigests: true,
                            receiveReminders: true
                        }
                    }
                }
            });
            console.log(`[BULLMQ: EMAIL WORKER] Created subscriber for ${email}`);
        }
        else if (name === "user.preferences.updated") {
            const { userId, receiveDigests, receiveReminders, favoriteGenres } = data;
            
            // Delete existing genre preferences to replace them
            await prisma.genrePreference.deleteMany({
                where: { subscriberId: userId }
            });

            // Upsert notification settings
            await prisma.notificationSetting.upsert({
                where: { subscriberId: userId },
                update: { receiveDigests, receiveReminders },
                create: { subscriberId: userId, receiveDigests, receiveReminders }
            });

            // Re-create genre preferences
            if (favoriteGenres && favoriteGenres.length > 0) {
                await prisma.genrePreference.createMany({
                    data: favoriteGenres.map((genre: string) => ({
                        subscriberId: userId,
                        genre
                    }))
                });
            }
            console.log(`[BULLMQ: EMAIL WORKER] Updated preferences for ${userId}`);
        }
        else if (name === "session.reminder") {
            const { userId, email, movieTitle, startTime, hallName } = data;
            
            const subscriber = await prisma.subscriber.findUnique({
                where: { id: userId },
                include: { Settings: true }
            });

            if (subscriber?.Settings?.receiveReminders !== false) {
                const userName = email.split('@')[0];
                
                await sendSessionReminder(email, userName, movieTitle, new Date(startTime).toLocaleString('uk-UA'), hallName);
                
                await prisma.emailLog.create({
                    data: {
                        subscriberId: userId,
                        eventType: "SESSION_REMINDER",
                        status: "SENT"
                    }
                });
                console.log(`[BULLMQ: EMAIL WORKER] Sent session reminder to ${email}`);
            } else {
                console.log(`[BULLMQ: EMAIL WORKER] Skipped session reminder for ${email} due to preferences`);
            }
        }
    }
    catch (error: any) {
        console.error(`[BULLMQ: EMAIL WORKER] Failed to process job ${job.id}: ${error.message}`);
        throw error;
    }
};

export const emailWorker = new Worker('notifierQueue', processJob, {
    connection: redisConnection,
});
