import type { Request, Response } from "express";
import { prisma } from "../services/database/database.js";
import { logEvent } from "../services/logger.js";

// Hardcoded
const GUEST_USER_ID = 1;
const getCurrentUserId = async (_req: Request): Promise<number> => {
    await prisma.users.upsert({
        where: { id: GUEST_USER_ID },
        update: {},
        create: {
            id: GUEST_USER_ID,
            username: 'guest',
            email: 'guest@cinemalab.local',
            passwordHash: 'not-a-real-hash',
            role: 'user',
        },
    });
    return GUEST_USER_ID;
};


export const getSessionSeats = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessionId = parseInt(req.params.sessionId as string);

        const session = await prisma.sessions.findUnique({
            where: { id: sessionId },
            include: {
                Halls: { include: { Seats: true } },
                Movies: true,
            }
        });

        if (!session) {
            res.status(404).json({ success: false, message: "Сеанс не знайдено" });
            return;
        }

        const tickets = await prisma.tickets.findMany({ where: { sessionId } });
        const now = new Date();
        const ticketsMap = new Map(tickets.map(t => [t.seatId, t]));

        const seatsResponse = session.Halls.Seats.map(seat => {
            const ticket = ticketsMap.get(seat.id);
            let status = "FREE";
            let version = 1;
            let ticketId = null;

            if (ticket) {
                if (ticket.status === "LOCKED" && ticket.lockedUntil && ticket.lockedUntil < now) {
                    status = "FREE";
                } else {
                    status = ticket.status;
                }
                version = ticket.version;
                ticketId = ticket.id;
            }

            return { seatId: seat.id, row: seat.row, seatNumber: seat.seatNumber, status, version, ticketId };
        });

        res.status(200).json({
            success: true,
            data: {
                session: {
                    id: session.id,
                    startTime: session.startTime,
                    hall: { id: session.Halls.id, name: session.Halls.name, rows: session.Halls.rows, seatsPerRow: session.Halls.seatsPerRow },
                    movie: session.Movies,
                },
                seats: seatsResponse,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Помилка отримання місць" });
    }
};


export const lockSeat = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = await getCurrentUserId(req);
        const { sessionId, seatId } = req.body;

        const session = await prisma.sessions.findUnique({
            where: { id: sessionId },
            include: { Halls: { include: { Seats: { where: { id: seatId } } } } }
        });

        if (!session || session.Halls.Seats.length === 0) {
            res.status(400).json({ success: false, message: "Місце не знайдено для цього сеансу" });
            return;
        }

        const existing = await prisma.tickets.findUnique({
            where: { sessionId_seatId: { sessionId, seatId } }
        });

        if (existing) {
            const now = new Date();
            if (existing.status === "LOCKED" && existing.lockedUntil && existing.lockedUntil < now) {
                await prisma.tickets.delete({ where: { id: existing.id } });
            } else {
                res.status(409).json({ success: false, message: "Місце вже зайнято" });
                return;
            }
        }

        const lockedUntil = new Date(Date.now() + 10 * 60 * 1000);

        const ticket = await prisma.tickets.create({
            data: {
                userId,
                sessionId,
                seatId,
                status: "LOCKED",
                lockedUntil,
                price: 220,
            }
        });

        res.status(201).json({ success: true, data: ticket });
    } catch (error) {
        console.error("lockSeat error:", error);
        res.status(500).json({ success: false, message: "Помилка бронювання місця" });
    }
};



export const cancelLock = async (req: Request, res: Response): Promise<void> => {
    try {
        const ticketId = parseInt(req.params.id as string);

        const ticket = await prisma.tickets.findUnique({ where: { id: ticketId } });

        if (!ticket || ticket.status !== "LOCKED") {
            res.status(404).json({ success: false, message: "Бронювання не знайдено" });
            return;
        }

        await prisma.tickets.delete({ where: { id: ticketId } });

        res.status(200).json({ success: true, message: "Бронювання скасовано" });
    } catch (error) {
        console.error("cancelLock error:", error);
        res.status(500).json({ success: false, message: "Помилка скасування" });
    }
};



export const purchaseTicket = async (req: Request, res: Response): Promise<void> => {
    try {
        const { ticketIds, customerName, customerPhone, customerEmail } = req.body;
        const userId = await getCurrentUserId(req);

        if (!ticketIds || ticketIds.length === 0) {
            res.status(400).json({ success: false, message: "Не обрано квитків" });
            return;
        }

        const tickets = await prisma.tickets.findMany({
            where: { id: { in: ticketIds }, userId, status: "LOCKED" }
        });

        if (tickets.length !== ticketIds.length) {
            res.status(400).json({ success: false, message: "Деякі квитки недійсні або вже не заброньовані" });
            return;
        }

        const orderNumber = `CL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        await prisma.tickets.updateMany({
            where: { id: { in: ticketIds } },
            data: {
                status: "PURCHASED",
                lockedUntil: null,
            }
        });

        for (const t of tickets) {
            await prisma.tickets.update({
                where: { id: t.id },
                data: { ticketNumber: `${orderNumber}-${t.id}` }
            });
        }

        await logEvent("PURCHASE_TICKETS", await getCurrentUserId(req), "Tickets", undefined);

        const purchased = await prisma.tickets.findMany({
            where: { id: { in: ticketIds } },
            include: {
                Seats: true,
                Sessions: { include: { Movies: true, Halls: true } },
            }
        });

        res.status(200).json({
            success: true,
            data: {
                orderNumber,
                tickets: purchased,
            }
        });
    } catch (error) {
        console.error("purchaseTicket error:", error);
        res.status(500).json({ success: false, message: "Помилка покупки квитків" });
    }
};