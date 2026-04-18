// ── Regex Patterns ───────────────────────────────────────────────────

/** RFC 5322–style email validation */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/** Ukrainian phone: +380XXXXXXXXX */
const PHONE_REGEX = /^\+380\d{9}$/;

/** Name: 2-50 chars, letters (incl. Cyrillic), spaces, hyphens, apostrophes */
const NAME_REGEX = /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ''\- ]{2,50}$/;

/** At least 8 chars, max 128, one uppercase, one lowercase, one digit */
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_DIGIT = /\d/;

// ── Validators ───────────────────────────────────────────────────────

export const isValidEmail = (email: string): boolean =>
    EMAIL_REGEX.test(email.trim());

export const isValidPhone = (phone: string): boolean =>
    PHONE_REGEX.test(phone.trim());

export const isValidName = (name: string): boolean =>
    NAME_REGEX.test(name.trim());

export interface PasswordValidation {
    valid: boolean;
    errors: string[];
}

export const isValidPassword = (password: string): PasswordValidation => {
    const errors: string[] = [];

    if (password.length < PASSWORD_MIN)
        errors.push(`Мінімум ${PASSWORD_MIN} символів`);
    if (password.length > PASSWORD_MAX)
        errors.push(`Максимум ${PASSWORD_MAX} символів`);
    if (!HAS_UPPERCASE.test(password))
        errors.push('Потрібна хоча б одна велика літера');
    if (!HAS_LOWERCASE.test(password))
        errors.push('Потрібна хоча б одна мала літера');
    if (!HAS_DIGIT.test(password))
        errors.push('Потрібна хоча б одна цифра');

    return { valid: errors.length === 0, errors };
};

/** Strip dangerous HTML tags to prevent XSS */
export const sanitizeInput = (input: string): string =>
    input.replace(/<[^>]*>/g, '').trim();
