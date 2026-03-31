import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fakerEN_IN as faker } from '@faker-js/faker';


import { User } from '../src/models/User.js';
import { Category } from '../src/models/Category.js';
import { Product } from '../src/models/Product.js';
import { UserPricing } from '../src/models/UserPricing.js';
import { Cart } from '../src/models/Cart.js';
import { Wishlist } from '../src/models/Wishlist.js';
import { Order } from '../src/models/Order.js';
import { Invoice } from '../src/models/Invoice.js';
import { Payment } from '../src/models/Payment.js';
import { WalletTransaction } from '../src/models/WalletTransaction.js';
import { StockAdjustment } from '../src/models/StockAdjustment.js';
import { Counter } from '../src/models/Counter.js';

dotenv.config();


const generateGSTIN = () => {
    const stateCode = faker.number.int({ min: 10, max: 37 }).toString(); 
    const panChars = faker.string.alpha({ length: 5, casing: 'upper' });
    const panNums = faker.string.numeric(4);
    const panChar2 = faker.string.alpha({ length: 1, casing: 'upper' });
    const entity = faker.number.int({ min: 1, max: 9 }).toString();
    const checksum = faker.string.alphanumeric({ length: 1, casing: 'upper' });
    return `${stateCode}${panChars}${panNums}${panChar2}${entity}Z${checksum}`;
};


const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 MongoDB Connected for Seeding');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

const seedDatabase = async () => {
    try {
        await connectDB();

        console.log('🧹 Dropping database to clear old indexes...');
await mongoose.connection.db.dropDatabase();


const models = [User, Category, Product, UserPricing, Cart, Wishlist, Order, Invoice, Payment, WalletTransaction, StockAdjustment, Counter];
for (let model of models) {
    await model.syncIndexes();
}
console.log('✨ Database and indexes cleared.\n');

        
        
        
        console.log('🌱 Seeding Categories...');
        const parentCategories = await Category.create([
            { name: 'Industrial Machinery' },
            { name: 'Electrical & Electronics' },
            { name: 'Packaging Materials' },
            { name: 'Textiles & Apparel' }
        ]);

        const subCategories = await Category.create([
            { name: 'Generators', parentCategoryId: parentCategories[0]._id },
            { name: 'Heavy Duty Cables', parentCategoryId: parentCategories[1]._id },
            { name: 'Corrugated Boxes', parentCategoryId: parentCategories[2]._id },
            { name: 'Wholesale Cotton', parentCategoryId: parentCategories[3]._id },
        ]);
        const allCategories = [...parentCategories, ...subCategories];

        
        
        
        console.log('🌱 Seeding Users...');
        const adminUser = await User.create({
            name: 'System Admin',
            email: 'admin@sovely.in',
            phoneNumber: '9876543210',
            passwordHash: 'Admin@123', 
            role: 'ADMIN',
            accountType: 'B2B',
            isVerifiedB2B: true
        });

const staticB2BUser = await User.create({
    name: 'Test B2B Company',
    email: 'b2b@sovely.in', 
    phoneNumber: '9999999998',
    passwordHash: 'Password@123',
    role: 'CUSTOMER',
    accountType: 'B2B',
    companyName: 'Sovely Test Corp',
    gstin: generateGSTIN(),
    isVerifiedB2B: true,
    walletBalance: 25000,
});

const staticB2CUser = await User.create({
    name: 'Test Consumer',
    email: 'b2c@sovely.in', 
    phoneNumber: '9999999999',
    passwordHash: 'Password@123',
    role: 'CUSTOMER',
    accountType: 'B2C',
});

        const b2bUsers = [];
        for (let i = 0; i < 5; i++) {
            b2bUsers.push({
                name: faker.person.fullName(),
                email: faker.internet.email(),
                phoneNumber: faker.phone.number('9#########'),
                passwordHash: 'Password@123',
                role: 'CUSTOMER',
                accountType: 'B2B',
                companyName: faker.company.name(),
                gstin: generateGSTIN(),
                isVerifiedB2B: true,
                walletBalance: faker.number.int({ min: 5000, max: 50000 }),
                addresses: [{
                    street: faker.location.streetAddress(),
                    city: faker.location.city(),
                    state: faker.location.state(),
                    zip: faker.location.zipCode('######'),
                    isDefault: true
                }]
            });
        }
        const createdB2BUsers = await User.create(b2bUsers);

        const b2cUsers = [];
        for (let i = 0; i < 5; i++) {
            b2cUsers.push({
                name: faker.person.fullName(),
                email: faker.internet.email(),
                phoneNumber: faker.phone.number('9#########'),
                passwordHash: 'Password@123',
                role: 'CUSTOMER',
                accountType: 'B2C',
                addresses: [{
                    street: faker.location.streetAddress(),
                    city: faker.location.city(),
                    state: faker.location.state(),
                    zip: faker.location.zipCode('######'),
                    isDefault: true
                }]
            });
        }
        const createdB2CUsers = await User.create(b2cUsers);
        const allCustomers = [...createdB2BUsers, ...createdB2CUsers];
createdB2BUsers.push(staticB2BUser);
createdB2CUsers.push(staticB2CUser);

        
        
        
        console.log('🌱 Seeding Products...');
        const products = [];
        for (let i = 0; i < 20; i++) {
            const basePrice = faker.number.int({ min: 500, max: 20000 });
            const srp = basePrice + faker.number.int({ min: 100, max: 5000 });
            
            products.push({
                sku: faker.string.alphanumeric({ length: 8, casing: 'upper' }),
                title: faker.commerce.productName(),
                descriptionHTML: `<p>${faker.commerce.productDescription()}</p>`,
                vendor: faker.company.name(),
                tags: [faker.commerce.productAdjective(), 'B2B', 'Wholesale'],
                categoryId: faker.helpers.arrayElement(allCategories)._id,
                images: [
                    { url: faker.image.url(), position: 1, altText: 'Product Image 1' },
                    { url: faker.image.url(), position: 2, altText: 'Product Image 2' }
                ],
                
                dropshipBasePrice: basePrice,
                suggestedRetailPrice: srp,
                
                
                hsnCode: faker.string.numeric(6),
                gstSlab: faker.helpers.arrayElement([0, 5, 12, 18, 28]),
                
                weightGrams: faker.number.int({ min: 100, max: 10000 }),
                moq: faker.number.int({ min: 1, max: 50 }),
                inventory: { stock: faker.number.int({ min: 50, max: 1000 }), alertThreshold: 10 },
                averageRating: faker.number.float({ min: 3, max: 5, multipleOf: 0.1 }),
                reviewCount: faker.number.int({ min: 0, max: 200 })
            });
        }
        const createdProducts = await Product.create(products);

        
        const stockAdjustments = createdProducts.slice(0, 5).map(p => ({
            productId: p._id,
            adminUserId: adminUser._id,
            adjustedAmount: p.inventory.stock,
            reason: 'Initial Inventory Setup'
        }));
        await StockAdjustment.create(stockAdjustments);

        
        
        
        console.log('🌱 Seeding Custom B2B Pricing...');
        const userPricings = [];
        
        for (let i = 0; i < 2; i++) {
            const user = createdB2BUsers[i];
            const selectedProducts = faker.helpers.arrayElements(createdProducts, 3);
            for (const product of selectedProducts) {
                userPricings.push({
                    userId: user._id,
                    productId: product._id,
                    customPrice: Math.floor(product.platformSellPrice * 0.85) 
                });
            }
        }
        await UserPricing.create(userPricings);

        
        
        
        console.log('🌱 Seeding Carts & Wishlists...');
        for (const user of allCustomers) {
            await Cart.create({
                userId: user._id,
                items: faker.helpers.arrayElements(createdProducts, 2).map(p => ({ productId: p._id, qty: faker.number.int({ min: p.moq, max: p.moq + 5 }) }))
            });
            await Wishlist.create({
                userId: user._id,
                items: faker.helpers.arrayElements(createdProducts, 3).map(p => ({ productId: p._id }))
            });
        }

        
        
        
        console.log('🌱 Seeding Transactions (Orders, Invoices, Payments)...');
        
        for (let i = 0; i < 10; i++) {
            const user = faker.helpers.arrayElement(allCustomers);
            const product = faker.helpers.arrayElement(createdProducts);
            const qty = faker.number.int({ min: product.moq, max: 100 });
            const basePrice = product.dropshipBasePrice;
            const taxSlab = 18; 
            const taxAmountPerUnit = (basePrice * taxSlab) / 100;
            const totalItemPrice = (basePrice + taxAmountPerUnit) * qty;

            
            const order = await Order.create({
                orderId: `ORD-${Date.now()}-${i}`,
                userId: user._id,
                status: faker.helpers.arrayElement(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']),
                paymentTerms: user.accountType === 'B2B' ? 'NET_30' : 'DUE_ON_RECEIPT',
                paymentMethod: 'RAZORPAY',
                subTotal: basePrice * qty,
                taxTotal: taxAmountPerUnit * qty,
                grandTotal: totalItemPrice,
                items: [{
                    productId: product._id,
                    sku: product.sku,
                    title: product.title,
                    hsnCode: faker.string.numeric(6),
                    taxSlab,
                    basePrice,
                    taxAmountPerUnit,
                    qty,
                    totalItemPrice
                }]
            });

            
            const invoice = await Invoice.create({
                invoiceNumber: `INV-${Date.now()}-${i}`,
                userId: user._id,
                orderId: order._id,
                invoiceType: 'ORDER_BILL',
                buyerDetails: {
                    companyName: user.companyName || user.name,
                    gstin: user.gstin || '',
                    billingAddress: user.addresses[0]?.street || 'N/A',
                    state: user.addresses[0]?.state || 'N/A'
                },
                subTotal: order.subTotal,
                taxBreakdown: {
                    cgstTotal: (order.taxTotal / 2),
                    sgstTotal: (order.taxTotal / 2),
                    igstTotal: 0
                },
                grandTotal: order.grandTotal,
                dueDate: faker.date.future(),
                status: 'PAID',
                paymentMethod: 'RAZORPAY'
            });

            
            const payment = await Payment.create({
                userId: user._id,
                invoiceId: invoice._id,
                paymentMethod: 'RAZORPAY',
                status: 'SUCCESS',
                referenceId: `pay_${faker.string.alphanumeric(14)}`
            });

            
            if (i % 3 === 0) {
                await WalletTransaction.create({
                    userId: user._id,
                    paymentId: payment._id, 
                    amount: 500,
                    transactionType: 'CREDIT',
                    description: 'Cashback on Order'
                });
            }
        }

        
        for (let i = 0; i < 3; i++) {
            await WalletTransaction.create({
                userId: faker.helpers.arrayElement(createdB2BUsers)._id,
                adminUserId: adminUser._id,
                amount: 10000,
                transactionType: 'CREDIT',
                description: 'Promotional B2B Top-up by Admin'
            });
        }

        console.log('✅ Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
};

seedDatabase();
