import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { getPreferences } from '../preferences.controller.js';
import { prisma } from '../../services/prisma_setup/database.js';

// Mock the prisma client
vi.mock('../../services/prisma_setup/database.js', () => ({
    prisma: {
        subscriber: {
            findUnique: vi.fn(),
        },
    },
}));

describe('Preferences Controller - getPreferences', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockReq = {
            params: { userId: 'user-123' }
        };
        
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
    });

    it('should return 404 if subscriber is not found', async () => {
        vi.mocked(prisma.subscriber.findUnique).mockResolvedValue(null);

        await getPreferences(mockReq as Request, mockRes as Response);

        expect(prisma.subscriber.findUnique).toHaveBeenCalledWith({
            where: { id: 'user-123' },
            include: { Settings: true, Preferences: true }
        });
        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Subscriber not found' });
    });

    it('should return preferences successfully with defaults if Settings is missing', async () => {
        vi.mocked(prisma.subscriber.findUnique).mockResolvedValue({
            id: 'user-123',
            email: 'test@example.com',
            createdAt: new Date(),
            Settings: null,
            Preferences: []
        } as any);

        await getPreferences(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            success: true,
            data: {
                receiveDigests: true,
                receiveReminders: true,
                favoriteGenres: []
            }
        });
    });

    it('should return preferences successfully with populated Settings and Preferences', async () => {
        vi.mocked(prisma.subscriber.findUnique).mockResolvedValue({
            id: 'user-123',
            email: 'test@example.com',
            createdAt: new Date(),
            Settings: {
                receiveDigests: false,
                receiveReminders: true,
            },
            Preferences: [
                { genre: 'Action' },
                { genre: 'Comedy' }
            ]
        } as any);

        await getPreferences(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            success: true,
            data: {
                receiveDigests: false,
                receiveReminders: true,
                favoriteGenres: ['Action', 'Comedy']
            }
        });
    });

    it('should return 500 on database error', async () => {
        vi.mocked(prisma.subscriber.findUnique).mockRejectedValue(new Error('DB Error'));
        
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await getPreferences(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Server error' });
        
        consoleErrorSpy.mockRestore();
    });
});
