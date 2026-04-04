import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboardAnalytics = asyncHandler(async (req, res) => {
    const { range = 'month' } = req.query;

    const now = new Date();
    let startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0); // Always normalize to start of day for accurate interval counts

    let groupingFormat = '%Y-%m-%d';
    let intervals = 30;
    let labelFormat = { month: 'short', day: '2-digit' };
    let isHourly = false;

    switch (range) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            groupingFormat = '%H';
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
        for (let i = intervals - 1; i >= 0; i--) {
            const d = new Date();
            d.setMonth(now.getMonth() - i);
            const monthStr = d.toISOString().slice(0, 7);
            const monthData = trendMap.get(monthStr);
            completeRevenueTrend.push({
                date: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                Revenue: monthData?.revenue || 0,
                Orders: monthData?.orders || 0,
            });
        }
    } else {
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

    const orderStatus = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

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

    const periodRevenueAgg = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$totalPlatformCost' } } },
    ]);
    const periodRevenue = periodRevenueAgg[0]?.total || 0;

    const totalCustomers = await User.countDocuments({
        role: 'RESELLER',
        deletedAt: null,
        createdAt: { $gte: startDate }
    });
    const processingOrders = await Order.countDocuments({
        status: 'PROCESSING',
        createdAt: { $gte: startDate }
    });
    const pendingKycCount = await User.countDocuments({
        role: 'RESELLER',
        kycStatus: 'PENDING',
        isActive: true,
        deletedAt: null,
        createdAt: { $gte: startDate }
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

export const getResellerAnalytics = asyncHandler(async (req, res) => {
    const resellerId = req.user._id;
    const { range = 'month' } = req.query;

    const now = new Date();
    let startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);

    let intervals = 30;
    let labelFormat = { month: 'short', day: 'numeric' };

    switch (range) {
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
        default:
            startDate.setDate(now.getDate() - 30);
            intervals = 30;
    }

    const kpiAggregation = await Order.aggregate([
        { $match: { resellerId: resellerId } },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },

                realizedProfit: {
                    $sum: {
                        $cond: [
                            { $eq: ['$status', 'PROFIT_CREDITED'] },
                            '$resellerProfitMargin',
                            0,
                        ],
                    },
                },

                pendingProfit: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    // FIX: Include PENDING and NDR to match frontend logic
                                    { $in: ['$status', ['PENDING', 'PROCESSING', 'SHIPPED', 'NDR', 'DELIVERED']] },
                                    // FIX: Only count margins for COD orders (Prepaid are collected directly by reseller)
                                    { $eq: ['$paymentMethod', 'COD'] }
                                ]
                            },
                            {
                                // FIX: Calculate dynamic margin fallback for older glitched orders where DB saved 0
                                $cond: [
                                    { $gt: ['$resellerProfitMargin', 0] },
                                    '$resellerProfitMargin',
                                    { $subtract: ['$amountToCollect', '$totalPlatformCost'] }
                                ]
                            },
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

    const trendAggregation = await Order.aggregate([
        {
            $match: {
                resellerId: resellerId,
                createdAt: { $gte: startDate },
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

    const trendMap = new Map(trendAggregation.map((item) => [item._id, item.dailyProfit]));
    const profitTrend = [];
    for (let i = intervals - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        profitTrend.push({
            date: d.toLocaleDateString('en-US', labelFormat),
            profit: trendMap.get(dateString) || 0,
        });
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                kpis: {
                    realizedProfit: kpis.realizedProfit,
                    // Ensure we don't send back negative pending profit due to glitched legacy data
                    pendingProfit: Math.max(0, kpis.pendingProfit),
                    rtoRate,
                    ndrActionRequired: kpis.ndrActionRequired,
                },
                profitTrend,
            },
            'Reseller analytics fetched successfully'
        )
    );
});