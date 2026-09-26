import type { APIRoute } from 'astro';
import { EmailService } from '../../services/email.service';
import {
    CONTACT_RATE_RULES,
    escapeHtml,
    validateContactPayload,
} from '../../utils/contact';
import { consumeRateLimit, getClientIdentifier } from '../../utils/rate-limit';

export const prerender = false;

const emailService = new EmailService();

function jsonResponse(
    body: Record<string, unknown>,
    status: number,
    headers: Record<string, string> = {}
): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            ...headers,
        },
    });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
    const identifier = getClientIdentifier(request, clientAddress);
    const rateLimit = consumeRateLimit(identifier, CONTACT_RATE_RULES);

    const rateLimitHeaders: Record<string, string> = {
        'X-RateLimit-Limit': String(rateLimit.limit),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetAt / 1000)),
    };

    if (!rateLimit.allowed) {
        return jsonResponse(
            { success: false, code: 'RATE_LIMITED', retryAfter: rateLimit.retryAfterSeconds },
            429,
            { ...rateLimitHeaders, 'Retry-After': String(rateLimit.retryAfterSeconds) }
        );
    }

    if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
        return jsonResponse({ success: false, code: 'INVALID_CONTENT_TYPE' }, 415, rateLimitHeaders);
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return jsonResponse({ success: false, code: 'INVALID_CONTENT_TYPE' }, 400, rateLimitHeaders);
    }

    const validation = validateContactPayload(body);
    if (!validation.ok) {
        return jsonResponse({ success: false, code: validation.code }, 400, rateLimitHeaders);
    }

    const { email, subject, message, website } = validation.value;

    if (website) {
        return jsonResponse({ success: true }, 200, rateLimitHeaders);
    }

    try {
        await emailService.sendEmail({
            from: email,
            subject,
            html: `<p>${escapeHtml(message).replace(/\r?\n/g, '<br />')}</p>`,
        });

        return jsonResponse({ success: true }, 200, rateLimitHeaders);
    } catch (error) {
        console.error('Contact form delivery failed:', error);

        return jsonResponse({ success: false, code: 'SERVER_ERROR' }, 500, rateLimitHeaders);
    }
};
