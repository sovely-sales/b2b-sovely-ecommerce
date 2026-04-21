import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

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
import analyticsRouter from './routes/analytics.routes.js';
import webhookRouter from './routes/webhook.routes.js';

const app = express();
app.set('trust proxy', 1);

app.use(
    helmet({
        crossOriginResourcePolicy: false,
    })
);

const allowedOrigins = [
    process.env.CORS_ORIGIN,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
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
        credentials: true,
        exposedHeaders: ['Content-Disposition'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    })
);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

app.use((req, res, next) => {
    console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

app.use('/api/webhooks/razorpay', express.raw({ type: 'application/json' }));

app.use(
    express.json({
        limit: '5mb',
        verify: (req, res, buf) => {
            req.rawBody = buf.toString();
        },
    })
);
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
app.use(express.static('public'));

app.use('/api/webhooks', webhookRouter);

const apiVersion = '/api/v1';
app.use(`${apiVersion}/products`, productRouter);
app.use(`${apiVersion}/health`, healthRouter);
app.use(`${apiVersion}/auth`, authRouter);
app.use(`${apiVersion}/users`, userRouter);
app.use(`${apiVersion}/categories`, categoryRouter);
app.use(`${apiVersion}/cart`, cartRouter);
app.use(`${apiVersion}/orders`, orderRouter);
app.use(`${apiVersion}/invoices`, invoiceRouter);
app.use(`${apiVersion}/payments`, paymentRouter);
app.use(`${apiVersion}/wallet`, walletRouter);
app.use(`${apiVersion}/analytics`, analyticsRouter);

app.use((req, res, next) => {
    console.log(`❌ 404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: `The route ${req.method} ${req.originalUrl} does not exist on this server.`,
    });
});

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    if (statusCode !== 401) {
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
