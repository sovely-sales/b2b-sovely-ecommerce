// Redis helpers for the chatbot: answer cache and a daily AI-call budget.
// Every function fails open (returns null/false) if Redis is unavailable,
// so a Redis outage never breaks the chat.
import crypto from 'node:crypto';
import Redis from 'ioredis';

const ANSWER_TTL_SECONDS = 24 * 60 * 60;

let client = null;
const redis = () => {
    if (!client) {
        const opts = {
            lazyConnect: false,
            enableOfflineQueue: false,
            maxRetriesPerRequest: 1,
            connectTimeout: 2000,
        };
        client = process.env.REDIS_URL
            ? new Redis(process.env.REDIS_URL, opts)
            : new Redis({ host: '127.0.0.1', port: 6379, ...opts });
        client.on('error', () => {}); // logged by the queue service already
    }
    return client;
};

// Right after a cold start the connection is still opening, so wait up to 1s for it.
// If Redis is down (reconnecting), fail immediately so the chat isn't slowed down.
let pending = null;
const ready = async () => {
    const c = redis();
    if (c.status === 'ready') return c;
    if (c.status !== 'connecting' && c.status !== 'connect' && c.status !== 'wait') {
        throw new Error(`redis ${c.status}`);
    }
    pending =
        pending ||
        new Promise((resolve, reject) => {
            const onReady = () => {
                clearTimeout(t);
                resolve();
            };
            const t = setTimeout(() => {
                c.off('ready', onReady);
                reject(new Error('redis not ready'));
            }, 1000);
            c.once('ready', onReady);
        }).finally(() => (pending = null));
    await pending;
    return c;
};

const normalize = (text) =>
    String(text)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();

export const answerKey = (version, question) =>
    'chat:dropship:' +
    crypto.createHash('sha1').update(`${version}|${normalize(question)}`).digest('hex');

export const getCachedAnswer = async (key) => {
    try {
        return await (await ready()).get(key);
    } catch {
        return null;
    }
};

export const cacheAnswer = async (key, answer) => {
    try {
        await (await ready()).set(key, answer, 'EX', ANSWER_TTL_SECONDS);
    } catch {
        /* ignore */
    }
};

// Returns true if today's AI budget is used up. No limit when CHAT_DAILY_AI_LIMIT is unset.
export const overDailyBudget = async () => {
    const limit = Number(process.env.CHAT_DAILY_AI_LIMIT || 0);
    if (!limit) return false;
    try {
        const key = `chat:dropship:ai-calls:${new Date().toISOString().slice(0, 10)}`;
        const c = await ready();
        const count = await c.incr(key);
        if (count === 1) await c.expire(key, 2 * 24 * 60 * 60);
        return count > limit;
    } catch {
        return false;
    }
};
