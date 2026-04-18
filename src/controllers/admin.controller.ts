import type { Request, Response } from "express";
import { prisma } from "../services/database/database.js";
import { logEvent } from "../services/logger.js";

const ROLE_HIERARCHY: Record<string, number> = {
    user: 1,
    manager: 2,
    admin: 3,
    superadmin: 4,
};
const getRoleLevel = (role?: string | null) => ROLE_HIERARCHY[role || "user"] || 1;

/**
 * GET /api/admin/users — list all users (except the guest placeholder).
 */
export const getUsers = async (_req: Request, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            where: { id: { not: "guest-temp-lock" } },
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error("getUsers error:", error);
        res.status(500).json({ success: false, message: "Помилка отримання користувачів" });
    }
};

/**
 * PUT /api/admin/users/:id — update user data (name, email).
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.id as string;
        const { name, email } = req.body;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ success: false, message: "Користувач не знайдений" });
            return;
        }

        const callerRole = req.user?.role || "user";
        const callerLevel = getRoleLevel(callerRole);
        const targetLevel = getRoleLevel(user.role);

        if (callerLevel <= targetLevel && userId !== req.user?.id) {
            res.status(403).json({ success: false, message: "Ви не можете змінювати дані користувача з такою ж або вищою роллю" });
            return;
        }

        // Check email uniqueness if changed
        if (email && email !== user.email) {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                res.status(400).json({ success: false, message: "Email вже використовується" });
                return;
            }
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(name && { name }),
                ...(email && { email }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        await logEvent("UPDATE_USER", req.user?.id ?? null, "User", undefined, { targetUserId: userId });
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error("updateUser error:", error);
        res.status(500).json({ success: false, message: "Помилка оновлення користувача" });
    }
};

/**
 * PATCH /api/admin/users/:id/role — change user role.
 * Promoting to "admin" requires `adminCode` in the request body.
 */
export const changeUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.id as string;
        const { role, adminCode } = req.body;

        if (!role || !["user", "manager", "admin", "superadmin"].includes(role)) {
            res.status(400).json({ success: false, message: "Невірна роль. Доступні: user, manager, admin, superadmin" });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ success: false, message: "Користувач не знайдений" });
            return;
        }

        const callerRole = req.user?.role || "user";
        const callerLevel = getRoleLevel(callerRole);
        const targetLevel = getRoleLevel(user.role);
        const newLevel = getRoleLevel(role);

        // Hierarchy rule 1: You cannot change the role of someone whose level is >= yours
        if (callerLevel <= targetLevel && callerLevel < 4) {
            res.status(403).json({ success: false, message: "Ви не можете змінювати роль користувача з рівною або вищою роллю" });
            return;
        }

        // Hierarchy rule 2: You cannot grant a role higher than your own
        if (newLevel > callerLevel) {
            res.status(403).json({ success: false, message: "Ви не можете призначити роль, вищу за вашу власну" });
            return;
        }

        // Prevent self-demotion unless superadmin wants to demote themselves
        if (userId === req.user?.id) {
            res.status(400).json({ success: false, message: "Ви не можете змінити свою власну роль з цієї панелі" });
            return;
        }

        // Admin code verification for promotion to admin or superadmin
        if (newLevel >= 3) {
            const serverAdminCode = process.env.ADMIN_CODE;
            if (!serverAdminCode) {
                res.status(500).json({ success: false, message: "ADMIN_CODE не налаштовано на сервері" });
                return;
            }
            if (!adminCode || adminCode !== serverAdminCode) {
                res.status(403).json({ success: false, message: "Невірний код адміністратора" });
                return;
            }
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        await logEvent(
            "CHANGE_ROLE",
            req.user?.id ?? null,
            "User",
            undefined,
            { targetUserId: userId, newRole: role }
        );

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error("changeUserRole error:", error);
        res.status(500).json({ success: false, message: "Помилка зміни ролі" });
    }
};

// ── Seat Availability ────────────────────────────────────────────────
export const getHallSeats = async (req: Request, res: Response): Promise<void> => {
    try {
        const hallId = parseInt(req.params.hallId as string);

        const hall = await prisma.halls.findUnique({ where: { id: hallId } });
        if (!hall) {
            res.status(404).json({ success: false, message: "Зал не знайдено" });
            return;
        }

        const seats = await prisma.seats.findMany({
            where: { hallId },
            orderBy: [{ row: "asc" }, { seatNumber: "asc" }],
            select: {
                id: true,
                hallId: true,
                row: true,
                seatNumber: true,
                isAvailable: true,
                unavailableReason: true,
            },
        });

        res.status(200).json({
            success: true,
            data: { hall, seats },
        });
    } catch (error) {
        console.error("getHallSeats error:", error);
        res.status(500).json({ success: false, message: "Помилка отримання місць залу" });
    }
};

/**
 * Toggle seat availability. Body: { isAvailable: boolean, reason?: string }
 */
export const toggleSeatAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
        const hallId = parseInt(req.params.hallId as string);
        const seatId = parseInt(req.params.seatId as string);
        const { isAvailable, reason } = req.body;
        const adminId = req.user?.id ?? null;

        if (typeof isAvailable !== "boolean") {
            res.status(400).json({ success: false, message: "isAvailable має бути boolean" });
            return;
        }

        const seat = await prisma.seats.findFirst({
            where: { id: seatId, hallId },
        });

        if (!seat) {
            res.status(404).json({ success: false, message: "Місце не знайдено в цьому залі" });
            return;
        }

        const updated = await prisma.seats.update({
            where: { id: seatId },
            data: {
                isAvailable,
                unavailableReason: isAvailable ? null : (reason || null),
            },
        });

        await logEvent(
            isAvailable ? "SEAT_ENABLED" : "SEAT_DISABLED",
            adminId,
            "Seats",
            seatId,
            {
                hallId,
                row: seat.row,
                seatNumber: seat.seatNumber,
                reason: isAvailable ? null : reason,
            }
        );

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error("toggleSeatAvailability error:", error);
        res.status(500).json({ success: false, message: "Помилка зміни доступності місця" });
    }
};
