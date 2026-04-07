import dotenv from 'dotenv';
dotenv.config();
import connectDB from './db/index.js';
import { app } from './app.js';
import cron from 'node-cron';
import { syncProductRtoRates } from './services/analytics.service.js';
import { Order } from './models/Order.js';
import { User } from './models/User.js';
import { WalletTransaction } from './models/WalletTransaction.js';
import mongoose from 'mongoose';

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`⚙️ Server is running at port : ${process.env.PORT}`);

            cron.schedule(
                '0 2 * * *',
                () => {
                    syncProductRtoRates();
                },
                {
                    timezone: 'Asia/Kolkata',
                }
            );

            cron.schedule('0 * * * *', async () => {
                console.log('⏳ [CRON] Running SLA check for expired NDRs...');
                try {
                    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    const expiredOrders = await Order.find({
                        status: 'NDR',
                        'ndrDetails.resellerAction': 'PENDING',
                        updatedAt: { $lt: twentyFourHoursAgo },
                    });

                    for (const order of expiredOrders) {
                        const session = await mongoose.startSession();
                        session.startTransaction();
                        try {
                            order.status = 'RTO';
                            order.ndrDetails.resellerAction = 'RTO_REQUESTED';
                            order.statusHistory.push({
                                status: 'RTO',
                                comment: 'System Auto-RTO: Reseller failed to act within 24h SLA.',
                            });

                            const refundAmount = order.subTotal + order.taxTotal + order.codCharge;

                            if (refundAmount > 0) {
                                const updatedReseller = await User.findByIdAndUpdate(
                                    order.resellerId,
                                    { $inc: { walletBalance: refundAmount } },
                                    { new: true, session }
                                );

                                await WalletTransaction.create(
                                    [
                                        {
                                            resellerId: order.resellerId,
                                            type: 'CREDIT',
                                            purpose: 'REFUND',
                                            amount: refundAmount,
                                            closingBalance: updatedReseller.walletBalance,
                                            referenceId: order.orderId,
                                            description: `Auto-RTO SLA Refund for ${order.orderId}. Freight forfeited.`,
                                            status: 'COMPLETED',
                                        },
                                    ],
                                    { session }
                                );

                                order.statusHistory.push({
                                    status: 'REFUND_PROCESSED',
                                    comment: `₹${refundAmount} auto-refunded to wallet (SLA Breach).`,
                                });
                            }

                            await order.save({ session });
                            await session.commitTransaction();
                            session.endSession();
                            console.log(`✅ Auto-RTO applied to expired order: ${order.orderId}`);
                        } catch (err) {
                            await session.abortTransaction();
                            session.endSession();
                            console.error(`❌ Auto-RTO failed for ${order.orderId}`, err);
                        }
                    }
                } catch (error) {
                    console.error('Failed to run NDR SLA Cron:', error);
                }
            });
        });
    })
    .catch((err) => {
        console.log('MONGO db connection failed !!! ', err);
    });
