import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';

export const syncProductRtoRates = async () => {
    try {
        console.log('Starting nightly RTO rate calculation...');

        const rtoStats = await Order.aggregate([
            { $unwind: '$items' },

            {
                $group: {
                    _id: '$items.productId',
                    totalTimesOrdered: { $sum: 1 },
                    rtoTimes: {
                        $sum: {
                            $cond: [{ $in: ['$status', ['RTO', 'RTO_DELIVERED']] }, 1, 0],
                        },
                    },
                },
            },

            {
                $project: {
                    rtoRate: {
                        $round: [
                            { $multiply: [{ $divide: ['$rtoTimes', '$totalTimesOrdered'] }, 100] },
                            2,
                        ],
                    },
                },
            },
        ]);

        if (rtoStats.length === 0) {
            console.log('No order data to process for RTO rates.');
            return;
        }

        const bulkOps = rtoStats.map((stat) => ({
            updateOne: {
                filter: { _id: stat._id },
                update: { $set: { historicalRtoRate: stat.rtoRate } },
            },
        }));

        const result = await Product.bulkWrite(bulkOps);

        console.log(`RTO Sync Complete. Updated ${result.modifiedCount} products.`);
    } catch (error) {
        console.error('Failed to sync RTO rates:', error);
    }
};
