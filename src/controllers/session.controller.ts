import type { Request, Response } from "express";
import { prisma } from "../services/database/database.js";
import { logEvent } from "../services/logger.js";

export const getMovieSessions = async (req: Request, res: Response): Promise<void> => {
    try {
        const movieId = parseInt(req.params.id as string);
        const sessions = await prisma.sessions.findMany({
            where: { movieId },
            include: { Halls: true }
        });
        res.status(200).json({ success: true, data: sessions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Помилка отримання сесій фільму" });
    }
};

export const createSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.user?.id;
        const { movieId, hallId, startTime } = req.body;
        const newSession = await prisma.sessions.create({
            data: { movieId, hallId, startTime: new Date(startTime) }
        });
        await logEvent("CREATE_SESSION", adminId, "Sessions", newSession.id);
        res.status(201).json({ success: true, data: newSession });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Помилка створення сеансу" });
    }
};

export const updateSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessionId = parseInt(req.params.id as string);
        const { startTime } = req.body;
        const adminId = req.body.user.id;

        const session = await prisma.sessions.update({
            where: { id: sessionId },
            data: { startTime: new Date(startTime) }
        });

        await logEvent("UPDATE_SESSION", adminId, "Sessions", session.id);
        res.status(200).json({ success: true, data: session });
    } catch (error) {
        res.status(500).json({ success: false, message: "Помилка оновлення сеансу" });
    }
};

export const deleteSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessionId = parseInt(req.params.id as string);
        const adminId = req.body.user.id;

        await prisma.sessions.delete({ where: { id: sessionId } });

        await logEvent("DELETE_SESSION", adminId, "Sessions", sessionId);
        res.status(200).json({ success: true, message: "Сеанс видалено" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Помилка видалення сеансу" });
    }
};