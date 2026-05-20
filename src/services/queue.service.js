import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { qikinkService } from './qikink.service.js';
import { Order } from '../models/Order.js';

const connection = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
    : new Redis({ host: '127.0.0.1', port: 6379, maxRetriesPerRequest: null });

export const qikinkOrderQueue = new Queue('qikink-orders', { connection });

export const qikinkOrderWorker = new Worker(
    'qikink-orders',
    async (job) => {
        const { orderId } = job.data;

        const order = await Order.findById(orderId).populate('items.productId');
        if (!order) throw new Error(`Order ${orderId} not found in DB`);

        if (order.qikinkOrderId) {
            console.log(`Order ${order.orderId} already pushed to Qikink. Skipping.`);
            return;
        }

        console.log(`Processing Qikink sync for order ${order.orderId}...`);

        const qikinkId = await qikinkService.placeOrder(order);

        await Order.findByIdAndUpdate(orderId, {
            qikinkOrderId: qikinkId,
            $push: {
                statusHistory: {
                    status: 'PROCESSING',
                    comment: `Order successfully pushed to Qikink. Partner ID: ${qikinkId}`,
                },
            },
        });

        console.log(`✅ Order ${order.orderId} synced. Qikink ID: ${qikinkId}`);
    },
    {
        connection,
        concurrency: 5,
    }
);

qikinkOrderWorker.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed for order ${job.data.orderId}:`, err.message);
});
