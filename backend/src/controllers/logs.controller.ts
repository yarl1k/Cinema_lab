import type { Request, Response } from "express";
import { prisma } from "../services/database/database.js";

export const getLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const logs = await prisma.eventLogs.findMany({
            take: 100,
            orderBy: { createdAt: 'desc' },
            include: { User: { select: { email: true, name: true } } }
        });
        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Помилка отримання логів" });
    }
};