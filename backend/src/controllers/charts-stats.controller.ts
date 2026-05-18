import type { Request, Response } from "express";
import { prisma } from "../services/database/database.js";

export const getMoviesByYear = async (req: Request, res: Response): Promise<void> => {
    try {
        const movies = await prisma.movies.findMany({
            where: { releaseDate: { not: null } },
            select: { releaseDate: true },
        });

        const yearCounts = movies.reduce((acc: Record<string, number>, movie) => {
            if (movie.releaseDate) {
                const year = movie.releaseDate.getFullYear().toString();
                acc[year] = (acc[year] || 0) + 1;
            }
            return acc;
        }, {});

        const data = Object.keys(yearCounts)
            .map(year => ({ year, count: yearCounts[year] }))
            .sort((a, b) => a.year.localeCompare(b.year));

        res.json({ success: true, data });
    } catch (error) {
        console.error("Error in getMoviesByYear:", error);
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
};

export const getMoviesByGenre = async (req: Request, res: Response): Promise<void> => {
    try {
        const movies = await prisma.movies.findMany({
            where: {
                AND: [
                    { genres: { not: null } },
                    { genres: { not: '' } }
                ]
            },
            select: { genres: true },
        });

        const genreCounts: Record<string, number> = {};

        movies.forEach(movie => {
            if (movie.genres) {
                const genresList = movie.genres.split(',').map(g => g.trim());

                genresList.forEach(genre => {
                    if (genre) {
                        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                    }
                });
            }
        });

        const data = Object.keys(genreCounts)
            .map(genre => ({ genre, count: genreCounts[genre] }))
            .sort((a, b) => b.count - a.count);

        res.json({ success: true, data });
    } catch (error) {
        console.error("Error in getMoviesByGenre:", error);
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
};