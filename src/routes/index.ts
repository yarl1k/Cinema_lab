import { Router } from 'express';
// Додаємо deleteAllMovieSessions до імпорту з movies.controller
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

import { getSessionSeats } from '../controllers/tickets.controller.js';
import { getLogs } from '../controllers/logs.controller.js'; 
import { getHalls, createHall, deleteHall, toggleHallStatus, getHallSessions } from '../controllers/halls.controller.js';

const router: Router = Router();

// --- Фільми ---
router.get('/movies', getMoviesIndex);
router.get('/movies/:id', getMovieDetails);
router.post('/movies', createMovie);
router.put('/movies/:id', updateMovie);
router.delete('/movies/:id', deleteMovie);

// --- Сеанси фільму ---
router.get('/movies/:id/sessions', getMovieSessions); 
router.delete('/movies/:id/sessions', deleteAllMovieSessions); // <-- НОВИЙ РОУТ ДЛЯ ВИДАЛЕННЯ ВСІХ СЕАНСІВ

// --- Журнал подій ---
router.get('/logs', getLogs); 

// --- Квитки та місця ---
router.get('/sessions/:sessionId/seats', getSessionSeats);

// --- Зали (Halls) ---
router.get('/halls', getHalls);
router.get('/halls/:id/sessions', getHallSessions);
router.post('/halls', createHall);
router.delete('/halls/:id', deleteHall);
router.patch('/halls/:id/toggle', toggleHallStatus);

// --- Керування сеансами ---
router.post('/sessions', createSession);
router.put('/sessions/:id', updateSession);
router.delete('/sessions/:id', deleteSession); // Окреме видалення
router.post('/sessions/batch', createSessionBatch); // Масове створення

export default router;