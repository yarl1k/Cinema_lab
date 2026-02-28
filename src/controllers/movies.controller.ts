import type { Request, Response } from "express";
import { prisma } from "../services/database/database.js";


export const getMoviesIndex = async (req: Request, res: Response) => { 
    const movies = await prisma.movies.findMany();
    res.render("MoviesPage", { movies });
};

export const getMovieDetails = async (req: Request, res: Response) => {
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
        res.status(404).send('Фільм не знайдено');
        return; 
    }

    res.render('MovieDetailsPage', { movie });
};