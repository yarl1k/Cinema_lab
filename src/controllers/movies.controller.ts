import type { Request, Response } from "express";
import { prisma } from "../services/database/database.js";
import { logEvent } from "../services/logger.js";


export const getMoviesIndex = async (req: Request, res: Response): Promise<void> => { 
    try {
        const movies = await prisma.movies.findMany();
        
        res.status(200).json({ success: true, data: movies });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Помилка отримання списку фільмів" });
    }
};

export const getMovieDetails = async (req: Request, res: Response) => {
    try {
    const movieId = parseInt(req.params.id as string);

    const movie = await prisma.movies.findUnique({
        where: { id: movieId },
        include: {
            Sessions: {
                include: { Halls: true }
            }
        }
    });
    if (!movie) {
            res.status(404).json({ success: false, message: "Фільм не знайдено" });
            return; 
        }

        res.status(200).json({ success: true, data: movie });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Помилка отримання деталей фільму" });
    }
};

// admin stuff
export const createMovie = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.body.user?.id;
        const newMovie = await prisma.movies.create({
            data: req.body
        });
        await logEvent("CREATE_MOVIE", adminId, "Movies", newMovie.id);
        
        res.status(201).json({ success: true, data: newMovie });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Помилка створення фільму" });
    }
};

export const updateMovie = async (req: Request, res: Response): Promise<void> => {
    try {
        const movieId = parseInt(req.params.id as string);
        const adminId = req.body.user?.id;
        const updatedMovie = await prisma.movies.update({
            where: { id: movieId },
            data: req.body
        });
        await logEvent("UPDATE_MOVIE", adminId, "Movies", updatedMovie.id);
        res.status(200).json({ success: true, data: updatedMovie });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Помилка оновлення фільму" });
    }
};

export const deleteMovie = async (req: Request, res: Response): Promise<void> => {
    try {
        const movieId = parseInt(req.params.id as string);
        const adminId = req.body.user?.id;
        await prisma.movies.delete({
            where: { id: movieId }
        });
        await logEvent("DELETE_MOVIE", adminId, "Movies", movieId);
        res.status(200).json({ success: true, message: "Фільм успішно видалено" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Помилка видалення фільму" });
    }
};
