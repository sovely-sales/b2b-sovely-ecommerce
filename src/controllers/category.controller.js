import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import mongoose from 'mongoose';

export const getCategories = asyncHandler(async (req, res) => {
    const rawCategories = await Category.aggregate([
        {
            $match: {
                parentCategoryId: null,
                name: { $ne: 'Uncategorized' },
            },
        },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: 'categoryId',
                as: 'products',
            },
        },
        {
            $project: {
                name: 1,
                productCount: { $size: '$products' },
            },
        },
        { $sort: { name: 1 } },
    ]);

    const seen = new Set();
    const categories = rawCategories.filter((category) => {
        const normalizedName = category.name.trim().toLowerCase();
        if (seen.has(normalizedName)) {
            return false;
        }

        seen.add(normalizedName);
        return true;
    });

    return res
        .status(200)
        .json(new ApiResponse(200, categories, 'Categories fetched successfully'));
});
