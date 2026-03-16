import type { Hall, Session, Movie } from "@/types/types";

const handleResponse = async (res: Response) => {
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || "Помилка сервера");
  }
  return json.data;
};

export const api = {
  getMovies: async () => {
    return handleResponse(await fetch("/api/movies"));
  },

  deleteMovie: async (id: number) => {
    return handleResponse(await fetch(`/api/movies/${id}`, { method: "DELETE" }));
  },

  saveMovie: async (movie: Partial<Movie>, isEditing: boolean, id: number | null) => {
    const url = isEditing ? `/api/movies/${id}` : "/api/movies";
    const method = isEditing ? "PUT" : "POST";
    
    return handleResponse(
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movie),
      })
    );
  },

// Halls
  getHalls: async () => {
    return handleResponse(await fetch("/api/halls"));
  },

  createHall: async (hall: Partial<Hall>) => {
    return handleResponse(
      await fetch("/api/halls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hall),
      })
    );
  },

  deleteHall: async (id: number) => {
    return handleResponse(await fetch(`/api/halls/${id}`, { method: "DELETE" }));
  },

  toggleHallStatus: async (id: number) => {
    return handleResponse(await fetch(`/api/halls/${id}/toggle`, { method: "PATCH" }));
  },

  getHallSessions: async (id: number) => {
    return handleResponse(await fetch(`/api/halls/${id}/sessions`));
  },

deleteAllMovieSessions: async (movieId: number) => {
    return handleResponse(await fetch(`/api/movies/${movieId}/sessions`, { method: "DELETE" }));
  },

// Sessions
  getMovieSessions: async (movieId: number) => {
    return handleResponse(await fetch(`/api/movies/${movieId}/sessions`));
  },

  deleteSession: async (sessionId: number) => {
    return handleResponse(await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" }));
  },

  createSessionsBatch: async (sessions: Partial<Session>[]) => {
    return handleResponse(
      await fetch("/api/sessions/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessions }),
      })
    );
  },

// Logs
  getLogs: async () => {
    return handleResponse(await fetch("/api/logs"));
  },

// Stats
  getMoviesByYear: async () => {
    return handleResponse(await fetch("/api/movies-by-year"));
  },
  
  getMoviesByGenre: async () => {
    return handleResponse(await fetch("/api/movies-by-genre"));
  },

// Booking
  getSessionSeats: async (sessionId: number) => {
    return handleResponse(await fetch(`/api/sessions/${sessionId}/seats`));
  },

  lockSeat: async (sessionId: number, seatId: number) => {
    return handleResponse(
      await fetch("/api/tickets/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, seatId }),
      })
    );
  },

  cancelLock: async (ticketId: number) => {
    return handleResponse(
      await fetch(`/api/tickets/${ticketId}/lock`, { method: "DELETE" })
    );
  },

  purchaseTickets: async (ticketIds: number[], customerName: string, customerPhone: string, customerEmail: string) => {
    return handleResponse(
      await fetch("/api/tickets/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketIds, customerName, customerPhone, customerEmail }),
      })
    );
  },
};