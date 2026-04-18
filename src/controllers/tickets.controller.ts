import type { Request, Response } from "express";
import { prisma } from "../services/database/database.js";
import { logEvent } from "../services/logger.js";
import { auth } from "../lib/auth.js";
import { sendEmail, getWelcomeGuestEmailHtml, getTicketsEmailHtml } from "../lib/email.js";
import { isValidEmail, isValidName, isValidPhone, isValidPassword, sanitizeInput } from "../lib/validation.js";

// ── Seats ────────────────────────────────────────────────────────────

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

            if (!seat.isAvailable) {
                status = "UNAVAILABLE";
            }

            return {
                seatId: seat.id,
                row: seat.row,
                seatNumber: seat.seatNumber,
                status,
                version,
                ticketId,
                isAvailable: seat.isAvailable,
                unavailableReason: seat.unavailableReason
            };
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


// ── Lock Seat ────────────────────────────────────────────────────────

/**
 * Temporary ID for guests who haven't created an account yet.
 */
const GUEST_TEMP_ID = "guest-temp-lock";

const ensureGuestPlaceholder = async (): Promise<void> => {
    const exists = await prisma.user.findUnique({ where: { id: GUEST_TEMP_ID } });
    if (!exists) {
        await prisma.user.create({
            data: {
                id: GUEST_TEMP_ID,
                name: 'Guest',
                email: 'guest-placeholder@cinemalab.local',
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
    }
};

export const lockSeat = async (req: Request, res: Response): Promise<void> => {
    try {
        // Use authenticated user if available, otherwise use guest placeholder
        const userId = req.user?.id || GUEST_TEMP_ID;

        if (userId === GUEST_TEMP_ID) {
            await ensureGuestPlaceholder();
        }

        const { sessionId, seatId } = req.body;

        const session = await prisma.sessions.findUnique({
            where: { id: sessionId },
            include: { Halls: { include: { Seats: { where: { id: seatId } } } } }
        });

        if (!session || session.Halls.Seats.length === 0) {
            res.status(400).json({ success: false, message: "Місце не знайдено для цього сеансу" });
            return;
        }

        const seat = session.Halls.Seats[0];
        if (!seat.isAvailable) {
            res.status(400).json({ success: false, message: "Місце недоступне для бронювання" });
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


// ── Cancel Lock ──────────────────────────────────────────────────────

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


// ── Purchase ─────────────────────────────────────────────────────────

export const purchaseTicket = async (req: Request, res: Response): Promise<void> => {
    try {
        const { ticketIds, customerName, customerPhone, customerEmail, customerPassword } = req.body;

        if (!ticketIds || ticketIds.length === 0) {
            res.status(400).json({ success: false, message: "Не обрано квитків" });
            return;
        }

        let userId: string;
        let isNewAccount = false;
        let purchaseEmail = '';

        // ── Determine user ───────────────────────────────────────────
        if (req.user) {
            userId = req.user.id;
            purchaseEmail = req.user.email;
        } else {
            // Guest: validate inputs
            const name = sanitizeInput(customerName || '');
            const email = (customerEmail || '').trim().toLowerCase();
            const phone = (customerPhone || '').trim();
            const password = customerPassword || '';
            purchaseEmail = email;

            if (!isValidName(name)) {
                res.status(400).json({ success: false, message: "Введіть коректне ім'я (2-50 символів)" });
                return;
            }
            if (!isValidEmail(email)) {
                res.status(400).json({ success: false, message: "Введіть коректний email" });
                return;
            }
            if (!isValidPhone(phone)) {
                res.status(400).json({ success: false, message: "Формат телефону: +380XXXXXXXXX" });
                return;
            }

            const passwordCheck = isValidPassword(password);
            if (!passwordCheck.valid) {
                res.status(400).json({ success: false, message: passwordCheck.errors.join('. ') });
                return;
            }

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({ where: { email } });

            if (existingUser) {
                userId = existingUser.id;
            } else {
                // Create new account via better-auth API
                const newUser = await auth.api.signUpEmail({
                    body: {
                        name,
                        email,
                        password,
                    },
                });

                if (!newUser) {
                    res.status(500).json({ success: false, message: "Помилка створення акаунту" });
                    return;
                }

                userId = newUser.user.id;
                isNewAccount = true;
            }
        }

        // ── Process purchase ─────────────────────────────────────────
        const tickets = await prisma.tickets.findMany({
            where: {
                id: { in: ticketIds },
                status: "LOCKED",
                userId: { in: [userId, GUEST_TEMP_ID] },
            }
        });

        if (tickets.length !== ticketIds.length) {
            res.status(400).json({ success: false, message: "Деякі квитки недійсні або вже не заброньовані" });
            return;
        }

        const orderNumber = `CL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        for (const t of tickets) {
            await prisma.tickets.update({
                where: { id: t.id },
                data: {
                    userId,
                    status: "PURCHASED",
                    lockedUntil: null,
                    ticketNumber: `${orderNumber}-${t.id}`,
                },
            });
        }

        await logEvent("PURCHASE_TICKETS", userId, "Tickets", undefined);

        const purchased = await prisma.tickets.findMany({
            where: { id: { in: ticketIds } },
            include: {
                Seats: true,
                Sessions: { include: { Movies: true, Halls: true } },
            }
        });

        try {
            if (purchased.length > 0) {
                const customerResolvedName = req.user ? req.user.name : customerName;
                const movieTitle = purchased[0].Sessions.Movies.title;
                const sessionStartTime = purchased[0].Sessions.startTime.toISOString();
                const hallName = purchased[0].Sessions.Halls.name;
                const emailTickets = purchased.map(t => ({
                    row: t.Seats.row,
                    seatNumber: t.Seats.seatNumber,
                    ticketNumber: t.ticketNumber || t.id.toString()
                }));

                await sendEmail({
                    to: purchaseEmail,
                    subject: `Ваші квитки на: ${movieTitle}`,
                    html: getTicketsEmailHtml(customerResolvedName, movieTitle, sessionStartTime, hallName, emailTickets, orderNumber)
                });
            }
        } catch (emailErr) {
            console.error("Failed to send ticket email:", emailErr);
        }

        res.status(200).json({
            success: true,
            data: {
                orderNumber,
                tickets: purchased,
                isNewAccount,
            }
        });
    } catch (error) {
        console.error("purchaseTicket error:", error);
        res.status(500).json({ success: false, message: "Помилка покупки квитків" });
    }
};