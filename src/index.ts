import express from 'express';
import mainRouter from './routes/index.js';
import { syncMoviesFromTMDB } from './services/tmdbParse.js';

const app = express();

app.use(express.json());

app.use('/api', mainRouter);

app.get('/api/sync-movies', async (req, res) => {
    const result = await syncMoviesFromTMDB();
    res.json(result);
});

app.listen(3000, () => {
    console.log('API Сервер запущено на http://localhost:3000');
});