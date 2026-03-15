import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Category } from './src/models/Category.js';
import { DB_NAME } from './src/constants.js';

dotenv.config();

async function run() {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log("Connected to", DB_NAME);

    // Check all categories to see how many have null as parentCategoryId
    const categories = await Category.find({ parentCategoryId: null }).limit(10).lean();
    console.log("Categories with null parent:", categories.length);
    categories.forEach(c => {
        console.log(c.name, c._id, "-> parent:", c.parentCategoryId, "type:", typeof c.parentCategoryId);
    });

    process.exit(0);
}

run();
