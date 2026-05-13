import dotenv from 'dotenv';
dotenv.config();
import connectDB from './db/index.js';
import { app } from './app.js';
import cron from 'node-cron';
import { syncProductRtoRates } from './services/analytics.service.js';
import { Order } from './models/Order.js';
import { User } from './models/User.js';
import { WalletTransaction } from './models/WalletTransaction.js';
import mongoose from 'mongoose';

const startServer = async () => {
    try {
        await connectDB();
        console.log('✅ MongoDB connected');

        cron.schedule('0 2 * * *', () => syncProductRtoRates(), { timezone: 'Asia/Kolkata' });

        if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
            app.listen(process.env.PORT || 8000, () => {
                console.log(`⚙️ Server is running at port : ${process.env.PORT || 8000}`);
            });
        }
    } catch (err) {
        console.log('MONGO db connection failed !!! ', err);
    }
};

startServer();

export default app;
