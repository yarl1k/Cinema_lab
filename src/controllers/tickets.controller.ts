import type { Request, Response } from "express";
import { prisma } from "../services/database/database.js";

export const getSessionSeats = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessionId = parseInt(req.params.sessionId as string);

        const session = await prisma.sessions.findUnique({
            where: { id: sessionId },
            include: { Halls: { include: { Seats: true } } }
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

        res.status(200).json({ success: true, data: seatsResponse });
    } catch (error) {
        res.status(500).json({ success: false, message: "Помилка отримання місць" });
    }
};


export const lockSeat = async (req: Request, res: Response): Promise<void> => {
    try {
        throw new Error("Ще не реалізовано");
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Помилка бронювання місця" });
    }
    
};

export const cancelLock = async (req: Request, res: Response): Promise<void> => {
    try {
        throw new Error("Ще не реалізовано");
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Помилка бронювання місця" });
    }
};

export const purchaseTicket = async (req: Request, res: Response): Promise<void> => {
    try {
        throw new Error("Ще не реалізовано");
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Помилка бронювання місця" });
    }
};