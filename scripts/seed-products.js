import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fakerEN_IN as faker } from '@faker-js/faker';
import { Category } from '../src/models/Category.js';
import { Product } from '../src/models/Product.js';

dotenv.config();


const generateRichHTML = (productName, material, vendor, weight, dimensions, hsn) => {
    return `
        <div class="product-description">
            <p><strong>Premium ${productName}</strong> manufactured by <em>${vendor}</em>. Engineered for durability and high performance in commercial and industrial environments.</p>
            
            <h4>Key Features & Benefits</h4>
            <ul>
                <li><strong>Material Composition:</strong> High-grade ${material} ensuring longevity and resistance to wear and tear.</li>
                <li><strong>B2B Optimized:</strong> Packaged securely for bulk transit. Ready for immediate wholesale distribution or internal industrial use.</li>
                <li><strong>Quality Assurance:</strong> ISO-certified manufacturing process with strict defect-rate monitoring.</li>
                <li><strong>Versatility:</strong> ${faker.commerce.productDescription()}</li>
            </ul>

            <h4>Technical Specifications</h4>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tbody>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 8px 0;"><strong>Physical Dimensions (L x W x H)</strong></td>
                        <td style="padding: 8px 0;">${dimensions.length}cm x ${dimensions.width}cm x ${dimensions.height}cm</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 8px 0;"><strong>Unit Weight</strong></td>
                        <td style="padding: 8px 0;">${(weight / 1000).toFixed(2)} kg (${weight}g)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 8px 0;"><strong>HSN Code</strong></td>
                        <td style="padding: 8px 0;">${hsn}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Primary Material</strong></td>
                        <td style="padding: 8px 0;">${material}</td>
                    </tr>
                </tbody>
            </table>
            
            <p style="margin-top: 15px; font-size: 0.9em; color: #666;"><em>Note: Actual product color and finish may vary slightly due to manufacturing batches. Please review the return policy for bulk orders.</em></p>
        </div>
    `;
};

const seedProducts = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/db_sovely`);
        console.log('📦 Connected to DB. Clearing old Categories & Products...');
        await Category.deleteMany({});
        await Product.deleteMany({});

        console.log('🌱 Seeding Categories...');
        const parentCategories = await Category.insertMany([
            { name: 'Industrial Supplies' }, { name: 'Electronics & Spares' }, { name: 'Packaging Materials' }
        ]);

        const allCategories = await Category.insertMany([
            { name: 'Power Tools', parentCategoryId: parentCategories[0]._id },
            { name: 'Circuit Boards', parentCategoryId: parentCategories[1]._id },
            { name: 'Corrugated Boxes', parentCategoryId: parentCategories[2]._id },
        ]);

        console.log('🌱 Seeding 1000 B2B Products with Rich Descriptions...');
        const products = Array.from({ length: 1000 }).map(() => {
            const basePrice = faker.number.int({ min: 200, max: 15000 });
            const srp = Math.round(basePrice * faker.number.float({ min: 1.4, max: 2.2 })); 
            const category = faker.helpers.arrayElement(allCategories);
            
            const tieredPricing = [
                { minQty: 10, maxQty: 49, pricePerUnit: Math.round(basePrice * 0.95) },
                { minQty: 50, maxQty: 99, pricePerUnit: Math.round(basePrice * 0.90) },
                { minQty: 100, pricePerUnit: Math.round(basePrice * 0.85) }            
            ];

            
            const productName = faker.commerce.productName();
            const vendor = `${faker.company.name()} Mfg`;
            const material = faker.commerce.productMaterial();
            const weight = faker.number.int({ min: 100, max: 20000 });
            const dimensions = {
                length: faker.number.int({ min: 5, max: 100 }),
                width: faker.number.int({ min: 5, max: 100 }),
                height: faker.number.int({ min: 5, max: 50 })
            };
            const hsnCode = faker.string.numeric(6);

            return {
                sku: `SOV-${faker.string.alphanumeric({ length: 7, casing: 'upper' })}`,
                title: productName,
                descriptionHTML: generateRichHTML(productName, material, vendor, weight, dimensions, hsnCode),
                vendor: vendor,
                tags: [material, 'Wholesale', 'Bulk', faker.commerce.productAdjective()],
                categoryId: category._id,
                images: [{ url: faker.image.urlPicsumPhotos({ width: 800, height: 800 }), position: 1 }],
                
                dropshipBasePrice: basePrice,
                suggestedRetailPrice: srp,
                tieredPricing: tieredPricing,
                
                weightGrams: weight,
                dimensions: dimensions,
                hsnCode: hsnCode,
                gstSlab: faker.helpers.arrayElement([5, 12, 18, 28]),
                shippingDays: faker.helpers.arrayElement(['2-3', '3-5', '5-7']),
                
                moq: faker.helpers.arrayElement([5, 10, 20, 50]),
                inventory: { stock: faker.number.int({ min: 100, max: 5000 }), alertThreshold: 50 },
                status: faker.helpers.arrayElement(['active', 'active', 'draft'])
            };
        });

        
        console.log('⏳ Inserting products into database (this might take a few seconds)...');
        for (const productData of products) {
            await Product.create(productData);
        }

        console.log('✅ Products Seeding Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Product Seeding Failed:', error);
        process.exit(1);
    }
};

seedProducts();
