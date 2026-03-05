import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "20kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

import healthRouter from "./routes/health.routes.js";
import userRouter from "./routes/user.routes.js";

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/users", userRouter);

// Global error handler — returns JSON instead of Express's default HTML error page
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong";

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || [],
    });
});

export { app };
