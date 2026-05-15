import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

// KEEP the Vercel connection caching
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) {
        console.log('Using cached MongoDB connection');
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            maxPoolSize: 50,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => {
            console.log(`MongoDB Connected!! DB Host: ${mongoose.connection.host}`);
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
        
        // ADD your new UAT connection event listeners here
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error after initial connection:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
        });

        return cached.conn;
    } catch (error) {
        console.error('MongoDB connection FAILED', error);
        cached.promise = null;
        throw error; // Or process.exit(1) like you had in UAT
    }
};

export default connectDB;