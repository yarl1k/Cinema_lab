import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'CinemaLab <noreply@example.com>';

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailParams): Promise<void> => {
    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html,
        });
    } catch (error) {
        console.error('Помилка відправки email:', error);
    }
};

const TEMPLATES_DIR = join(process.cwd(), 'templates', 'email-templates');

const getTemplate = (filename: string): string => {
    try {
        return readFileSync(join(TEMPLATES_DIR, filename), 'utf-8');
    } catch (e) {
        console.error(`Error loading template ${filename}:`, e);
        return '';
    }
};

const templates = {
    verification: getTemplate('verification.html'),
    resetPassword: getTemplate('reset-password.html'),
    welcomeGuest: getTemplate('welcome-guest.html'),
    tickets: getTemplate('tickets.html'),
};

export const getVerificationEmailHtml = (url: string, userName: string): string => {
    return templates.verification
        .replace(/\{\{url\}\}/g, url)
        .replace(/\{\{userName\}\}/g, userName);
};

export const getResetPasswordEmailHtml = (url: string, userName: string): string => {
    return templates.resetPassword
        .replace(/\{\{url\}\}/g, url)
        .replace(/\{\{userName\}\}/g, userName);
};

export const getWelcomeGuestEmailHtml = (url: string, userName: string): string => {
    return templates.welcomeGuest
        .replace(/\{\{url\}\}/g, url)
        .replace(/\{\{userName\}\}/g, userName);
};

export const getTicketsEmailHtml = (
    userName: string,
    movieTitle: string,
    startTime: string,
    hallName: string,
    tickets: { row: number; seatNumber: number; ticketNumber: string }[],
    orderNumber: string
): string => {
    const formattedDate = new Date(startTime).toLocaleString('uk-UA', { 
        timeZone: 'Europe/Kyiv',
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });

    const ticketsHtml = tickets.map(t => `
        <tr>
            <td style="color:#f1eeef;font-size:14px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Ряд ${t.row}, Місце ${t.seatNumber}</td>
            <td style="color:#f1eeef;font-size:14px;padding:12px 0;text-align:right;border-bottom:1px solid rgba(255,255,255,0.05);font-family:monospace;">${t.ticketNumber}</td>
        </tr>
    `).join('');

    return templates.tickets
        .replace(/\{\{userName\}\}/g, userName)
        .replace(/\{\{movieTitle\}\}/g, movieTitle)
        .replace(/\{\{startTime\}\}/g, formattedDate)
        .replace(/\{\{hallName\}\}/g, hallName)
        .replace(/\{\{orderNumber\}\}/g, orderNumber)
        .replace(/\{\{profileUrl\}\}/g, process.env.BETTER_AUTH_URL ? process.env.BETTER_AUTH_URL + '/profile' : 'http://localhost:5173/profile')
        .replace(/\{\{ticketsHtml\}\}/g, ticketsHtml);
};
