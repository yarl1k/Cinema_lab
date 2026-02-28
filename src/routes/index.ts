import { Router } from "express";
import { getMoviesIndex, getMovieDetails } from "../controllers/movies.controller.js";

const router: Router = Router();

router.get('/', getMoviesIndex);
router.get('/movies/:id/details', getMovieDetails);

export default router;