import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../src/models/Product.js'; 

dotenv.config();

const KNOWN_BRANDS = [
    "Eyelet", "Bellavita", "Liger", "Badz", "Apex", "OG Beauty", "Chocotown", 
    "Home Chef", "Konvex", "Oracle", "Ved Sanjeevani", "Supermom", "Maniarrs", 
    "In' Lief", "Funwood", "Orbit", "Wagtail", "IKI", "Zequz", "Ganesh", "Ritu", 
    "Nekza", "Konex", "Freshee", "Aditi", "Live Touch", "Beautiful Basics", 
    "Camel", "Kangaro", "Electro Play", "Lapcare", "Pro Clean", "Vegnar", 
    "Truzo", "Sameo", "Signature", "Next", "Pexpo", "Prexo"
];



const normalizeString = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const categorizeBrands = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Connected to MongoDB. Starting brand migration...');

        const products = await Product.find({});
        console.log(`Found ${products.length} products to check.`);

        const bulkOps = [];
        let matchCount = 0;

        for (const product of products) {
            // Combine SKU and Title for maximum matching potential
            const searchString = normalizeString(`${product.sku} ${product.title}`);
            let matchedBrand = "Your Brand"; // Fallback

            for (const brand of KNOWN_BRANDS) {
                const normalizedBrand = normalizeString(brand);
                
                if (searchString.includes(normalizedBrand)) {
                    matchedBrand = brand;
                    break; // Stop looking once we find a match
                }
            }

            // Only queue an update if the brand actually changed or needs setting
            if (product.vendor !== matchedBrand) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: product._id },
                        update: { $set: { vendor: matchedBrand } }
                    }
                });
                matchCount++;
            }
        }

        if (bulkOps.length > 0) {
            console.log(`⏳ Applying updates to ${bulkOps.length} products...`);
            await Product.bulkWrite(bulkOps);
            console.log(`✅ Successfully updated ${matchCount} products!`);
        } else {
            console.log('✅ No updates needed. Everything is already categorized.');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        process.exit(0);
    }
};

categorizeBrands();
