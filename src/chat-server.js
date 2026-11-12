// Standalone server for the dropshipping FAQ chatbot only (no MongoDB, no order queue).
// Used for UAT / testing: `npm run start:chat`.
// Env: GEMINI_API_KEY (required), CHAT_CORS_ORIGINS (comma-separated site URLs),
//      DROPSHIPPING_FAQ_URL, CHAT_DAILY_AI_LIMIT, REDIS_URL (all optional), PORT.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.routes.js';

const app = express();
app.set('trust proxy', 1); // correct client IPs for rate limiting behind Render's proxy

const origins = (process.env.CHAT_CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

app.use(
    cors({
        origin: (origin, cb) => {
            if (!origin || origins.length === 0 || origins.includes(origin)) return cb(null, true);
            return cb(null, false);
        },
    })
);
app.use(express.json({ limit: '32kb' }));

app.get('/', (req, res) => res.json({ ok: true, service: 'sovely-chat' }));
app.get('/api/v1/health', (req, res) => res.json({ ok: true }));
app.use('/api/v1/chat', chatRouter);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    res.status(status).json({
        success: false,
        statusCode: status,
        message: status === 500 ? 'Internal error' : err.message,
        errors: err.errors || [],
    });
});

const port = process.env.PORT || 8015;
app.listen(port, () => {
    console.log(`Sovely chat server on port ${port}`);
    console.log(`Allowed origins: ${origins.length ? origins.join(', ') : 'any (set CHAT_CORS_ORIGINS)'}`);
    if (!process.env.GEMINI_API_KEY) console.warn('GEMINI_API_KEY is not set: AI answers are disabled');
});
