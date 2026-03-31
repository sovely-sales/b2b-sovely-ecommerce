import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fakerEN_IN as faker } from '@faker-js/faker';

import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { StockAdjustment } from '../src/models/StockAdjustment.js';

dotenv.config();

const seedInventoryLogs = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/db_sovely`);
        console.log('📦 Connected to DB. Clearing old Stock Adjustments...');
        await StockAdjustment.deleteMany({});

        const adminUser = await User.findOne({ role: 'ADMIN' });
        const products = await Product.find({});

        if (!adminUser || products.length === 0) {
            console.error('❌ Missing Admin user or Products. Run previous seeders first.');
            process.exit(1);
        }

        console.log(`🌱 Generating Historical Stock Adjustments...`);
        
        const adjustments = [];
        const reasons = [
            'Vendor Restock', 'Vendor Restock', 'Vendor Restock', 
            'Damaged in Transit', 
            'Quality Control Rejection', 
            'Found in Warehouse Audit'
        ];

        
        for (const product of products) {
            const numAdjustments = faker.number.int({ min: 3, max: 8 });
            
            for (let i = 0; i < numAdjustments; i++) {
                const reason = faker.helpers.arrayElement(reasons);
                let adjustedAmount;

                
                if (reason.includes('Damaged') || reason.includes('Rejection')) {
                    adjustedAmount = -faker.number.int({ min: 1, max: 10 });
                } else {
                    adjustedAmount = faker.number.int({ min: 50, max: 500 }); 
                }

                adjustments.push({
                    productId: product._id,
                    adminUserId: adminUser._id,
                    adjustedAmount,
                    reason,
                    createdAt: faker.date.recent({ days: 180 }) 
                });
            }
        }

        
        await StockAdjustment.insertMany(adjustments);

        console.log(`✅ Inventory Seeding Complete! Inserted ${adjustments.length} logs.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Inventory Seeding Failed:', error);
        process.exit(1);
    }
};

seedInventoryLogs();
