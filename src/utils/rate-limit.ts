export interface RateLimitRule {
    limit: number;
    windowMs: number;
}

export interface RateLimitResult {
    allowed: boolean;
    limit: number;
    remaining: number;
    retryAfterSeconds: number;
    resetAt: number;
}

interface Bucket {
    hits: number[];
    lastSeen: number;
}

const MAX_TRACKED_KEYS = 5000;
const EVICTION_RATIO = 0.2;

const globalScope = globalThis as typeof globalThis & {
    __rateLimitBuckets?: Map<string, Bucket>;
};

const buckets: Map<string, Bucket> = (globalScope.__rateLimitBuckets ??= new Map());

function evictStaleKeys(): void {
    if (buckets.size <= MAX_TRACKED_KEYS) return;

    const entries = [...buckets.entries()].sort((a, b) => a[1].lastSeen - b[1].lastSeen);
    const toRemove = Math.ceil(MAX_TRACKED_KEYS * EVICTION_RATIO);

    for (let i = 0; i < toRemove && i < entries.length; i++) {
        buckets.delete(entries[i][0]);
    }
}

export function consumeRateLimit(
    key: string,
    rules: RateLimitRule[],
    now: number = Date.now()
): RateLimitResult {
    const maxWindowMs = rules.reduce((max, rule) => Math.max(max, rule.windowMs), 0);

    let bucket = buckets.get(key);
    if (!bucket) {
        bucket = { hits: [], lastSeen: now };
        buckets.set(key, bucket);
    }

    bucket.lastSeen = now;
    bucket.hits = bucket.hits.filter((timestamp) => now - timestamp < maxWindowMs);

    let allowed = true;
    let limit = rules[0]?.limit ?? 0;
    let remaining = Number.POSITIVE_INFINITY;
    let retryAfterSeconds = 0;

    for (const rule of rules) {
        const hitsInWindow = bucket.hits.filter((timestamp) => now - timestamp < rule.windowMs);
        const available = rule.limit - hitsInWindow.length;

        if (available <= 0) {
            allowed = false;
            const wait = Math.max(1, Math.ceil((hitsInWindow[0] + rule.windowMs - now) / 1000));
            retryAfterSeconds = Math.max(retryAfterSeconds, wait);
        }

        if (available < remaining) {
            remaining = available;
            limit = rule.limit;
        }
    }

    if (allowed) {
        bucket.hits.push(now);
        remaining = Math.max(remaining - 1, 0);
    }

    evictStaleKeys();

    return {
        allowed,
        limit,
        remaining: Math.max(remaining, 0),
        retryAfterSeconds,
        resetAt: (bucket.hits[0] ?? now) + maxWindowMs,
    };
}

const CLIENT_IP_HEADERS = ['x-nf-client-connection-ip', 'cf-connecting-ip', 'x-real-ip'];

export function getClientIdentifier(request: Request, fallbackAddress?: string): string {
    for (const header of CLIENT_IP_HEADERS) {
        const value = request.headers.get(header);
        if (value) return value.trim();
    }

    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        const first = forwarded.split(',')[0]?.trim();
        if (first) return first;
    }

    return fallbackAddress?.trim() || 'unknown';
}
