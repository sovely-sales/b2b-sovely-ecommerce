import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import mongoose from 'mongoose';
import { TOP_LEVEL_CATEGORIES } from '../config/categories.js';

export const getCategories = asyncHandler(async (req, res) => {
    // Return standard high-level categories instead of all 3,800 micro-categories
    const categories = TOP_LEVEL_CATEGORIES.map(cat => ({
        _id: cat._id,
        name: cat.name,
        icon: cat.icon
    }));

    return res
        .status(200)
        .json(new ApiResponse(200, categories, 'Categories fetched successfully'));
});
