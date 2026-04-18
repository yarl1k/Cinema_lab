import type { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth.js';
import { fromNodeHeaders } from 'better-auth/node';

/**
 * Extends Express Request with optional user/session from better-auth.
 */
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                name: string;
                email: string;
                emailVerified: boolean;
                image?: string | null;
                role?: string | null;
                banned?: boolean | null;
                banReason?: string | null;
                banExpires?: Date | null;
                createdAt: Date;
                updatedAt: Date;
            };
            session?: {
                id: string;
                token: string;
                userId: string;
                expiresAt: Date;
            };
        }
    }
}

/**
 * Helper: extract session from request headers.
 */
const getSessionFromRequest = async (req: Request) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });
    return session;
};

/**
 * requireAuth — blocks request if not authenticated (401).
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const session = await getSessionFromRequest(req);
        if (!session) {
            res.status(401).json({ success: false, message: 'Необхідна авторизація' });
            return;
        }
        req.user = session.user as Request['user'];
        req.session = session.session as Request['session'];
        next();
    } catch {
        res.status(401).json({ success: false, message: 'Недійсна сесія' });
    }
};

/**
 * requireRole — checks that user has a specific role (403).
 */
export const requireRole = (...roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const session = await getSessionFromRequest(req);
            if (!session) {
                res.status(401).json({ success: false, message: 'Необхідна авторизація' });
                return;
            }
            req.user = session.user as Request['user'];
            req.session = session.session as Request['session'];

            const userRole = (session.user as { role?: string | null }).role ?? 'user';
            if (!roles.includes(userRole)) {
                res.status(403).json({ success: false, message: 'Недостатньо прав' });
                return;
            }
            next();
        } catch {
            res.status(401).json({ success: false, message: 'Недійсна сесія' });
        }
    };
};

/**
 * optionalAuth — attaches user if authenticated, otherwise continues.
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const session = await getSessionFromRequest(req);
        if (session) {
            req.user = session.user as Request['user'];
            req.session = session.session as Request['session'];
        }
    } catch {
        // Not authenticated — that's fine for optional auth
    }
    next();
};
