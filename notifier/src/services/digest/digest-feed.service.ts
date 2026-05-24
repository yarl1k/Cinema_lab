import axios from "axios";

const MAIN_API_URL = process.env.MAIN_API_URL || "http://localhost:3000/api";

export interface DigestMovie {
    id: number;
    title: string;
    posterUrl: string | null;
    genres: string | null;
    rating: number | null;
}

/**
 * Fetch active movies from backend digest-feed endpoint.
 * Returns empty array on network/API failure (non-blocking).
 */
export const fetchActiveMovies = async (): Promise<DigestMovie[]> => {
    try {
        const response = await axios.get(`${MAIN_API_URL}/movies/digest-feed`);
        return response.data?.data || [];
    } catch (error: any) {
        console.error("[DigestFeed] Failed to fetch movies:", error.message);
        return [];
    }
};

/**
 * Extract sorted movie IDs from movie array.
 */
export const extractMovieIds = (movies: DigestMovie[]): number[] => {
    return movies.map((m) => m.id).sort((a, b) => a - b);
};
