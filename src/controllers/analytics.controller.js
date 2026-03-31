import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboardAnalytics = asyncHandler(async (req, res) => {
    const { range = 'month' } = req.query;

    const now = new Date();
    let startDate = new Date();
    let groupingFormat = '%Y-%m-%d';
    let intervals = 30; // Default days
    let labelFormat = { month: 'short', day: '2-digit' };
    let isHourly = false;

    switch (range) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            groupingFormat = '%H'; // Group by hour
            intervals = 24;
            isHourly = true;
            break;
        case 'week':
            startDate.setDate(now.getDate() - 7);
            intervals = 7;
            break;
        case 'month':
            startDate.setDate(now.getDate() - 30);
            intervals = 30;
            break;
        case '3months':
            startDate.setDate(now.getDate() - 90);
            intervals = 90;
            break;
        case '6months':
            startDate.setMonth(now.getMonth() - 6);
            groupingFormat = '%Y-%m';
            intervals = 6;
            break;
        case 'yearly':
            startDate.setFullYear(now.getFullYear() - 1);
            groupingFormat = '%Y-%m';
            intervals = 12;
            break;
        default:
            startDate.setDate(now.getDate() - 30);
            intervals = 30;
    }

    // 1. Revenue & Order Trends
    const revenueTrend = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $ne: 'CANCELLED' } } },
        {
            $group: {
                _id: { $dateToString: { format: groupingFormat, date: '$createdAt' } },
                revenue: { $sum: '$totalPlatformCost' },
                orders: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    const trendMap = new Map(revenueTrend.map((item) => [item._id, item]));
    const completeRevenueTrend = [];

    if (isHourly) {
        for (let i = 0; i < 24; i++) {
            const hourStr = String(i).padStart(2, '0');
            const hourData = trendMap.get(hourStr);
            completeRevenueTrend.push({
                date: `${hourStr}:00`,
                Revenue: hourData?.revenue || 0,
                Orders: hourData?.orders || 0,
            });
        }
    } else if (groupingFormat === '%Y-%m') {
        // Group by Month
        for (let i = intervals - 1; i >= 0; i--) {
            const d = new Date();
            d.setMonth(now.getMonth() - i);
            const monthStr = d.toISOString().slice(0, 7); // YYYY-MM
            const monthData = trendMap.get(monthStr);
            completeRevenueTrend.push({
                date: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                Revenue: monthData?.revenue || 0,
                Orders: monthData?.orders || 0,
            });
        }
    } else {
        // Group by Day
        for (let i = intervals - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateString = d.toISOString().split('T')[0];
            const dayData = trendMap.get(dateString);
            completeRevenueTrend.push({
                date: d.toLocaleDateString('en-US', labelFormat),
                Revenue: dayData?.revenue || 0,
                Orders: dayData?.orders || 0,
            });
        }
    }

    // 2. Order Status Distribution (Filtered by startDate)
    const orderStatus = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // 3. Inventory Health (Global snapshot, not affected by range)
    const inventoryHealth = await Product.aggregate([
        { $match: { deletedAt: null } },
        {
            $project: {
                stockStatus: {
                    $cond: {
                        if: { $eq: ['$inventory.stock', 0] },
                        then: 'Out of Stock',
                        else: {
                            $cond: {
                                if: { $lte: ['$inventory.stock', '$inventory.alertThreshold'] },
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

    // 4. Period Revenue
    const periodRevenueAgg = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$totalPlatformCost' } } },
    ]);
    const periodRevenue = periodRevenueAgg[0]?.total || 0;

    // Fixed Comparisons (Always show 30d/7d for secondary metrics if needed, but here we just return period total)
    const totalCustomers = await User.countDocuments({ role: 'RESELLER', deletedAt: null });
    const processingOrders = await Order.countDocuments({ status: 'PROCESSING' });
    const pendingKycCount = await User.countDocuments({
        role: 'RESELLER',
        kycStatus: 'PENDING',
        isActive: true,
        deletedAt: null,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                selectedRange: range,
                kpis: { periodRevenue, totalCustomers, processingOrders, pendingKycCount },
                revenueTrend: completeRevenueTrend,
                orderStatus: orderStatus.map((item) => ({ name: item._id, value: item.count })),
                inventoryHealth: inventoryHealth.map((item) => ({
                    name: item._id,
                    value: item.count,
                })),
            },
            `Analytics for ${range} fetched successfully`
        )
    );
});

// Add this export to your analytics.controller.js
export const getResellerAnalytics = asyncHandler(async (req, res) => {
    const resellerId = req.user._id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Lifetime & Operational KPIs
    const kpiAggregation = await Order.aggregate([
        { $match: { resellerId: resellerId } },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                // Realized profit (money in their wallet/bank)
                realizedProfit: {
                    $sum: {
                        $cond: [
                            { $eq: ['$status', 'PROFIT_CREDITED'] },
                            '$resellerProfitMargin',
                            0,
                        ],
                    },
                },
                // Pending profit (shipped/delivered but not yet remitted)
                pendingProfit: {
                    $sum: {
                        $cond: [
                            { $in: ['$status', ['SHIPPED', 'DELIVERED', 'PROCESSING']] },
                            '$resellerProfitMargin',
                            0,
                        ],
                    },
                },
                rtoOrders: {
                    $sum: { $cond: [{ $eq: ['$status', 'RTO'] }, 1, 0] },
                },
                ndrActionRequired: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ['$status', 'NDR'] },
                                    { $eq: ['$ndrDetails.resellerAction', 'PENDING'] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
            },
        },
    ]);

    const kpis = kpiAggregation[0] || {
        totalOrders: 0,
        realizedProfit: 0,
        pendingProfit: 0,
        rtoOrders: 0,
        ndrActionRequired: 0,
    };

    const rtoRate =
        kpis.totalOrders > 0 ? Math.round((kpis.rtoOrders / kpis.totalOrders) * 100) : 0;

    // 2. 30-Day Profit Trend
    const trendAggregation = await Order.aggregate([
        {
            $match: {
                resellerId: resellerId,
                createdAt: { $gte: thirtyDaysAgo },
                status: { $ne: 'CANCELLED' },
            },
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                dailyProfit: { $sum: '$resellerProfitMargin' },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Format trend data for the frontend graph
    const trendMap = new Map(trendAggregation.map((item) => [item._id, item.dailyProfit]));
    const profitTrend = [];
    for (let i = 14; i >= 0; i--) {
        // Sending 15 days of data for a cleaner UI chart
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        profitTrend.push({
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            profit: trendMap.get(dateString) || 0,
        });
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                kpis: {
                    realizedProfit: kpis.realizedProfit,
                    pendingProfit: kpis.pendingProfit,
                    rtoRate,
                    ndrActionRequired: kpis.ndrActionRequired,
                },
                profitTrend,
            },
            'Reseller analytics fetched successfully'
        )
    );
});
