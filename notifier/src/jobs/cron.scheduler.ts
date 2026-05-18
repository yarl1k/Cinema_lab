import { Cron } from "croner";
import axios from "axios";
import { prisma } from "../services/prisma_setup/database.js";
import { sendWeeklyDigest } from "../services/resend/email.service.js";

const MAIN_API_URL = process.env.MAIN_API_URL || "http://localhost:3000/api";

const generateMoviesHtml = (movies: any[]) => {
    return movies.map(movie => `
        <div style="background:#1a1a1a;border-radius:12px;padding:16px;margin-bottom:16px;border:1px solid rgba(255,255,255,0.05);display:flex;gap:16px;">
            <img src="${movie.posterUrl || 'https://placehold.co/60x90/1a1a1a/d33131?text=P'}" style="width:60px;height:90px;object-fit:cover;border-radius:8px;" alt="${movie.title}" />
            <div>
                <h3 style="color:#f1eeef;margin:0 0 8px;font-size:16px;">${movie.title}</h3>
                <p style="color:rgba(241,238,239,0.6);margin:0;font-size:12px;">Жанри: ${movie.genres || 'Не вказано'}</p>
                <p style="color:#d33131;margin:4px 0 0;font-size:12px;font-weight:bold;">Рейтинг: ${movie.rating || '-'}</p>
            </div>
        </div>
    `).join('');
};

export const weeklyDigestCron = new Cron('0 10 * * 4', async () => {
    console.log('[CRON] Starting weekly digest process...');
    try {
        // Fetch active movies
        const response = await axios.get(`${MAIN_API_URL}/movies/digest-feed`);
        const activeMovies = response.data?.data || [];

        if (activeMovies.length === 0) {
            console.log('[CRON] No active movies found. Skipping digest.');
            return;
        }

        // Fetch subscribers opted in
        const subscribers = await prisma.subscriber.findMany({
            where: {
                Settings: { receiveDigests: true }
            },
            include: { Preferences: true }
        });

        console.log(`[CRON] Found ${subscribers.length} subscribers for digest.`);

        for (const subscriber of subscribers) {
            const favoriteGenres = subscriber.Preferences.map(p => p.genre.toLowerCase());
            
            let matchedMovies = activeMovies;
            
            // If they have specific preferences, filter the movies
            if (favoriteGenres.length > 0) {
                matchedMovies = activeMovies.filter((movie: any) => {
                    if (!movie.genres) return false;
                    const movieGenres = movie.genres.toLowerCase().split(',').map((g: string) => g.trim());
                    return favoriteGenres.some(fav => movieGenres.includes(fav));
                });
            }

            if (matchedMovies.length > 0) {
                const moviesListHtml = generateMoviesHtml(matchedMovies);
                const userName = subscriber.email.split('@')[0] || "Кіноман";

                await sendWeeklyDigest(subscriber.email, userName, moviesListHtml);
                
                await prisma.emailLog.create({
                    data: {
                        subscriberId: subscriber.id,
                        eventType: "WEEKLY_DIGEST",
                        status: "SENT"
                    }
                });
                console.log(`[CRON] Sent digest to ${subscriber.email} with ${matchedMovies.length} movies.`);
            } else {
                console.log(`[CRON] No matching movies for ${subscriber.email}. Skipped.`);
            }
        }
    } catch (error: any) {
        console.error('[CRON] Error during weekly digest:', error.message);
    }
});
