export interface EventLog {
  id: number;
  eventType: string;
  entityType?: string | null;
  entityId?: number | null;
  userId?: string | null;
  createdAt?: string | null;
  metadata?: string | null;

  User?: User | null;
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
  isAvailable?: boolean;
  unavailableReason?: string | null;

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
  userId: string;
  sessionId: number;
  seatId: number;
  status: string;
  lockedUntil?: string | null;
  price?: number | string | null;
  version: number;
  createdAt?: string | null;

  Seats?: Seat;
  Sessions?: Session;
  User?: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;

  EventLogs?: EventLog[];
  Tickets?: Ticket[];
}

export interface BuffetItem {
  id: number;
  name: string;
  category: string;
  stockQuantity: number;
  purchasePrice: number | string;
  sellingPrice: number | string;
  createdAt?: string | null;
  updatedAt?: string | null;
}