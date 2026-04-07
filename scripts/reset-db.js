import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User.js';

dotenv.config();

const resetDatabase = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is missing in environment variables.');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 MongoDB Connected for Wipe & Reset');

        
        console.log('🧹 Dropping entire database...');
        await mongoose.connection.db.dropDatabase();

        
        console.log('🔄 Syncing User indexes...');
        await User.syncIndexes();

        
        console.log('👑 Creating Master Admin User...');
        const admin = await User.create({
            name: 'System Admin',
            email: 'admin@sovely.in',
            phoneNumber: '9876543210',
            passwordHash: 'Admin@123', 
            role: 'ADMIN',
            accountType: 'B2B',
            isVerifiedB2B: true
        });

        console.log('\n✨=========================================✨');
        console.log('✅ Database wiped cleanly.');
        console.log('✅ Master Admin created successfully.');
        console.log('🔑 Login Email:    admin@sovely.in');
        console.log('🔑 Login Password: Admin@123');
        console.log('✨=========================================✨\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Reset Failed:', error);
        process.exit(1);
    }
};

resetDatabase();
