import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { prisma } from './services/prisma_setup/database.js';
import './jobs/email.processing.js'; 
import './jobs/cron.scheduler.js';
import mainRouter from "./routers/index.js";

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later',
});
app.use('/api', apiLimiter);

app.use('/api', mainRouter);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Notifier is running' });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log(' Notifier Database connected successfully.');

        app.listen(PORT, () => {
            console.log(`Notifier Worker started on port ${PORT}`);
            console.log('BullMQ Ready to process emails');
        });
    }
    catch (error: any) {
        console.error('Error starting notifier:', error.message || error);
        process.exit(1);
    }
}

startServer();