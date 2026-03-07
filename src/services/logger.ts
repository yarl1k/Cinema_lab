import { prisma } from "./database/database.js";

export const logEvent = async (
    eventType: string,
    userId: number | null,
    entityType?: string,
    entityId?: number,
    metadata?: object
) => {
    try {
        await prisma.eventLogs.create({
            data: {
                eventType,
                userId,
                entityType,
                entityId,
                metadata: metadata ? JSON.stringify(metadata) : null,
            }
        });
    } catch (error) {
        console.error("Помилка запису логу:", error);
    }
};