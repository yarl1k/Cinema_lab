import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

/**
 * Core email sending function via Resend API.
 * All email types flow through this single function.
 */
export const sendMail = async (
    email: string,
    subject: string,
    htmlToSend: string
): Promise<void> => {
    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [email],
            subject,
            html: htmlToSend,
        });

        if (error) {
            console.error(
                `[Resend API Error] Помилка відправки на ${email}:`,
                error
            );
            return;
        }

        console.log(
            `[Mail Service] Лист успішно доставлено в Resend для ${email}, ID: ${data?.id}`
        );
    } catch (error: any) {
        console.error(`[Mail Service] Error sending email to ${email}:`, error);
    }
};