import mongoose from 'mongoose';
import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { WalletTransaction } from '../models/WalletTransaction.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { emailService } from '../services/email.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const handleLogisticsWebhook = async (req, res) => {
    return res.status(200).json({ received: true, message: 'Automated webhooks disabled' });
};

export const razorpayWebhook = async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
        console.error('⚠️ Missing RAZORPAY_WEBHOOK_SECRET in .env');
        return res.status(500).json({ status: 'error', message: 'Server configuration error' });
    }

    const payload = Buffer.isBuffer(req.body) ? req.body : req.rawBody || JSON.stringify(req.body);

    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(payload);
    const digest = shasum.digest('hex');

    if (digest !== req.headers['x-razorpay-signature']) {
        console.error('⚠️ SECURITY ALERT: Invalid Razorpay Webhook Signature');
        return res.status(400).json({ status: 'error', message: 'Invalid signature' });
    }

    let eventBody;
    try {
        eventBody = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString('utf8')) : req.body;
    } catch (err) {
        return res.status(400).json({ status: 'error', message: 'Invalid JSON payload' });
    }

    const event = eventBody.event;

    if (event === 'payment.captured') {
        const paymentEntity = eventBody.payload.payment.entity;
        const razorpayOrderId = paymentEntity.order_id;
        const razorpayPaymentId = paymentEntity.id;

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const lockedInvoice = await Invoice.findOneAndUpdate(
                { razorpayOrderId, paymentStatus: { $ne: 'PAID' } },
                { $set: { paymentStatus: 'PAID' } },
                { new: true, session }
            );

            if (!lockedInvoice) {
                await session.abortTransaction();
                session.endSession();
                return res
                    .status(200)
                    .json({ status: 'ok', message: 'Already processed by frontend' });
            }

            await Payment.create(
                [
                    {
                        resellerId: lockedInvoice.resellerId,
                        gatewayOrderId: razorpayOrderId,
                        gatewayPaymentId: razorpayPaymentId,
                        amount: lockedInvoice.grandTotal,
                        paymentMethod: 'UNKNOWN',
                        purpose:
                            lockedInvoice.invoiceType === 'WALLET_TOPUP'
                                ? 'WALLET_RECHARGE'
                                : 'DIRECT_ORDER_PAYMENT',
                        status: 'CAPTURED',
                    },
                ],
                { session }
            );

            if (lockedInvoice.invoiceType === 'ORDER_BILL' && lockedInvoice.orderId) {
                await Order.findByIdAndUpdate(
                    lockedInvoice.orderId,
                    { status: 'PROCESSING' },
                    { session }
                );
            } else if (lockedInvoice.invoiceType === 'WALLET_TOPUP') {
                const updatedUser = await User.findByIdAndUpdate(
                    lockedInvoice.resellerId,
                    { $inc: { walletBalance: lockedInvoice.grandTotal } },
                    { new: true, session }
                );

                await WalletTransaction.create(
                    [
                        {
                            resellerId: lockedInvoice.resellerId,
                            type: 'CREDIT',
                            purpose: 'WALLET_RECHARGE',
                            amount: lockedInvoice.grandTotal,
                            closingBalance: updatedUser?.walletBalance || 0,
                            referenceId: 'TOP-' + razorpayPaymentId,
                            description: `Wallet top-up via Webhook Fallback (${razorpayPaymentId})`,
                            status: 'COMPLETED',
                        },
                    ],
                    { session }
                );
            }

            await session.commitTransaction();
            session.endSession();
            console.log(`✅ Webhook Processed: Order Fulfillment/Top-up for ${razorpayOrderId}`);

            return res.status(200).json({ status: 'ok' });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('❌ Webhook processing error:', error);
            return res.status(500).json({ status: 'error' });
        }
    } else if (event === 'payment.failed') {
        const paymentEntity = eventBody.payload.payment.entity;
        const razorpayOrderId = paymentEntity.order_id;
        const razorpayPaymentId = paymentEntity.id;
        const errorDesc = paymentEntity.error_description || 'External payment failure';

        try {
            const invoice = await Invoice.findOneAndUpdate(
                { razorpayOrderId, paymentStatus: { $ne: 'PAID' } },
                { $set: { paymentStatus: 'FAILED' } }
            );

            if (invoice) {
                await Payment.findOneAndUpdate(
                    { gatewayOrderId: razorpayOrderId },
                    {
                        status: 'FAILED',
                        gatewayPaymentId: razorpayPaymentId,
                        errorMessage: errorDesc,
                    },
                    { upsert: true }
                );

                if (invoice.invoiceType === 'WALLET_TOPUP') {
                    const user = await User.findById(invoice.resellerId);
                    await WalletTransaction.create({
                        resellerId: invoice.resellerId,
                        type: 'CREDIT',
                        purpose: 'WALLET_RECHARGE',
                        amount: invoice.grandTotal,
                        closingBalance: user?.walletBalance || 0,
                        referenceId: 'FAIL-' + (razorpayPaymentId || razorpayOrderId),
                        description: `Failed wallet top-up attempt: ${errorDesc}`,
                        status: 'FAILED',
                    });
                }
                console.log(
                    `❌ Webhook Processed: Marked Invoice ${invoice.invoiceNumber || razorpayOrderId} as FAILED`
                );
            }
            return res.status(200).json({ status: 'ok' });
        } catch (error) {
            console.error('❌ Webhook processing error (failed event):', error);
            return res.status(500).json({ status: 'error' });
        }
    }

    return res.status(200).json({ status: 'ok' });
};

export const handleQikinkWebhook = asyncHandler(async (req, res) => {
    const payload = req.body;
    const headers = req.headers;

    console.log('--- QIKINK WEBHOOK RECEIVED ---');
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Basic validation
    if (!payload || !payload.sku) {
        console.warn('⚠️ Qikink Webhook: Missing payload or SKU');
        return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    try {
        // 1. Ensure "Uncategorized" category exists
        let category = await Category.findOne({ name: 'Qikink' });
        if (!category) {
            category = await Category.create({ name: 'Qikink' });
        }

        // 2. Map Qikink fields to Product model
        // Note: Field names are based on common Qikink push patterns
        const productData = {
            sku: payload.sku || payload.product_id,
            title: payload.name || payload.title || 'New Qikink Product',
            descriptionHTML: payload.description || payload.body_html || '',
            vendor: payload.vendor || 'Qikink',
            categoryId: category._id,
            images: (payload.images || []).map((img, index) => ({
                url: typeof img === 'string' ? img : img.src || img.url,
                position: index + 1,
                altText: payload.name || 'Product Image',
            })),
            dropshipBasePrice: Number(payload.price || payload.cost || 0),
            suggestedRetailPrice: Number(payload.mrp || payload.price || 0) * 1.5, // Default margin
            weightGrams: Number(payload.weight || 500),
            hsnCode: payload.hsn_code || '6109', // Default HSN for apparel
            gstSlab: 5, // Default GST for apparel
            status: 'active',
            inventory: {
                stock: payload.stock || 100,
                alertThreshold: 10,
            },
        };

        // If no images found in payload.images, try payload.image
        if (productData.images.length === 0 && payload.image) {
            productData.images.push({
                url: typeof payload.image === 'string' ? payload.image : payload.image.src,
                position: 1,
                altText: productData.title,
            });
        }

        // 3. Upsert product by SKU
        const product = await Product.findOneAndUpdate({ sku: productData.sku }, productData, {
            new: true,
            upsert: true,
            runValidators: true,
        });

        console.log(`✅ Qikink Product Synced: ${product.title} (${product.sku})`);

        return res.status(200).json({
            success: true,
            message: 'Product synced successfully',
            productId: product._id,
        });
    } catch (error) {
        console.error('❌ Qikink Webhook Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during sync',
            error: error.message,
        });
    }
});
