
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../src/models/Product.js';

dotenv.config();

const migrateGST = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Connected to DB. Starting GST 2.0 Migration...');

        
        const twelveResult = await Product.updateMany(
            { gstSlab: 12 },
            { $set: { gstSlab: 5 } }
        );
        console.log(`✅ Migrated ${twelveResult.modifiedCount} items from 12% to 5%`);

        
        const twentyEightResult = await Product.updateMany(
            { gstSlab: 28 },
            { $set: { gstSlab: 18 } }
        );
        console.log(`✅ Migrated ${twentyEightResult.modifiedCount} items from 28% to 18%`);

        console.log('🎉 GST Migration Complete!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateGST();
