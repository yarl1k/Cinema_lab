import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.join(__dirname, 'mail-templates');

const sessionReminderTemplate = fs.readFileSync(path.join(templatesDir, 'session-reminder.html'), 'utf-8');
const weeklyReminderTemplate = fs.readFileSync(path.join(templatesDir, 'weekly-reminder.html'), 'utf-8');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/api';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendMail = async (email: string, subject: string, htmlToSend: string): Promise<void> => {
    try {
        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_USER_FROM || '"CinemaLab" <noreply@cinemalab.local>',
            to: [email],
            subject: subject,
            html: htmlToSend
        });
    }
    catch (error: any) {
        console.error(`[Mail Service] Error sending email to ${email}:`, error);
    }
}

export const sendSessionReminder = async (
    email: string,
    userName: string,
    movieTitle: string,
    startTime: string,
    hallName: string
): Promise<void> => {
    const profileUrl = `${FRONTEND_URL}/profile`;

    const htmlToSend = sessionReminderTemplate
        .replaceAll('{{userName}}', userName)
        .replaceAll('{{movieTitle}}', movieTitle)
        .replaceAll('{{startTime}}', startTime)
        .replaceAll('{{hallName}}', hallName)
        .replaceAll('{{profileUrl}}', profileUrl);

    await sendMail(email, `Нагадування: сеанс "${movieTitle}" вже скоро!`, htmlToSend);
};

export const sendWeeklyDigest = async (
    email: string,
    userName: string,
    moviesListHtml: string
): Promise<void> => {
    const scheduleUrl = `${FRONTEND_URL}/`;
    const settingsUrl = `${FRONTEND_URL}/profile`;

    const htmlToSend = weeklyReminderTemplate
        .replaceAll('{{userName}}', userName)
        .replaceAll('{{moviesListHtml}}', moviesListHtml)
        .replaceAll('{{scheduleUrl}}', scheduleUrl)
        .replaceAll('{{settingsUrl}}', settingsUrl);

    await sendMail(email, `Свіжі релізи цього тижня 🎬`, htmlToSend);
};