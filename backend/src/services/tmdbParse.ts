import axios from 'axios';
import { prisma } from './database/database.js';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;
const MOVIE_RENTAL_DURATION_DAYS = 21; 

export const syncMoviesFromTMDB = async () => {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/now_playing`, {
            params: {
                api_key: API_KEY,
                language: 'uk-UA',
                region: 'UA',
                page: 1
            }
        });

        const tmdbMovies = response.data.results;
        const moviesCollection = [];
        for (const movie of tmdbMovies) {
            const existingMovie = await prisma.movies.findUnique({
                where: { tmdbId: movie.id }
            });
            if (existingMovie) {
                console.log(`Movie with TMDB ID ${movie.id} already exists. Skipping.`);
                continue; 
            }
            const detailResponse = await axios.get(`${TMDB_BASE_URL}/movie/${movie.id}`, {
                params: {
                    api_key: API_KEY,
                    language: 'uk-UA',
                    append_to_response: 'credits,release_dates'
                }
            });
            const movieDetails = detailResponse.data;
            const directorObj = movieDetails.credits?.crew?.find((person: any) => person.job === 'Director');
            const director = directorObj ? directorObj.name : 'Невідомий режисер';

            const castObj = movieDetails.credits?.cast?.slice(0, 5).map((actor: any) => actor.name);
            const cast = castObj ? castObj.join(', ') : 'Невідомий акторський склад';
            const studioObj = movieDetails.production_companies?.[0];
            const studio = studioObj ? studioObj.name : null;

            let ageRestriction = null;
            if (movieDetails.release_dates?.results) {
                const uaRelease = movieDetails.release_dates.results.find((r: any) => r.iso_3166_1 === 'UA');
                const usRelease = movieDetails.release_dates.results.find((r: any) => r.iso_3166_1 === 'US');
                
                if (uaRelease?.release_dates[0]?.certification) {
                    ageRestriction = uaRelease.release_dates[0].certification;
                } else if (usRelease?.release_dates[0]?.certification) {
                    ageRestriction = usRelease.release_dates[0].certification;
                }
            }
            const genreNames = movieDetails.genres?.map((g: any) => g.name).join(', ') || null;

            const releaseDate = movieDetails.release_date ? new Date(movieDetails.release_date) : new Date();
            const endDate = new Date(releaseDate);
            endDate.setDate(endDate.getDate() + MOVIE_RENTAL_DURATION_DAYS);

            moviesCollection.push({
                tmdbId: movieDetails.id,
                title: movieDetails.title,
                originalTitle: movieDetails.original_title,
                description: movieDetails.overview,
                duration: movieDetails.runtime, 
                director: director,
                cast: cast,
                studio: studio,
                ageRestriction: ageRestriction ? `${ageRestriction}` : null,
                language: 'українська',
                rating: movieDetails.vote_average,
                releaseDate: releaseDate,
                endDate: endDate,
                genres: genreNames,
                posterUrl: movieDetails.poster_path ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}` : null,
                backgroundUrl: movieDetails.backdrop_path ? `https://image.tmdb.org/t/p/original${movieDetails.backdrop_path}` : null
            });
        }
        if (moviesCollection.length > 0) {
            await prisma.movies.createMany({ data: moviesCollection });
        }

        console.log(`Синхронізація успішна. Додано нових фільмів: ${moviesCollection.length}`);
        return { success: true, addedCount: moviesCollection.length };
        
    } catch (error) {
        console.error('Помилка синхронізації з TMDB:', error);
        return { success: false, error };
    }
};