import type { Request, Response } from "express";
import { prisma } from "../services/prisma_setup/database.js";

export const getPreferences = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId as string;
        const subscriber = await prisma.subscriber.findUnique({
            where: { id: userId },
            include: { Settings: true, Preferences: true }
        });

        if (!subscriber) {
            res.status(404).json({ success: false, message: "Subscriber not found" });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                receiveDigests: subscriber.Settings?.receiveDigests ?? true,
                receiveReminders: subscriber.Settings?.receiveReminders ?? true,
                favoriteGenres: subscriber.Preferences.map((p: any) => p.genre)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
