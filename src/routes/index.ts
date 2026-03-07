import { Router } from 'express';
import { getMoviesIndex, getMovieDetails } from '../controllers/movies.controller.js';

// import { getSessionSeats, lockSeat, purchaseTicket } from '../controllers/tickets.controller.js';

const router: Router = Router();


router.get('/movies', getMoviesIndex);
router.get('/movies/:id', getMovieDetails);

// router.get('/sessions/:sessionId/seats', getSessionSeats);
// router.post('/sessions/:sessionId/lock', lockSeat);
// router.post('/tickets/purchase', purchaseTicket);

export default router;