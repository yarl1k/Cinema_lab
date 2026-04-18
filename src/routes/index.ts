import { Router } from 'express';
import multer from 'multer';
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
import { getBuffetItems, importBuffetItems, exportBuffetItems } from '../controllers/buffet.controller.js';
import { getManagerialReport } from '../controllers/reports.controller.js';
import { getMyTickets, getMyProfile } from '../controllers/user.controller.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.middleware.js';
import { getUsers, updateUser, changeUserRole, getHallSeats, toggleSeatAvailability } from '../controllers/admin.controller.js';

const router: Router = Router();

// Multer — зберігає файл у пам'яті (без тимчасових файлів на диску)
const upload = multer({ storage: multer.memoryStorage() });

// --- Фільми (публічні) ---
router.get('/movies', getMoviesIndex);
router.get('/movies/:id', getMovieDetails);

// --- Фільми ---
router.post('/movies', requireRole('manager', 'admin', 'superadmin'), createMovie);
router.put('/movies/:id', requireRole('manager', 'admin', 'superadmin'), updateMovie);
router.delete('/movies/:id', requireRole('manager', 'admin', 'superadmin'), deleteMovie);

// --- Сеанси фільму (публічні) ---
router.get('/movies/:id/sessions', getMovieSessions);

// --- Журнал подій ---
router.get('/logs', requireRole('manager', 'admin', 'superadmin'), getLogs);

// --- Квитки та місця ---
router.get('/sessions/:sessionId/seats', getSessionSeats);
router.post('/tickets/lock', optionalAuth, lockSeat);
router.delete('/tickets/:id/lock', cancelLock);
router.post('/tickets/purchase', optionalAuth, purchaseTicket);

// --- Зали ---
router.get('/halls', getHalls);
router.get('/halls/:id/sessions', getHallSessions);
router.post('/halls', requireRole('manager', 'admin', 'superadmin'), createHall);
router.delete('/halls/:id', requireRole('manager', 'admin', 'superadmin'), deleteHall);
router.patch('/halls/:id/toggle', requireRole('manager', 'admin', 'superadmin'), toggleHallStatus);

// --- Керування сеансами ---
router.post('/sessions', requireRole('manager', 'admin', 'superadmin'), createSession);
router.put('/sessions/:id', requireRole('manager', 'admin', 'superadmin'), updateSession);
router.delete('/sessions/:id', requireRole('manager', 'admin', 'superadmin'), deleteSession);
router.delete('/movies/:id/sessions', requireRole('manager', 'admin', 'superadmin'), deleteAllMovieSessions);
router.post('/sessions/batch', requireRole('manager', 'admin', 'superadmin'), createSessionBatch);

// --- Статистика ---
router.get('/movies-by-year', requireRole('manager', 'admin', 'superadmin'), getMoviesByYear);
router.get('/movies-by-genre', requireRole('manager', 'admin', 'superadmin'), getMoviesByGenre);

// --- Буфет ---
router.get('/buffet', requireRole('manager', 'admin', 'superadmin'), getBuffetItems);
router.post('/buffet/import', requireRole('manager', 'admin', 'superadmin'), upload.single('file'), importBuffetItems);
router.get('/buffet/export', requireRole('manager', 'admin', 'superadmin'), exportBuffetItems);

// --- Звіти ---
router.get('/reports/managerial', requireRole('manager', 'admin', 'superadmin'), getManagerialReport);

// --- Користувач (авторизовані) ---
router.get('/my/tickets', requireAuth, getMyTickets);
router.get('/my/profile', requireAuth, getMyProfile);

// --- Адмін (Користувачі та Місця) ---
router.get('/admin/users', requireRole('admin', 'superadmin'), getUsers);
router.put('/admin/users/:id', requireRole('admin', 'superadmin'), updateUser);
router.patch('/admin/users/:id/role', requireRole('admin', 'superadmin'), changeUserRole);
router.get('/admin/halls/:hallId/seats', requireRole('manager', 'admin', 'superadmin'), getHallSeats);
router.patch('/admin/halls/:hallId/seats/:seatId/availability', requireRole('manager', 'admin', 'superadmin'), toggleSeatAvailability);

export default router;