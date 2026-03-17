import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboardAnalytics = asyncHandler(async (req, res) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueTrend = await Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $ne: 'CANCELLED' } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                revenue: { $sum: '$totalAmount' },
                orders: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    const trendMap = new Map(revenueTrend.map((item) => [item._id, item]));
    const completeRevenueTrend = [];

    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];

        const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
        const dayData = trendMap.get(dateString);

        completeRevenueTrend.push({
            date: displayDate,
            Revenue: dayData?.revenue || 0,
            Orders: dayData?.orders || 0,
        });
    }

    const orderStatus = await Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);

    const inventoryHealth = await Product.aggregate([
        {
            $project: {
                stockStatus: {
                    $cond: {
                        if: { $eq: ['$inventory.stock', 0] },
                        then: 'Out of Stock',
                        else: {
                            $cond: {
                                if: { $lte: ['$inventory.stock', 10] },
                                then: 'Low Stock',
                                else: 'In Stock',
                            },
                        },
                    },
                },
            },
        },
        { $group: { _id: '$stockStatus', count: { $sum: 1 } } },
    ]);

    const totalRevenueAgg = await Order.aggregate([
        { $match: { status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    const totalCustomers = await User.countDocuments({ role: 'CUSTOMER' });
    const processingOrders = await Order.countDocuments({ status: 'PROCESSING' });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                kpis: { totalRevenue, totalCustomers, processingOrders },
                revenueTrend: completeRevenueTrend,
                orderStatus: orderStatus.map((item) => ({ name: item._id, value: item.count })),
                inventoryHealth: inventoryHealth.map((item) => ({
                    name: item._id,
                    value: item.count,
                })),
            },
            'Analytics fetched successfully'
        )
    );
});
