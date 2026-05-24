import { redisConnection } from "./redis.setup.js";

const CACHE_KEY = "digest:movies:current";
const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Retrieve cached movie IDs from Redis.
 * @returns Sorted array of movie IDs, or null if cache is empty/expired.
 */
export const getCachedMovieIds = async (): Promise<number[] | null> => {
    const raw = await redisConnection.get(CACHE_KEY);
    if (!raw) return null;

    try {
        const ids: number[] = JSON.parse(raw);
        return ids;
    } catch {
        console.error("[DigestCache] Corrupted cache data, clearing key.");
        await redisConnection.del(CACHE_KEY);
        return null;
    }
};

/**
 * Store current movie IDs in Redis with 7-day TTL.
 * IDs are sorted for deterministic comparison.
 */
export const setCachedMovieIds = async (ids: number[]): Promise<void> => {
    const sorted = [...ids].sort((a, b) => a - b);
    await redisConnection.set(CACHE_KEY, JSON.stringify(sorted), "EX", TTL_SECONDS);
};

/**
 * Compare current movie IDs against cached ones.
 * @returns Object with hasNew flag and array of newly added movie IDs.
 */
export const detectNewMovies = (
    currentIds: number[],
    cachedIds: number[]
): { hasNew: boolean; newMovieIds: number[] } => {
    const cachedSet = new Set(cachedIds);
    const newMovieIds = currentIds.filter((id) => !cachedSet.has(id));

    return {
        hasNew: newMovieIds.length > 0,
        newMovieIds,
    };
};
