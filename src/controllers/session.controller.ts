import type { Request, Response } from "express";
import { prisma } from "../services/database/database.js";
import { logEvent } from "../services/logger.js";

// --- ДОПОМІЖНА ФУНКЦІЯ ДЛЯ БЕЗПЕКИ ---
const getSafeAdminId = (req: Request) => {
    // Перевіряємо всі можливі місця, де може бути ID юзера, 
    // щоб не було помилки "reading properties of undefined"
    return req.body?.user?.id || (req as any).user?.id || null;
};

export const getMovieSessions = async (req: Request, res: Response): Promise<void> => {
    try {
        const movieId = parseInt(req.params.id as string);
        const sessions = await prisma.sessions.findMany({
            where: { movieId },
            include: { Halls: true },
            orderBy: { startTime: 'asc' }
        });
        res.status(200).json({ success: true, data: sessions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Помилка отримання сесій" });
    }
};

export const createSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = getSafeAdminId(req);
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
        const adminId = getSafeAdminId(req);

        const session = await prisma.sessions.update({
            where: { id: sessionId },
            data: { startTime: new Date(startTime) }
        });

        await logEvent("UPDATE_SESSION", adminId, "Sessions", session.id);
        res.status(200).json({ success: true, data: session });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Помилка оновлення сеансу" });
    }
};

export const createSessionBatch = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = getSafeAdminId(req);
        const { sessions } = req.body; 

        if (!sessions || sessions.length === 0) {
            res.status(400).json({ success: false, message: "Немає сеансів для збереження" });
            return;
        }

        const formattedSessions = sessions.map((s: any) => ({
            movieId: Number(s.movieId),
            hallId: Number(s.hallId),
            startTime: new Date(s.startTime) 
        }));

        const result = await prisma.sessions.createMany({
            data: formattedSessions
        });

        await logEvent("CREATE_SESSION_BATCH", adminId, "Sessions", undefined);
        
        res.status(201).json({ success: true, message: `Успішно згенеровано ${result.count} сеансів` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Помилка масового створення" });
    }
};

export const deleteSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessionId = parseInt(req.params.id as string);
        const adminId = getSafeAdminId(req);

        if (isNaN(sessionId)) {
            res.status(400).json({ success: false, message: "Некоректний ID сеансу" });
            return;
        }

        // 1. Перевірка на квитки
        const ticketsCount = await prisma.tickets.count({
            where: { sessionId: sessionId }
        });

        if (ticketsCount > 0) {
            res.status(400).json({ success: false, message: "Неможливо видалити: на сеанс є квитки" });
            return;
        }

        // 2. Видалення
        await prisma.sessions.delete({ where: { id: sessionId } });

        if (adminId) {
            await logEvent("DELETE_SESSION", adminId, "Sessions", sessionId);
        }
        
        res.status(200).json({ success: true, message: "Сеанс видалено" });
    } catch (error) {
        console.error("Помилка видалення сеансу:", error);
        res.status(500).json({ success: false, message: "Не вдалося видалити сеанс" });
    }
};

export const deleteAllMovieSessions = async (req: Request, res: Response): Promise<void> => {
    try {
        const movieId = parseInt(req.params.id as string);
        const adminId = getSafeAdminId(req);

        if (isNaN(movieId)) {
            res.status(400).json({ success: false, message: "Некоректний ID фільму" });
            return;
        }

        const ticketsCount = await prisma.tickets.count({
            where: { Sessions: { movieId: movieId } }
        });

        if (ticketsCount > 0) {
            res.status(400).json({ success: false, message: "Видалення заблоковано: є сеанси з квитками" });
            return;
        }

        const deleted = await prisma.sessions.deleteMany({
            where: { movieId: movieId }
        });

        if (adminId) {
            await logEvent("DELETE_ALL_SESSIONS", adminId, "Movies", movieId);
        }

        res.status(200).json({ success: true, message: `Видалено ${deleted.count} сеансів` });
    } catch (error) {
        console.error("Помилка масового видалення:", error);
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
};