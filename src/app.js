import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] // Ensure PUT is here!
}));

app.use(express.json({ limit: "20kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

// Route Imports
import healthRouter from "./routes/health.routes.js";
import userRouter from "./routes/user.routes.js";
import productRouter from "./routes/product.routes.js";
import authRouter from "./routes/auth.routes.js";
import categoryRouter from "./routes/category.routes.js";
import orderRouter from "./routes/order.routes.js";
import invoiceRouter from "./routes/invoice.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import walletRouter from "./routes/wallet.routes.js";
import wishlistRouter from "./routes/wishlist.routes.js";

const app = express();

// Middleware
app.use(helmet()); // Added security headers
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/invoices", invoiceRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/wallet", walletRouter);
app.use("/api/v1/wishlist", wishlistRouter);

// Global error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    if (statusCode !== 401) {
        console.error("Global Error Handler Caught:", err);
    }

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || [],
    });
});

export { app };
