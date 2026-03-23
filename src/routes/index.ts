import { Router } from 'express';
import {
  getMoviesIndex,
  getMovieDetails,
  createMovie,
  deleteMovie,
  updateMovie,
} from '../controllers/movies.controller.js';

import {
  getMovieSessions,
  createSession,
  updateSession,
  deleteSession,
  createSessionBatch,
  deleteAllMovieSessions
} from '../controllers/session.controller.js';

import { getSessionSeats, lockSeat, cancelLock, purchaseTicket } from '../controllers/tickets.controller.js';
import { getLogs } from '../controllers/logs.controller.js';
import { getHalls, createHall, deleteHall, toggleHallStatus, getHallSessions } from '../controllers/halls.controller.js';
import { getMoviesByGenre, getMoviesByYear } from '../controllers/charts-stats.controller.js';

const router: Router = Router();

// --- Фільми ---
router.get('/movies', getMoviesIndex);
router.get('/movies/:id', getMovieDetails);
router.post('/movies', createMovie);
router.put('/movies/:id', updateMovie);
router.delete('/movies/:id', deleteMovie);

// --- Сеанси фільму ---
router.get('/movies/:id/sessions', getMovieSessions);

// --- Журнал подій ---
router.get('/logs', getLogs);

// --- Квитки та місця ---
router.get('/sessions/:sessionId/seats', getSessionSeats);
router.post('/tickets/lock', lockSeat);
router.delete('/tickets/:id/lock', cancelLock);
router.post('/tickets/purchase', purchaseTicket);

// --- Зали ---
router.get('/halls', getHalls);
router.get('/halls/:id/sessions', getHallSessions);
router.post('/halls', createHall);
router.delete('/halls/:id', deleteHall);
router.patch('/halls/:id/toggle', toggleHallStatus);

// --- Керування сеансами ---
router.post('/sessions', createSession);
router.put('/sessions/:id', updateSession);
router.delete('/sessions/:id', deleteSession);
router.delete('/movies/:id/sessions', deleteAllMovieSessions);
router.post('/sessions/batch', createSessionBatch);

// --- Статистика ---
router.get('/movies-by-year', getMoviesByYear);
router.get('/movies-by-genre', getMoviesByGenre);

export default router;