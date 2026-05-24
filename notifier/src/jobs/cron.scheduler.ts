import { Cron } from "croner";
import {
    getCachedMovieIds,
    setCachedMovieIds,
    detectNewMovies,
} from "../services/redis/digest-cache.service.js";
import {
    fetchActiveMovies,
    extractMovieIds,
} from "../services/digest/digest-feed.service.js";
import { sendDigestToSubscribers } from "../services/digest/digest-sender.service.js";

/**
 * Weekly digest cron — runs every 1 minute.
 *
 * Flow:
 * 1. Fetch active movies from backend API
 * 2. Extract movie IDs, compare against Redis cache
 * 3. If no new movies → skip
 * 4. If new movies → send digests to subscribers → update cache
 *
 * Cache TTL: 7 days (auto-expires, forces re-send even if same movies)
 */
export const weeklyDigestCron = new Cron("* * * * *", async () => {
    console.log("[CRON] Digest check started...");

    try {
        // 1. Fetch current movies
        const activeMovies = await fetchActiveMovies();

        if (activeMovies.length === 0) {
            console.log("[CRON] No active movies found. Skipping.");
            return;
        }

        const currentIds = extractMovieIds(activeMovies);

        // 2. Compare with cache
        const cachedIds = await getCachedMovieIds();

        if (cachedIds !== null) {
            const { hasNew, newMovieIds } = detectNewMovies(currentIds, cachedIds);

            if (!hasNew) {
                console.log("[CRON] No new releases detected. Skipping digest.");
                return;
            }

            console.log(
                `[CRON] New movie IDs detected: [${newMovieIds.join(", ")}]`
            );
        } else {
            console.log("[CRON] No cache found (first run or expired). Processing digest.");
        }

        // 3. Send digests
        const sentCount = await sendDigestToSubscribers(activeMovies);
        console.log(`[CRON] Digest sent to ${sentCount} subscribers.`);

        // 4. Update cache after successful send
        await setCachedMovieIds(currentIds);
        console.log("[CRON] Movie cache updated.");
    } catch (error: any) {
        console.error("[CRON] Error during digest check:", error.message);
    }
});
