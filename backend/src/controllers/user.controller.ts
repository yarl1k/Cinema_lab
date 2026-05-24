import type { Request, Response } from "express";
import { prisma } from "../services/database/database.js";
import { notifierQueue } from "../services/queue.js";
import axios from "axios";

const NOTIFIER_URL = process.env.NOTIFIER_URL || "http://notifier:3000/api";


export const getMyTickets = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Необхідна авторизація" });
            return;
        }

        const tickets = await prisma.tickets.findMany({
            where: { userId, status: "PURCHASED" },
            include: {
                Seats: true,
                Sessions: { include: { Movies: true, Halls: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({ success: true, data: tickets });
    } catch (error) {
        console.error("getMyTickets error:", error);
        res.status(500).json({ success: false, message: "Помилка отримання квитків" });
    }
};

export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Необхідна авторизація" });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                image: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            res.status(404).json({ success: false, message: "Користувач не знайдений" });
            return;
        }

        let preferences = { receiveDigests: true, receiveReminders: true, favoriteGenres: [] as string[] };
        try {
            const prefRes = await axios.get(`${NOTIFIER_URL}/preferences/${userId}`);
            if (prefRes.data?.success) {
                preferences = prefRes.data.data;
            }
        } catch (e) {
            console.error("Could not fetch preferences for user", userId);
        }

        res.status(200).json({ success: true, data: { ...user, preferences } });
    } catch (error) {
        console.error("getMyProfile error:", error);
        res.status(500).json({ success: false, message: "Помилка отримання профілю" });
    }
};

export const updateUserNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Необхідна авторизація" });
            return;
        }

        const { receiveDigests, receiveReminders, favoriteGenres } = req.body;

        await notifierQueue.add("user.preferences.updated", {
            userId,
            receiveDigests,
            receiveReminders,
            favoriteGenres,
        });

        res.status(200).json({ success: true, message: "Налаштування оновлено" });
    } catch (error) {
        console.error("updateUserNotifications error:", error);
        res.status(500).json({ success: false, message: "Помилка оновлення налаштувань" });
    }
};
