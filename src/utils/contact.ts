import env from 'env-var';

const { get } = env;

export const CONTACT_LIMITS = {
    email: 254,
    subject: 120,
    message: 5000,
} as const;

function intFromEnv(name: string, fallback: number): number {
    try {
        const value = get(name).asInt();
        return typeof value === 'number' && Number.isFinite(value) && value > 0
            ? value
            : fallback;
    } catch {
        return fallback;
    }
}

export const CONTACT_RATE_RULES = [
    {
        limit: intFromEnv('CONTACT_RATE_BURST', 3),
        windowMs: intFromEnv('CONTACT_RATE_BURST_WINDOW_MS', 10 * 60 * 1000),
    },
    {
        limit: intFromEnv('CONTACT_RATE_DAILY', 15),
        windowMs: intFromEnv('CONTACT_RATE_DAILY_WINDOW_MS', 24 * 60 * 60 * 1000),
    },
];

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type ContactErrorCode =
    | 'INVALID_CONTENT_TYPE'
    | 'MISSING_FIELDS'
    | 'INVALID_EMAIL'
    | 'FIELD_TOO_LONG';

export interface ContactPayload {
    email: string;
    subject: string;
    message: string;
    website: string;
}

export type ContactValidation =
    | { ok: true; value: ContactPayload }
    | { ok: false; code: ContactErrorCode };

const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/g;

export function sanitizeSingleLine(value: string): string {
    return value.replace(CONTROL_CHARACTERS, ' ').replace(/\s+/g, ' ').trim();
}

function asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

export function validateContactPayload(raw: unknown): ContactValidation {
    if (typeof raw !== 'object' || raw === null) {
        return { ok: false, code: 'MISSING_FIELDS' };
    }

    const body = raw as Record<string, unknown>;
    const email = asString(body.email).trim();
    const subject = sanitizeSingleLine(asString(body.subject));
    const message = asString(body.message).trim();
    const website = asString(body.website);

    if (!email || !subject || !message) {
        return { ok: false, code: 'MISSING_FIELDS' };
    }

    if (email.length > CONTACT_LIMITS.email) {
        return { ok: false, code: 'FIELD_TOO_LONG' };
    }

    if (subject.length > CONTACT_LIMITS.subject || message.length > CONTACT_LIMITS.message) {
        return { ok: false, code: 'FIELD_TOO_LONG' };
    }

    if (!EMAIL_PATTERN.test(email)) {
        return { ok: false, code: 'INVALID_EMAIL' };
    }

    return { ok: true, value: { email, subject, message, website } };
}

const HTML_ESCAPES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

export function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}
