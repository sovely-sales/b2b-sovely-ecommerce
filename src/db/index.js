import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDB Connected!! DB Host: ${connectionInstance.connection.host}`);

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error after initial connection:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
        });
    } catch (error) {
        console.error('MongoDB connection FAILED', error);
        process.exit(1);
    }
};

export default connectDB;
