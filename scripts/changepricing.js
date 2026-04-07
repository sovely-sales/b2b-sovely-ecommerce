import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../src/models/Product.js'; 

dotenv.config();

const applyDiscount = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        console.log('Applying 40% discount (setting prices to 60% and rounding)...');

        const result = await Product.updateMany(
            {}, 
            [   
                { 
                    $set: { 
                        dropshipBasePrice: { $round: [{ $multiply: ["$dropshipBasePrice", 0.6] }, 0] },
                        platformSellPrice: { $round: [{ $multiply: ["$platformSellPrice", 0.6] }, 0] }
                    } 
                }
            ],
            { updatePipeline: true } 
        );

        console.log(`Successfully updated ${result.modifiedCount} products.`);

    } catch (error) {
        console.error('Error updating prices:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Database disconnected. Exiting.');
        process.exit(0);
    }
};

applyDiscount();