import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// --- Route Imports ---
import healthRouter from './routes/health.routes.js';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import categoryRouter from './routes/category.routes.js';
import productRouter from './routes/product.routes.js';
import cartRouter from './routes/cart.routes.js';
import orderRouter from './routes/order.routes.js';
import invoiceRouter from './routes/invoice.routes.js';
import paymentRouter from './routes/payment.routes.js';
import walletRouter from './routes/wallet.routes.js';
import wishlistRouter from './routes/wishlist.routes.js';
import analyticsRouter from './routes/analytics.routes.js';
import webhookRouter from './routes/webhook.routes.js';

const app = express();
app.set('trust proxy', 1);

// ==========================================
// 1. Security & Utility Middlewares
// ==========================================
app.use(helmet());

const allowedOrigins = [
    process.env.CORS_ORIGIN,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true, // Crucial for reading the JWT cookies!
        exposedHeaders: ['Content-Disposition'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    })
);

// Rate Limiter: Prevent API abuse (1000 requests per 15 mins)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);
app.use('/api/webhooks', webhookRouter);

// ==========================================
// 2. Body Parsers & Static Files
// ==========================================
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());
app.use(express.static('public'));

// ==========================================
// 3. Mount B2B API Routes
// ==========================================
const apiVersion = '/api/v1';

// Identity & Platform Health
app.use(`${apiVersion}/health`, healthRouter);
app.use(`${apiVersion}/auth`, authRouter);
app.use(`${apiVersion}/users`, userRouter);

// The B2B Catalog
app.use(`${apiVersion}/categories`, categoryRouter);
app.use(`${apiVersion}/products`, productRouter);
app.use(`${apiVersion}/wishlist`, wishlistRouter);

// The Purchasing Pipeline (Our newly rewritten engine)
app.use(`${apiVersion}/cart`, cartRouter);
app.use(`${apiVersion}/orders`, orderRouter);

// Financials & Compliance
app.use(`${apiVersion}/invoices`, invoiceRouter);
app.use(`${apiVersion}/payments`, paymentRouter);
app.use(`${apiVersion}/wallet`, walletRouter);

// Admin Analytics
app.use(`${apiVersion}/analytics`, analyticsRouter);

// ==========================================
// 4. Global Error Handler
// ==========================================
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Only log severe/unexpected errors in the console (ignore 401 Unauthorized / 404s)
    if (statusCode !== 401 && statusCode !== 404) {
        console.error('🔥 Global Error Caught:', err);
    }

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || [],
    });
});

export { app };
