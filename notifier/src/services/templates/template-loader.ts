import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.join(__dirname, "..", "resend", "mail-templates");

/**
 * In-memory template cache.
 * Templates are loaded once at startup for performance.
 */
const templateCache = new Map<string, string>();

/**
 * Load an HTML template by name from the mail-templates directory.
 * Results are cached in memory — file is read only once per template.
 *
 * @param name - Template filename without extension (e.g. "verification")
 * @returns Template HTML string
 * @throws Error if template file not found
 */
export const getTemplate = (name: string): string => {
    const cached = templateCache.get(name);
    if (cached) return cached;

    const filePath = path.join(templatesDir, `${name}.html`);

    try {
        const content = fs.readFileSync(filePath, "utf-8");
        templateCache.set(name, content);
        return content;
    } catch (error) {
        console.error(`[TemplateLoader] Failed to load template "${name}":`, error);
        throw new Error(`Template "${name}" not found at ${filePath}`);
    }
};

/**
 * Preload all known templates at startup.
 * Prevents lazy-loading delays on first email send.
 */
export const preloadTemplates = (): void => {
    const templateNames = [
        "session-reminder",
        "weekly-reminder",
        "verification",
        "reset-password",
        "welcome-guest",
        "tickets",
    ];

    for (const name of templateNames) {
        try {
            getTemplate(name);
            console.log(`[TemplateLoader] Loaded: ${name}.html`);
        } catch {
            console.warn(`[TemplateLoader] Optional template missing: ${name}.html`);
        }
    }
};
