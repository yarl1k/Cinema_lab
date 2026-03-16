import type { Request, Response } from "express";
import { prisma } from "../services/database/database.js";
import { logEvent } from "../services/logger.js";

export const getHalls = async (req: Request, res: Response): Promise<void> => {
    try {
        const halls = await prisma.halls.findMany({
            orderBy: { id: 'asc' }
        });
        res.status(200).json({ success: true, data: halls });
    } catch (error) {
        res.status(500).json({ success: false, message: "Помилка отримання залів" });
    }
};


export const getHallSessions = async (req: Request, res: Response): Promise<void> => {
    try {
        const hallId = parseInt(req.params.id as string);
        const sessions = await prisma.sessions.findMany({
            where: { hallId },
            include: { Movies: { select: { duration: true, title: true } } }
        });
        res.status(200).json({ success: true, data: sessions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Помилка отримання розкладу залу" });
    }
};


export const createHall = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body?.user?.id;
        const { name, rows, seatsPerRow } = req.body;

        const existingHall = await prisma.halls.findFirst({
            where: { name: name.trim() }
        });

        if (existingHall) {
            res.status(400).json({ success: false, message: `Зал з назвою "${name}" вже існує.` });
            return;
        }

        const newHall = await prisma.$transaction(async (tx) => {
            const hall = await tx.halls.create({
                data: { name: name.trim(), rows: Number(rows), seatsPerRow: Number(seatsPerRow), isActive: true }
            });

            const seatsData = [];
            for (let r = 1; r <= hall.rows; r++) {
                for (let s = 1; s <= hall.seatsPerRow; s++) {
                    seatsData.push({ hallId: hall.id, row: r, seatNumber: s });
                }
            }
            await tx.seats.createMany({ data: seatsData });
            return hall;
        });

        await logEvent("CREATE_HALL", adminId, "Halls", newHall.id);
        res.status(201).json({ success: true, data: newHall });
    } catch (error) {
        res.status(500).json({ success: false, message: "Сталася помилка при створенні залу" });
    }
};


export const toggleHallStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const hallId = parseInt(req.params.id as string);
        const adminId = req.body?.user?.id;


        const hall = await prisma.halls.findUnique({ where: { id: hallId } });
        if (!hall) {
            res.status(404).json({ success: false, message: "Зал не знайдено" });
            return;
        }


        const updatedHall = await prisma.halls.update({
            where: { id: hallId },
            data: { isActive: !hall.isActive }
        });

        await logEvent("TOGGLE_HALL_STATUS", adminId, "Halls", hallId);
        res.status(200).json({ success: true, data: updatedHall, message: "Статус залу змінено" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Помилка зміни статусу залу" });
    }
};


export const deleteHall = async (req: Request, res: Response): Promise<void> => {
    try {
        const hallId = parseInt(req.params.id as string);
        const adminId = req.body?.user?.id;
        const ticketsCount = await prisma.tickets.count({
            where: {
                OR: [
                    { Sessions: { hallId: hallId } },
                    { Seats: { hallId: hallId } }
                ]
            }
        });
        if (ticketsCount > 0) {
            res.status(400).json({
                success: false,
                message: "Не можна видалити зал, оскільки на його сеанси вже продано квитки!"
            });
            return;
        }

        await prisma.$transaction([
            prisma.sessions.deleteMany({ where: { hallId } }),
            prisma.seats.deleteMany({ where: { hallId } }),
            prisma.halls.delete({ where: { id: hallId } })
        ]);

        await logEvent("DELETE_HALL", adminId, "Halls", hallId);
        res.status(200).json({ success: true, message: "Зал успішно видалено" });
    } catch (error) {
        console.error("Помилка видалення залу:", error);
        res.status(500).json({
            success: false,
            message: "Не вдалося видалити зал. Перевірте консоль сервера."
        });
    }
};