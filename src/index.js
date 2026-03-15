import dotenv from "dotenv";
// Fixed the path to look for .env instead of a file literally named "env"
dotenv.config({ path: "./.env" });
import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
    .then(() => {
        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log(`Server is running at port ${port}...`);
        });
    })
    .catch((err) => {
console.error("MongoDB connection failed:", err);
        process.exit(1); // Crash immediately if DB fails, don't leave it hanging
    });
