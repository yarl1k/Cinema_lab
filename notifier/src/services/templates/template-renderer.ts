import { getTemplate } from "./template-loader.js";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";

/**
 * Replace all placeholder tokens in a template string.
 */
const render = (template: string, vars: Record<string, string>): string => {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
        result = result.replaceAll(`{{${key}}}`, value);
    }
    return result;
};

// ── Auth Emails ─────────────────────────────────────────────

export const renderVerificationEmail = (url: string, userName: string): string => {
    return render(getTemplate("verification"), { url, userName });
};

export const renderResetPasswordEmail = (url: string, userName: string): string => {
    return render(getTemplate("reset-password"), { url, userName });
};

export const renderWelcomeGuestEmail = (url: string, userName: string): string => {
    return render(getTemplate("welcome-guest"), { url, userName });
};

// ── Ticket Emails ───────────────────────────────────────────

interface TicketInfo {
    row: number;
    seatNumber: number;
    ticketNumber: string;
}

/**
 * Render tickets confirmation email.
 * Handles date formatting and ticket table HTML generation.
 */
export const renderTicketsEmail = (
    userName: string,
    movieTitle: string,
    startTime: string,
    hallName: string,
    tickets: TicketInfo[],
    orderNumber: string
): string => {
    const formattedDate = new Date(startTime).toLocaleString("uk-UA", {
        timeZone: "Europe/Kyiv",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const ticketsHtml = tickets
        .map(
            (t) => `
        <tr>
            <td style="color:#f1eeef;font-size:14px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Ряд ${t.row}, Місце ${t.seatNumber}</td>
            <td style="color:#f1eeef;font-size:14px;padding:12px 0;text-align:right;border-bottom:1px solid rgba(255,255,255,0.05);font-family:monospace;">${t.ticketNumber}</td>
        </tr>
    `
        )
        .join("");

    const profileUrl = `${BASE_URL}/profile`;

    return render(getTemplate("tickets"), {
        userName,
        movieTitle,
        startTime: formattedDate,
        hallName,
        orderNumber,
        profileUrl,
        ticketsHtml,
    });
};

// ── Session/Digest Emails ───────────────────────────────────

export const renderSessionReminder = (
    userName: string,
    movieTitle: string,
    startTime: string,
    hallName: string
): string => {
    const profileUrl = `${BASE_URL}/profile`;
    return render(getTemplate("session-reminder"), {
        userName,
        movieTitle,
        startTime,
        hallName,
        profileUrl,
    });
};

export const renderWeeklyDigest = (
    userName: string,
    moviesListHtml: string
): string => {
    const scheduleUrl = `${BASE_URL}/`;
    const settingsUrl = `${BASE_URL}/profile`;
    return render(getTemplate("weekly-reminder"), {
        userName,
        moviesListHtml,
        scheduleUrl,
        settingsUrl,
    });
};
