import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fakerEN_IN as faker } from '@faker-js/faker';

import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { Cart } from '../src/models/Cart.js';
import { Wishlist } from '../src/models/Wishlist.js';

dotenv.config();

const seedEngagement = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/db_sovely`);
        console.log('📦 Connected to DB. Clearing old Carts and Wishlists...');
        await Cart.deleteMany({});
        await Wishlist.deleteMany({});

        const resellers = await User.find({ role: 'RESELLER' });
        const products = await Product.find({ status: 'active' });

        if (resellers.length === 0 || products.length === 0) {
            console.error('❌ Missing dependencies. Run users and products seeders first.');
            process.exit(1);
        }

        console.log(`🌱 Seeding Carts and Wishlists for ${resellers.length} users...`);

        for (const reseller of resellers) {
            
            if (faker.datatype.boolean({ probability: 0.6 })) {
                const numWishlistItems = faker.number.int({ min: 1, max: 8 });
                const selectedProducts = faker.helpers.arrayElements(products, numWishlistItems);
                
                await Wishlist.create({
                    userId: reseller._id,
                    items: selectedProducts.map(p => ({
                        productId: p._id,
                        addedAt: faker.date.recent({ days: 30 })
                    }))
                });
            }

            
            if (faker.datatype.boolean({ probability: 0.4 })) {
                const numCartItems = faker.number.int({ min: 1, max: 4 });
                const selectedProducts = faker.helpers.arrayElements(products, numCartItems);
                
                const cartItems = [];
                let subTotalPlatformCost = 0;
                let totalTax = 0;
                let totalShippingCost = 0;
                let grandTotalPlatformCost = 0;
                let totalExpectedProfit = 0;

                for (const product of selectedProducts) {
                    const orderType = faker.helpers.arrayElement(['DROPSHIP', 'WHOLESALE']);
                    
                    const qty = orderType === 'WHOLESALE' ? faker.number.int({ min: product.moq, max: product.moq + 20 }) : faker.number.int({ min: 1, max: 3 });
                    
                    const platformUnitCost = product.dropshipBasePrice;
                    const resellerSellingPrice = product.suggestedRetailPrice;
                    const gstSlab = product.gstSlab || 18;
                    const taxAmountPerUnit = platformUnitCost * (gstSlab / 100);
                    const shippingCost = faker.number.int({ min: 50, max: 200 });

                    const totalItemPlatformCost = (platformUnitCost + taxAmountPerUnit) * qty + shippingCost;
                    const expectedProfit = ((resellerSellingPrice - platformUnitCost - taxAmountPerUnit) * qty) - shippingCost;

                    cartItems.push({
                        productId: product._id,
                        qty,
                        orderType,
                        platformUnitCost,
                        resellerSellingPrice,
                        gstSlab,
                        taxAmountPerUnit,
                        shippingCost,
                        totalItemPlatformCost,
                        expectedProfit: expectedProfit > 0 ? expectedProfit : 0 
                    });

                    subTotalPlatformCost += (platformUnitCost * qty);
                    totalTax += (taxAmountPerUnit * qty);
                    totalShippingCost += shippingCost;
                    grandTotalPlatformCost += totalItemPlatformCost;
                    totalExpectedProfit += expectedProfit > 0 ? expectedProfit : 0;
                }

                await Cart.create({
                    resellerId: reseller._id,
                    items: cartItems,
                    subTotalPlatformCost,
                    totalTax,
                    totalShippingCost,
                    grandTotalPlatformCost,
                    totalExpectedProfit
                });
            }
        }

        console.log('✅ Engagement Seeding Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Engagement Seeding Failed:', error);
        process.exit(1);
    }
};

seedEngagement();
