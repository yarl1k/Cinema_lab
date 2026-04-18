import express from 'express';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import mainRouter from './routes/index.js';
import { syncMoviesFromTMDB } from './services/tmdbParse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── Better-Auth handler MUST be mounted BEFORE express.json() ────────
app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());

app.use('/api', mainRouter);

app.get('/api/sync-movies', async (req, res) => {
    const result = await syncMoviesFromTMDB();
    res.json(result);
});

const frontendPath = path.join(process.cwd(), 'frontend/dist');
app.use(express.static(frontendPath));

app.get(/.*/, (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
        res.status(404).json({ error: 'API endpoint not found' });
    }
});

app.listen(3000, () => {
    console.log('API Сервер запущено на http://localhost:3000');
});