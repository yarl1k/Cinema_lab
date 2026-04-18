import type { Request, Response } from "express";
import { prisma } from "../services/database/database.js";

/**
 * GET /my/tickets — returns all purchased tickets for the authenticated user.
 */
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

/**
 * GET /my/profile — returns authenticated user's profile data.
 */
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

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error("getMyProfile error:", error);
        res.status(500).json({ success: false, message: "Помилка отримання профілю" });
    }
};
