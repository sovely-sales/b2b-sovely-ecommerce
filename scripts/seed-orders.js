import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fakerEN_IN as faker } from '@faker-js/faker';


import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { Order } from '../src/models/Order.js';
import { Invoice } from '../src/models/Invoice.js';
import { Payment } from '../src/models/Payment.js';

dotenv.config();


const PLATFORM_STATE = 'Karnataka'; 

const seedOrders = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/db_sovely`);
        console.log('📦 Connected to DB. Clearing old Orders, Invoices, and Payments...');
        await Order.deleteMany({});
        await Invoice.deleteMany({});
        await Payment.deleteMany({});

        
        const resellers = await User.find({ role: 'RESELLER' });
        const products = await Product.find({ status: 'active' });

        if (resellers.length === 0 || products.length === 0) {
            console.error('❌ Missing dependencies. Please run users and products seeders first.');
            process.exit(1);
        }

        console.log(`🌱 Generating 1000 Realistic Orders & Invoices over the last 6 months...`);
        
        for (let i = 0; i < 1000; i++) {
            const reseller = faker.helpers.arrayElement(resellers);
            const numItems = faker.number.int({ min: 1, max: 3 });
            const selectedProducts = faker.helpers.arrayElements(products, numItems);
            
            
            const orderDate = faker.date.recent({ days: 180 });
            const isInterState = reseller.billingAddress?.state !== PLATFORM_STATE;

            
            const orderItems = [];
            let subTotal = 0;
            let taxTotal = 0;
            let shippingTotal = 0;
            let amountToCollect = 0; 

            selectedProducts.forEach(product => {
                const qty = faker.number.int({ min: 1, max: 5 });
                const platformBasePrice = product.dropshipBasePrice;
                const resellerSellingPrice = product.suggestedRetailPrice;
                
                const taxAmountPerUnit = platformBasePrice * (product.gstSlab / 100);
                const shippingCost = faker.number.int({ min: 40, max: 120 }); 

                orderItems.push({
                    productId: product._id,
                    sku: product.sku,
                    title: product.title,
                    image: product.images[0]?.url || '',
                    hsnCode: product.hsnCode,
                    qty,
                    platformBasePrice,
                    resellerSellingPrice,
                    taxAmountPerUnit,
                    gstSlab: product.gstSlab,
                    shippingCost
                });

                subTotal += (platformBasePrice * qty);
                taxTotal += (taxAmountPerUnit * qty);
                shippingTotal += shippingCost;
                amountToCollect += (resellerSellingPrice * qty) + shippingCost; 
            });

            const totalPlatformCost = subTotal + taxTotal + shippingTotal;
            const resellerProfitMargin = amountToCollect - totalPlatformCost;

            // Randomize Status to test different UI states
            const orderStatus = faker.helpers.arrayElement(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'DELIVERED', 'RTO']);

            
            const order = await Order.create({
                orderId: `ORD-${faker.string.numeric(8)}`,
                resellerId: reseller._id,
                endCustomerDetails: {
                    name: faker.person.fullName(),
                    phone: faker.phone.number('9#########'),
                    address: {
                        street: faker.location.streetAddress(),
                        city: faker.location.city(),
                        state: faker.location.state(),
                        zip: faker.location.zipCode('######')
                    }
                },
                status: orderStatus,
                statusHistory: [{ status: 'PENDING', date: orderDate }],
                paymentMethod: faker.helpers.arrayElement(['COD', 'PREPAID_WALLET', 'PREPAID_GATEWAY']),
                subTotal,
                taxTotal,
                shippingTotal,
                totalPlatformCost,
                amountToCollect,
                resellerProfitMargin,
                items: orderItems,
                orderDate,
                createdAt: orderDate 
            });

            
            const invoiceItems = orderItems.map(item => {
                const totalBaseAmount = item.platformBasePrice * item.qty;
                const totalItemTax = item.taxAmountPerUnit * item.qty;
                
                let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
                
                if (isInterState) {
                    igstAmount = totalItemTax;
                } else {
                    cgstAmount = totalItemTax / 2;
                    sgstAmount = totalItemTax / 2;
                }

                return {
                    productId: item.productId,
                    sku: item.sku,
                    title: item.title,
                    hsnCode: item.hsnCode,
                    qty: item.qty,
                    unitBasePrice: item.platformBasePrice,
                    totalBaseAmount,
                    gstSlab: item.gstSlab,
                    cgstAmount,
                    sgstAmount,
                    igstAmount,
                    totalItemAmount: totalBaseAmount + totalItemTax
                };
            });

            const invoice = await Invoice.create({
                invoiceNumber: `INV-${faker.string.numeric(8)}`,
                orderId: order._id,
                resellerId: reseller._id,
                invoiceType: 'B2B_WHOLESALE',
                isInterState,
                billedTo: {
                    companyName: reseller.companyName || reseller.name,
                    gstin: reseller.gstin,
                    address: {
                        street: reseller.billingAddress?.street || 'N/A',
                        city: reseller.billingAddress?.city || 'N/A',
                        state: reseller.billingAddress?.state || 'N/A',
                        zip: reseller.billingAddress?.zip || 'N/A',
                        stateCode: isInterState ? 'IGST' : 'CGST/SGST' 
                    }
                },
                shippedTo: order.endCustomerDetails, 
                items: invoiceItems,
                totalTaxableValue: subTotal,
                totalCgst: isInterState ? 0 : taxTotal / 2,
                totalSgst: isInterState ? 0 : taxTotal / 2,
                totalIgst: isInterState ? taxTotal : 0,
                grandTotal: totalPlatformCost, 
                paymentStatus: order.paymentMethod.includes('PREPAID') ? 'PAID' : 'UNPAID',
                status: 'GENERATED',
                generatedAt: orderDate,
                createdAt: orderDate
            });

            
            if (order.paymentMethod === 'PREPAID_GATEWAY') {
                await Payment.create({
                    resellerId: reseller._id,
                    gatewayOrderId: `order_${faker.string.alphanumeric(14)}`,
                    gatewayPaymentId: `pay_${faker.string.alphanumeric(14)}`,
                    amount: totalPlatformCost,
                    paymentMethod: faker.helpers.arrayElement(['UPI', 'CREDIT_CARD', 'NETBANKING']),
                    purpose: 'DIRECT_ORDER_PAYMENT',
                    status: 'CAPTURED',
                    createdAt: orderDate
                });
            }
        }

        
        console.log(`🌱 Generating Wallet Top-Up Data...`);
        for(let i=0; i < 100; i++) {
            const reseller = faker.helpers.arrayElement(resellers);
            const topUpAmount = faker.helpers.arrayElement([5000, 10000, 20000]);
            
            await Invoice.create({
                invoiceNumber: `WTU-${faker.string.numeric(8)}`,
                resellerId: reseller._id,
                invoiceType: 'WALLET_TOPUP',
                grandTotal: topUpAmount,
                paymentStatus: 'PAID',
                status: 'GENERATED'
                
            });

            await Payment.create({
                resellerId: reseller._id,
                gatewayOrderId: `order_${faker.string.alphanumeric(14)}`,
                gatewayPaymentId: `pay_${faker.string.alphanumeric(14)}`,
                amount: topUpAmount,
                paymentMethod: 'UPI',
                purpose: 'WALLET_RECHARGE',
                status: 'CAPTURED'
            });
        }

        console.log('✅ Orders, Invoices, and Payments Seeding Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Orders Seeding Failed:', error);
        process.exit(1);
    }
};

seedOrders();
