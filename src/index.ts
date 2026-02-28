import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import expressLayouts from 'express-ejs-layouts';
import mainRouter from './routes/index.js';
import { syncMoviesFromTMDB } from './services/tmdbParse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);

app.set('layout', 'layouts/AppLayout');

app.use(express.static(path.join(__dirname, '../public')));
app.use('/', mainRouter);

// Тимчасовий виклик для заповнення бази
app.get('/api/sync-movies', async (req, res) => {
    const result = await syncMoviesFromTMDB();
    res.json(result);
});

app.listen(3000, () => {
    console.log('Сервер запущено на http://localhost:3000');
});