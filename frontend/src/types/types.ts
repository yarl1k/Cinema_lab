export interface EventLog {
  id: number;
  eventType: string;
  entityType?: string | null;
  entityId?: number | null;
  userId?: number | null;
  createdAt?: string | null; 
  metadata?: string | null;
  

  Users?: User | null;
}

export interface Hall {
  id: number;
  name: string;
  rows: number;
  seatsPerRow: number;
  isActive: boolean;
  

  Seats?: Seat[];
  Sessions?: Session[];
}

export interface Movie {
  id: number;
  tmdbId?: number | null;
  title: string;
  description?: string | null;
  duration?: number | null;
  originalTitle?: string | null;
  director?: string | null;
  cast?: string | null;
  studio?: string | null;
  ageRestriction?: string | null;
  language?: string | null;
  rating?: number | null;
  releaseDate?: string | null; 
  endDate?: string | null;     
  genres?: string | null;
  posterUrl?: string | null;
  backgroundUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  

  Sessions?: Session[];
}

export interface Seat {
  id: number;
  hallId: number;
  row: number;
  seatNumber: number;
  

  Halls?: Hall;
  Tickets?: Ticket[];
}

export interface Session {
  id: number;
  movieId: number;
  hallId: number;
  startTime: string; 
  createdAt?: string | null;
  updatedAt?: string | null;
  

  Halls?: Hall;
  Movies?: Movie;
  Tickets?: Ticket[];
}

export interface Ticket {
  id: number;
  ticketNumber?: string | null;
  userId: number;
  sessionId: number;
  seatId: number;
  status: string; 
  lockedUntil?: string | null;
  price?: number | string | null; 
  version: number;
  createdAt?: string | null;
  
  Seats?: Seat;
  Sessions?: Session;
  Users?: User;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  passwordHash: string; 

  EventLogs?: EventLog[];
  Tickets?: Ticket[];
}