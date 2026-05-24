import { prisma } from "../prisma_setup/database.js";
import { sendMail } from "../resend/email.service.js";
import { renderWeeklyDigest } from "../templates/template-renderer.js";
import type { DigestMovie } from "./digest-feed.service.js";

/**
 * Generate HTML block for movie list in digest email.
 */
const generateMoviesHtml = (movies: DigestMovie[]): string => {
    return movies
        .map(
            (movie) => `
        <div style="background:#1a1a1a;border-radius:12px;padding:16px;margin-bottom:16px;border:1px solid rgba(255,255,255,0.05);display:flex;gap:16px;">
            <img src="${movie.posterUrl || "https://placehold.co/60x90/1a1a1a/d33131?text=P"}" style="width:60px;height:90px;object-fit:cover;border-radius:8px;" alt="${movie.title}" />
            <div>
                <h3 style="color:#f1eeef;margin:0 0 8px;font-size:16px;">${movie.title}</h3>
                <p style="color:rgba(241,238,239,0.6);margin:0;font-size:12px;">Жанри: ${movie.genres || "Не вказано"}</p>
                <p style="color:#d33131;margin:4px 0 0;font-size:12px;font-weight:bold;">Рейтинг: ${movie.rating || "-"}</p>
            </div>
        </div>
    `
        )
        .join("");
};

/**
 * Filter movies by subscriber's genre preferences.
 * If subscriber has no preferences, return all movies.
 */
const filterMoviesByPreferences = (
    movies: DigestMovie[],
    favoriteGenres: string[]
): DigestMovie[] => {
    if (favoriteGenres.length === 0) return movies;

    const lowerGenres = favoriteGenres.map((g) => g.toLowerCase());

    return movies.filter((movie) => {
        if (!movie.genres) return false;
        const movieGenres = movie.genres
            .toLowerCase()
            .split(",")
            .map((g) => g.trim());
        return lowerGenres.some((fav) => movieGenres.includes(fav));
    });
};

/**
 * Send weekly digest to all opted-in subscribers.
 * Filters movies by each subscriber's genre preferences.
 * Logs each sent email in EmailLog.
 *
 * @returns Number of emails sent.
 */
export const sendDigestToSubscribers = async (
    movies: DigestMovie[]
): Promise<number> => {
    const subscribers = await prisma.subscriber.findMany({
        where: {
            Settings: { receiveDigests: true },
        },
        include: { Preferences: true },
    });

    let sentCount = 0;

    for (const subscriber of subscribers) {
        const favoriteGenres = subscriber.Preferences.map((p) => p.genre);
        const matchedMovies = filterMoviesByPreferences(movies, favoriteGenres);

        if (matchedMovies.length === 0) {
            console.log(
                `[DigestSender] No matching movies for ${subscriber.email}. Skipped.`
            );
            continue;
        }

        const moviesListHtml = generateMoviesHtml(matchedMovies);
        const userName = subscriber.email.split("@")[0] || "Кіноман";

        const html = renderWeeklyDigest(userName, moviesListHtml);
        await sendMail(subscriber.email, "Свіжі релізи цього тижня 🎬", html);

        await prisma.emailLog.create({
            data: {
                subscriberId: subscriber.id,
                eventType: "WEEKLY_DIGEST",
                status: "SENT",
            },
        });

        console.log(
            `[DigestSender] Sent digest to ${subscriber.email} with ${matchedMovies.length} movies.`
        );
        sentCount++;
    }

    return sentCount;
};
